import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import { revalidatePath, revalidateTag } from "next/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = params.name;

  try {
    const client = new ChromaClient({
      path: process.env.NEXT_PUBLIC_CHROMA_DB_PATH || "http://localhost:8000",
    });

    // Get collection
    const collection = await client.getCollection({ name });

    // Get body data
    const body = await request.json();
    const { metadata } = body;

    if (!metadata || typeof metadata !== "object") {
      return NextResponse.json(
        { error: "Invalid metadata format" },
        { status: 400 }
      );
    }

    // Get existing metadata to ensure we don't lose the created timestamp
    const existingMetadata = collection.metadata || {};

    // Generate current timestamp for update
    const now = new Date().toISOString();

    // Prepare updated metadata - keep existing data, add new data, and update timestamps
    const updatedMetadata = {
      ...existingMetadata,
      ...metadata,
      // Always update the timestamp when metadata is modified
      updated: now,
      // Make sure created timestamp exists
      created: existingMetadata.created || now,
    };

    // Update metadata - using @ts-expect-error since the types may not be accurate
    // @ts-expect-error - ChromaDB client types may not include modify
    await collection.modify({ metadata: updatedMetadata });

    // Revalidate paths and tags
    revalidatePath("/studio");
    revalidateTag("collections");

    return NextResponse.json({
      success: true,
      metadata: updatedMetadata,
    });
  } catch (error) {
    console.error(`Error updating collection ${name} metadata:`, error);
    return NextResponse.json(
      {
        error: `Failed to update collection metadata: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
