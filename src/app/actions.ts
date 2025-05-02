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
