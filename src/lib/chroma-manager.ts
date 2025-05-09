import { ChromaClient, Collection } from "chromadb";
import {
  Document,
  DocumentMetadata,
  ChromaDBManagerConfig,
  CollectionInfo,
  QueryResult,
} from "@/types/embeddings";
import { TextSplitter } from "./text-splitter";
import { OllamaEmbeddings } from "./ollama";
import { v4 as uuidv4 } from "uuid";

// Ensure this code only runs on the server side
if (typeof window !== "undefined") {
  throw new Error("ChromaDBManager can only be used on the server side");
}

interface ChromaQueryResult {
  ids?: string[] | string[][];
  embeddings?: number[][] | number[][][];
  documents?: string[] | string[][];
  metadatas?: Record<string, unknown>[] | Record<string, unknown>[][];
  distances?: number[] | number[][];
}

export class ChromaDBManager {
  private client: ChromaClient;
  private collection!: Collection;
  private textSplitter: TextSplitter;
  private embeddingFunction: OllamaEmbeddings;
  private collectionName: string;
  private persistDirectory: string;
  private dimension?: number;

  constructor(config: ChromaDBManagerConfig = {}) {
    this.collectionName = config.collectionName || "";
    this.persistDirectory = config.persistDirectory || "./chroma_db";
    this.dimension = config.dimension;

    this.client = new ChromaClient({
      path: process.env.NEXT_PUBLIC_CHROMA_DB_PATH || "http://localhost:8000",
    });

    this.textSplitter = new TextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });

    this.embeddingFunction = new OllamaEmbeddings({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Skip initialization if no collection name is provided (for listing collections)
      if (!this.collectionName) {
        return;
      }

      // Check if collection exists first
      const collections = await this.client.listCollections();
      const exists = collections.includes(this.collectionName);

      // Current timestamp
      const timestamp = new Date().toISOString();

      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          "hnsw:space": "cosine",
          persist_directory: this.persistDirectory,
          dimension: this.dimension,
          created: exists ? undefined : timestamp, // Only set on creation
          updated: timestamp, // Always update this timestamp
        },
      });

      // If collection already existed but we want to ensure it has timestamps
      if (exists) {
        const metadata = await this.getCollectionMetadata(this.collection);
        if (!metadata.created) {
          // @ts-expect-error - ChromaDB client types may not include modify
          await this.collection.modify({
            metadata: {
              ...metadata,
              created: timestamp,
              updated: timestamp,
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to initialize collection:", error);
      throw error;
    }
  }

  private calculateChunkIds(chunks: Document[]): Document[] {
    let lastPageId: string | null = null;
    let currentChunkIndex = 0;

    return chunks.map((chunk) => {
      const source = chunk.metadata.source || "unknown";
      const page = chunk.metadata.page || 0;
      const currentPageId = `${source}:${page}`;

      if (currentPageId === lastPageId) {
        currentChunkIndex += 1;
      } else {
        currentChunkIndex = 0;
      }

      const chunkId = `${currentPageId}:${currentChunkIndex}`;
      lastPageId = currentPageId;

      return {
        ...chunk,
        metadata: {
          ...chunk.metadata,
          id: chunkId,
        },
      };
    });
  }

  async addDocuments(
    documents: Document[],
    updateExisting = true
  ): Promise<void> {
    // Skip text splitting for single documents with IDs
    const shouldSplit = documents.length > 1 || !documents[0].metadata?.id;
    const chunks = shouldSplit
      ? this.textSplitter.splitDocuments(documents)
      : documents;

    const chunksWithIds = shouldSplit ? this.calculateChunkIds(chunks) : chunks;

    if (updateExisting) {
      // Get existing IDs
      const existingItems = await this.collection.get();
      const existingIds = new Set(existingItems.ids);

      // Filter out existing documents
      const newChunks = chunksWithIds.filter(
        (doc) => !existingIds.has(doc.metadata.id!)
      );

      if (newChunks.length > 0) {
        await this.addChunksToCollection(newChunks);
        await this.updateCollectionTimestamp();
      }
    } else {
      await this.addChunksToCollection(chunksWithIds);
      await this.updateCollectionTimestamp();
    }
  }

  private async addChunksToCollection(chunks: Document[]): Promise<void> {
    try {
      const embeddings = await this.embeddingFunction.embed(
        chunks.map((c) => c.pageContent)
      );

      // Convert metadata to Chroma's expected format
      const metadatas = chunks.map((c) => {
        const metadata: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(c.metadata)) {
          if (value !== undefined) {
            metadata[key] = value;
          }
        }
        return metadata;
      });

      await this.collection.add({
        ids: chunks.map((c) => c.metadata.id!),
        embeddings,
        metadatas,
        documents: chunks.map((c) => c.pageContent),
      });
    } catch (error) {
      console.error("Error adding chunks to collection:", error);
      throw new Error(
        `Failed to add documents: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async getCollectionMetadata(
    collection: Collection
  ): Promise<Record<string, unknown>> {
    try {
      if (!collection.metadata) {
        return {};
      }
      return (collection.metadata as Record<string, unknown>) || {};
    } catch {
      return {};
    }
  }

  // Helper to safely get a string value from metadata
  private getMetadataString(
    metadata: Record<string, unknown>,
    key: string
  ): string {
    const value = metadata[key];
    if (typeof value === "string") {
      return value;
    }
    if (value != null) {
      return String(value); // Convert non-null values to string
    }
    return new Date().toISOString(); // Default to current date
  }

  async listCollections(): Promise<CollectionInfo[]> {
    try {
      const collections = await this.client.listCollections();
      const collectionInfos: CollectionInfo[] = [];

      for (const collection of collections) {
        const col = await this.client.getCollection({ name: collection });
        const metadata = await this.getCollectionMetadata(col);
        const dimension = (metadata.dimension as number) || 1536; // Default to 1536 if not specified

        collectionInfos.push({
          name: collection,
          count: await col.count(),
          dimension,
          metadata: metadata as {
            created?: string;
            updated?: string;
            [key: string]: string | number | undefined;
          },
        });
      }

      return collectionInfos;
    } catch (error) {
      console.error("Failed to list collections:", error);
      throw error;
    }
  }

  async getCollectionInfo(): Promise<CollectionInfo> {
    const metadata = await this.getCollectionMetadata(this.collection);
    const dimension = (metadata.dimension as number) || 1536; // Default to 1536 if not specified

    return {
      name: this.collectionName,
      count: await this.collection.count(),
      dimension,
      metadata: metadata as {
        created?: string;
        updated?: string;
        [key: string]: string | number | undefined;
      },
    };
  }

  private ensureDocumentId(metadata: DocumentMetadata): {
    id: string;
    [key: string]: string | number | boolean | null | undefined;
  } {
    const id = metadata.id || uuidv4();
    return {
      ...metadata,
      id,
    };
  }

  private processQueryResults(results: ChromaQueryResult): QueryResult[] {
    if (!results.documents || !results.embeddings) {
      return [];
    }

    const docs = Array.isArray(results.documents[0])
      ? results.documents[0]
      : results.documents;
    const embeddings = Array.isArray(results.embeddings[0])
      ? results.embeddings[0]
      : results.embeddings;
    const metadatas =
      results.metadatas &&
      (Array.isArray(results.metadatas[0])
        ? results.metadatas[0]
        : results.metadatas);
    const distances =
      results.distances &&
      (Array.isArray(results.distances[0])
        ? results.distances[0]
        : results.distances);

    return docs.map((doc, i) => {
      const metadata = (metadatas && metadatas[i]) || {};
      const documentMetadata = this.ensureDocumentId(
        metadata as DocumentMetadata
      );
      const content = Array.isArray(doc) ? doc.join(" ") : doc;
      const embedding = Array.isArray(embeddings[i])
        ? embeddings[i]
        : [embeddings[i]];
      const distance = distances ? distances[i] : undefined;

      return {
        pageContent: content || "",
        metadata: documentMetadata,
        embedding: embedding as number[],
        distance,
      };
    });
  }

  async query(
    queryText: string,
    nResults = 5,
    where: Record<string, unknown> = {}
  ): Promise<QueryResult[]> {
    const embedding = (await this.embeddingFunction.embed([queryText]))[0];

    const results = await this.collection.query({
      queryEmbeddings: [embedding],
      nResults,
      where: Object.keys(where).length > 0 ? where : undefined,
      include: ["embeddings", "documents", "distances", "metadatas"] as const,
    });

    return this.processQueryResults(results);
  }

  async getAllDocuments(): Promise<QueryResult[]> {
    const results = await this.collection.get({
      include: ["embeddings", "documents", "metadatas"] as const,
    });

    if (
      !results.documents ||
      results.documents.length === 0 ||
      !results.embeddings
    ) {
      return [];
    }

    return results.documents.map((doc, i) => {
      const metadata = results.metadatas?.[i] || {};
      const documentMetadata = this.ensureDocumentId(
        metadata as DocumentMetadata
      );

      return {
        pageContent: doc || "",
        metadata: documentMetadata,
        embedding: results.embeddings![i],
      };
    });
  }

  async deleteCollection(): Promise<void> {
    await this.client.deleteCollection({ name: this.collectionName });
  }

  async updateDocument(docId: string, newText: string): Promise<void> {
    // Get the existing document to preserve metadata
    const results = await this.collection.get({
      where: { id: docId },
    });

    if (!results.ids || results.ids.length === 0) {
      throw new Error("Document not found");
    }

    // Get the embedding for the new text
    const embedding = await this.embeddingFunction.embed([newText]);

    // Update the document with new text and embedding while preserving metadata
    await this.collection.update({
      ids: [docId],
      embeddings: [embedding[0]],
      documents: [newText],
      metadatas: [results.metadatas?.[0] || {}],
    });

    // Update collection timestamp
    await this.updateCollectionTimestamp();
  }

  async deleteDocument(docId: string): Promise<void> {
    await this.collection.delete({
      where: { id: docId },
    });

    // Update collection timestamp
    await this.updateCollectionTimestamp();
  }

  // Helper method to update the collection's 'updated' timestamp
  private async updateCollectionTimestamp(): Promise<void> {
    try {
      const metadata = await this.getCollectionMetadata(this.collection);
      const timestamp = new Date().toISOString();

      // @ts-expect-error - ChromaDB client types may not include modify
      await this.collection.modify({
        metadata: {
          ...metadata,
          updated: timestamp,
          // Ensure created timestamp exists
          created: metadata.created || timestamp,
        },
      });
    } catch (error) {
      console.error("Failed to update collection timestamp:", error);
      // Don't throw - this is a non-critical operation
    }
  }
}
