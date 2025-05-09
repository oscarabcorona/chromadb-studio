"use server";

import { ChromaDBManager } from "@/lib/chroma-manager";
import {
  CollectionInfo,
  QueryResult,
  DocumentMetadata,
} from "@/types/embeddings";
import { ChromaClient } from "chromadb";
import { revalidatePath, revalidateTag } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function createCollection(
  name: string,
  dimension: number
): Promise<{ success: boolean; error?: string }> {
  if (!name || name.trim() === "") {
    return {
      success: false,
      error: "Collection name is required",
    };
  }

  // Validate collection name format
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return {
      success: false,
      error:
        "Collection name can only contain letters, numbers, hyphens, and underscores",
    };
  }

  try {
    // First check if collection exists using ChromaClient directly
    const client = new ChromaClient({
      path: process.env.NEXT_PUBLIC_CHROMA_DB_PATH || "http://localhost:8000",
    });

    const collections = await client.listCollections();
    const trimmedName = name.trim();

    // Check if collection exists by name
    if (collections.find((col) => col === trimmedName)) {
      return {
        success: false,
        error: `Collection "${trimmedName}" already exists`,
      };
    }

    // If collection doesn't exist, create it
    const manager = new ChromaDBManager({
      collectionName: trimmedName,
      dimension,
    });

    await manager.initialize();

    // Revalidate both path and tags
    revalidatePath("/studio");
    revalidateTag("collections");

    return { success: true };
  } catch (error) {
    console.error("Failed to create collection:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Check if the error is due to collection already existing
    if (errorMessage.includes("already exists")) {
      return {
        success: false,
        error: `Collection "${name}" already exists`,
      };
    }
    return {
      success: false,
      error: `Failed to create collection: ${errorMessage}`,
    };
  }
}

export async function deleteCollection(
  name: string
): Promise<{ success: boolean; error?: string }> {
  if (!name || name.trim() === "") {
    return {
      success: false,
      error: "Collection name is required",
    };
  }

  try {
    const manager = new ChromaDBManager({
      collectionName: name.trim(),
    });
    await manager.initialize();
    await manager.deleteCollection();

    // Revalidate both path and tags
    revalidatePath("/studio");
    revalidateTag("collections");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete collection",
    };
  }
}

export async function listCollections(): Promise<{
  success: boolean;
  data?: CollectionInfo[];
  error?: string;
}> {
  try {
    const client = new ChromaClient({
      path: process.env.NEXT_PUBLIC_CHROMA_DB_PATH || "http://localhost:8000",
    });

    // Get collection names
    const collectionNames = await client.listCollections();

    // Get details for each collection
    const collectionsDetails = await Promise.all(
      collectionNames.map(async (name) => {
        const collection = await client.getCollection({ name });
        const metadata = collection.metadata || {};
        const dimension =
          typeof metadata.dimension === "number" ? metadata.dimension : 1536;

        return {
          name,
          count: await collection.count(),
          dimension,
          metadata,
        } as CollectionInfo;
      })
    );

    return {
      success: true,
      data: collectionsDetails.filter(
        (col) => col.name !== "default_collection"
      ),
    };
  } catch (error) {
    console.error("Failed to list collections:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list collections",
    };
  }
}

export async function testConnection(
  dbUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = new ChromaClient({
      path: dbUrl,
    });

    // Test connection by listing collections
    await client.heartbeat();
    return { success: true };
  } catch (error) {
    console.error("Failed to connect to ChromaDB:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to ChromaDB",
    };
  }
}

export async function getCollectionInfo(
  name: string
): Promise<{ success: boolean; data?: CollectionInfo; error?: string }> {
  if (!name || name.trim() === "") {
    return {
      success: false,
      error: "Collection name is required",
    };
  }

  try {
    const manager = new ChromaDBManager({
      collectionName: name.trim(),
    });
    await manager.initialize();

    const collectionInfo = await manager.getCollectionInfo();

    return {
      success: true,
      data: collectionInfo,
    };
  } catch (error) {
    console.error("Failed to get collection info:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get collection info",
    };
  }
}

