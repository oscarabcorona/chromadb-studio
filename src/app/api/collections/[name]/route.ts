import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

interface PeekResult {
  ids: string[];
  embeddings: number[][];
  documents: string[];
  metadatas: Record<string, unknown>[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = params.name;
  const sampleSize = Number(request.nextUrl.searchParams.get("sample") || "5");

  try {
    const client = new ChromaClient({
      path: process.env.NEXT_PUBLIC_CHROMA_DB_PATH || "http://localhost:8000",
    });

    // Get collection
    const collection = await client.getCollection({ name });

    // Get collection info
    const count = await collection.count();
    const metadata = collection.metadata || {};
    const dimension =
      typeof metadata.dimension === "number" ? metadata.dimension : 1536;

    // Get sample documents
    // Using type assertion for ChromaDB's collection methods since types might not be accurate
    // @ts-expect-error - ChromaDB client types may not include peek
    const queryResult: PeekResult = await collection.peek({
      limit: sampleSize,
    });

    // Format documents
    const documents = queryResult.ids.map((id: string, index: number) => ({
      id,
      document: queryResult.documents[index],
      metadata: queryResult.metadatas?.[index] || {},
    }));

    return NextResponse.json({
      collection: {
        name,
        count,
        dimension,
        metadata,
        created: metadata.created || new Date().toISOString(),
      },
      documents,
    });
  } catch (error) {
    console.error(`Error fetching collection ${name}:`, error);
    return NextResponse.json(
      {
        error: `Failed to fetch collection: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
