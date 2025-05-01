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

// Ensure this code only runs on the server side
if (typeof window !== "undefined") {
  throw new Error("ChromaDBManager can only be used on the server side");
}

export class ChromaDBManager {
  private client: ChromaClient;
  private collection!: Collection;
  private textSplitter: TextSplitter;
  private embeddingFunction: OllamaEmbeddings;
  private collectionName: string;
  private persistDirectory: string;

  constructor(config: ChromaDBManagerConfig = {}) {
    this.collectionName = config.collectionName || "default_collection";
    this.persistDirectory = config.persistDirectory || "./chroma_db";

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
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          "hnsw:space": "cosine",
          persist_directory: this.persistDirectory,
        },
      });
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
      }
    } else {
      await this.addChunksToCollection(chunksWithIds);
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

    if (!results.documents?.[0] || !results.embeddings?.[0]) {
      return [];
    }

    return results.documents[0].map((doc, i) => {
      const metadata = results.metadatas?.[0][i] || {};
      // Convert Chroma metadata to our DocumentMetadata format
      const documentMetadata: DocumentMetadata = {
        ...Object.entries(metadata).reduce((acc, [key, value]) => {
          if (
            value !== undefined &&
            (typeof value === "string" || typeof value === "number")
          ) {
            acc[key] = value;
          }
          return acc;
        }, {} as DocumentMetadata),
      };

      const embeddings = results.embeddings;
      if (!embeddings?.[0]?.[i]) {
        throw new Error("Missing required embedding data");
      }

      return {
        pageContent: doc || "",
        metadata: documentMetadata,
        score: results.distances?.[0][i],
        embedding: embeddings[0][i],
      };
    });
  }

  async deleteCollection(): Promise<void> {
    await this.client.deleteCollection({ name: this.collectionName });
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

  async listCollections(): Promise<CollectionInfo[]> {
    const collections = await this.client.listCollections();
    const collectionInfos: CollectionInfo[] = [];

    for (const collection of collections) {
      const col = await this.client.getCollection({ name: collection });
      collectionInfos.push({
        name: collection,
        count: await col.count(),
        metadata: await this.getCollectionMetadata(col),
      });
    }

    return collectionInfos;
  }

  async getCollectionInfo(): Promise<CollectionInfo> {
    return {
      name: this.collectionName,
      count: await this.collection.count(),
      metadata: await this.getCollectionMetadata(this.collection),
    };
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
      // Convert Chroma metadata to our DocumentMetadata format
      const documentMetadata: DocumentMetadata = {
        ...Object.entries(metadata).reduce((acc, [key, value]) => {
          if (
            value !== undefined &&
            (typeof value === "string" || typeof value === "number")
          ) {
            acc[key] = value;
          }
          return acc;
        }, {} as DocumentMetadata),
      };

      const embeddings = results.embeddings;
      if (!embeddings?.[i]) {
        throw new Error("Missing required embedding data");
      }

      return {
        pageContent: doc || "",
        metadata: documentMetadata,
        embedding: embeddings[i],
      };
    });
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
  }

  async deleteDocument(docId: string): Promise<void> {
    await this.collection.delete({
      where: { id: docId },
    });
  }
}