export async function getCollectionDocuments(
  collectionName: string
): Promise<{ success: boolean; data?: QueryResult[]; error?: string }> {
  if (!collectionName || collectionName.trim() === "") {
    return {
      success: false,
      error: "Collection name is required",
    };
  }

  try {
    const manager = new ChromaDBManager({
      collectionName: collectionName.trim(),
    });
    await manager.initialize();

    const documents = await manager.getAllDocuments();

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    console.error("Failed to get collection documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get documents",
    };
  }
}

export async function queryCollection(
  collectionName: string,
  query: string,
  nResults: number = 5,
  where: Record<string, unknown> = {},
  includeRelated: boolean = false
): Promise<{
  success: boolean;
  data?: QueryResult[];
  related?: QueryResult[];
  error?: string;
}> {
  if (!collectionName || collectionName.trim() === "") {
    return {
      success: false,
      error: "Collection name is required",
    };
  }

  if (!query || query.trim() === "") {
    return {
      success: false,
      error: "Query text is required",
    };
  }

  try {
    const manager = new ChromaDBManager({
      collectionName: collectionName.trim(),
    });
    await manager.initialize();

    // Query the collection
    const results = await manager.query(query, nResults, where);

    // Calculate similarity scores
    const resultsWithScores = results.map((result) => {
      const distance = (result as any).distance || 0;
      return {
        ...result,
        similarityScore: Math.round((1 - distance) * 100),
      };
    });

    // Get related documents if requested
    let relatedDocuments: QueryResult[] = [];
    if (includeRelated && results.length > 0) {
      try {
        // Query using the content of the first result as the query text
        const firstResultContent = results[0].pageContent;
        if (firstResultContent) {
          const relatedResults = await manager.query(
            firstResultContent,
            3,
            where
          );

          // Filter out duplicates and add metadata
          relatedDocuments = relatedResults
            .filter(
              (doc) => !results.some((r) => r.metadata.id === doc.metadata.id)
            )
            .map((doc) => {
              const distance = (doc as any).distance || 0;
              return {
                ...doc,
                similarityScore: Math.round((1 - distance) * 100),
                isRelated: true,
              };
            });
        }
      } catch (relatedError) {
        console.error("Error fetching related documents:", relatedError);
        // Continue with main results even if related fetching fails
      }
    }

    return {
      success: true,
      data: resultsWithScores,
      related: relatedDocuments.length > 0 ? relatedDocuments : undefined,
    };
  } catch (error) {
    console.error("Failed to query collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to query collection",
    };
  }
}

export async function addDocument(
  collectionName: string,
  document: { content: string; metadata?: DocumentMetadata }
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!collectionName || collectionName.trim() === "") {
    return {
      success: false,
      error: "Collection name is required",
    };
  }

  if (!document.content || document.content.trim() === "") {
    return {
      success: false,
      error: "Document content is required",
    };
  }

  try {
    const manager = new ChromaDBManager({
      collectionName: collectionName.trim(),
    });
    await manager.initialize();

    // Generate a UUID for the document
    const docId = uuidv4();

    await manager.addDocuments([
      {
        pageContent: document.content,
        metadata: {
          ...(document.metadata || {}),
          id: docId,
        },
      },
    ]);

    // Revalidate path
    revalidatePath(`/studio/${collectionName}`);

    return { success: true, id: docId };
  } catch (error) {
    console.error("Failed to add document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add document",
    };
  }
}

