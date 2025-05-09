"use server";

import { ChromaDBManager } from "@/lib/chroma-manager";
import { QueryResult, DocumentMetadata } from "@/types/embeddings";
import { revalidatePath } from "next/cache";

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
      const distance = result.distance !== undefined ? result.distance : 0;
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
              const distance = doc.distance !== undefined ? doc.distance : 0;
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

    // Convert DocumentMetadata to the expected type
    // Filter out undefined values from metadata to fix type issues
    const metadata: Record<string, string | number | boolean> = {};
    if (document.metadata) {
      Object.entries(document.metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          metadata[key] = value as string | number | boolean;
        }
      });
    }

    // Use the new method directly
    const docId = await manager.addTextDocument(document.content, metadata);

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