export async function updateDocument(
  collectionName: string,
  documentId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  if (!collectionName || collectionName.trim() === "") {
    return {
      success: false,
      error: "Collection name is required",
    };
  }

  if (!documentId) {
    return {
      success: false,
      error: "Document ID is required",
    };
  }

  if (!newContent || newContent.trim() === "") {
    return {
      success: false,
      error: "Document content is required",
    };
  }

  try {
    const manager = new ChromaDBManager({
      collectionName: collectionName.trim(),
    });
    await manager.initialize();

    await manager.updateDocument(documentId, newContent);

    // Revalidate path
    revalidatePath(`/studio/${collectionName}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update document",
    };
  }
}

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!collectionName || collectionName.trim() === "") {
    return {
      success: false,
      error: "Collection name is required",
    };
  }

  if (!documentId) {
    return {
      success: false,
      error: "Document ID is required",
    };
  }

  try {
    const manager = new ChromaDBManager({
      collectionName: collectionName.trim(),
    });
    await manager.initialize();

    await manager.deleteDocument(documentId);

    // Revalidate path
    revalidatePath(`/studio/${collectionName}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

// Define the upload directory
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure the upload directory exists
async function ensureUploadDirectory(collectionName: string): Promise<string> {
  const collectionDir = path.join(UPLOAD_DIR, collectionName);

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  if (!existsSync(collectionDir)) {
    await mkdir(collectionDir, { recursive: true });
  }

  return collectionDir;
}

/**
 * Handle file upload
 */
export async function uploadFile(
  formData: FormData
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  try {
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const collectionName = formData.get("collectionName") as string;

    if (!file || !fileName || !collectionName) {
      return {
        success: false,
        error: "Missing required parameters",
      };
    }

    // Create directories if they don't exist
    const uploadDir = await ensureUploadDirectory(collectionName);

    // Generate a file path
    const filePath = path.join(uploadDir, fileName);

    // Convert the file to a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Write the file to disk
    await writeFile(filePath, fileBuffer);

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    console.error("Failed to upload file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

/**
 * Process uploaded files
 */
export async function processFiles(
  collectionName: string,
  options: {
    fileNames: string[];
    chunkSize?: number;
    chunkOverlap?: number;
    processingMethod?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      fileNames,
      chunkSize = 1000,
      chunkOverlap = 200,
      processingMethod = "default",
    } = options;

    if (!collectionName || !fileNames || fileNames.length === 0) {
      return {
        success: false,
        error: "Missing required parameters",
      };
    }

    const uploadDir = path.join(UPLOAD_DIR, collectionName);
    const manager = new ChromaDBManager({
      collectionName: collectionName.trim(),
      chunkSize,
      chunkOverlap,
    });

    await manager.initialize();

    // Process each file
    for (const fileName of fileNames) {
      const filePath = path.join(uploadDir, fileName);
      const fs = await import("fs/promises");

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        console.error(
          `File ${fileName} does not exist or is not accessible:`,
          error
        );
        return {
          success: false,
          error: `File ${fileName} does not exist or is not accessible`,
        };
      }

      // Handle different file types based on extension
      const fileExtension = path.extname(fileName).toLowerCase();
      let fileContent = "";

      try {
        // For simplicity, we're reading all files as text
        // In a production app, you would use specialized libraries for PDF, DOCX, etc.
        if (fileExtension === ".pdf") {
          // In a real app: Use a PDF parsing library
          fileContent = `Parsed PDF content for ${fileName}. In a real implementation, use a PDF parsing library.`;
        } else if (fileExtension === ".docx" || fileExtension === ".doc") {
          // In a real app: Use a DOCX parsing library
          fileContent = `Parsed DOCX content for ${fileName}. In a real implementation, use a DOCX parsing library.`;
        } else {
          // Default text handling for txt, md, and other text files
          fileContent = await fs.readFile(filePath, "utf8");
        }

        // Apply different processing methods
        const processedContent = fileContent;
        if (processingMethod === "recursive") {
          // Simulate recursive character splitting
          console.log(`Applying recursive character splitting to ${fileName}`);
          // In a real implementation, you would use a specialized text splitter
        } else if (processingMethod === "markdown") {
          // Simulate markdown-aware processing
          console.log(`Applying markdown-aware processing to ${fileName}`);
          // In a real implementation, you would use a markdown parser
        }

        // Add to ChromaDB with enhanced metadata
        await manager.addDocuments([
          {
            pageContent: processedContent,
            metadata: {
              source: fileName,
              file_type: fileExtension.replace(".", ""),
              uploaded_at: new Date().toISOString(),
              processing_method: processingMethod,
              chunk_size: chunkSize,
              chunk_overlap: chunkOverlap,
            },
          },
        ]);
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        return {
          success: false,
          error: `Error processing file ${fileName}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    }

    // Revalidate path
    revalidatePath(`/studio/${collectionName}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to process files:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process files",
    };
  }
}
