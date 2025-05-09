import { NextRequest, NextResponse } from "next/server";
import { ChromaDBManager } from "@/lib/chroma-manager";
import { QueryResult } from "@/types/embeddings";

// Extend QueryResult to include distance
interface ExtendedQueryResult extends QueryResult {
  distance?: number;
  similarityScore?: number;
  isRelated?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // Get the collection name from the URL parameter
    const collectionName = params.name;

    if (!collectionName) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    // Get the query parameters from the request body
    const body = await request.json();
    const { query, nResults = 5, where = {}, includeRelated = false } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query text is required" },
        { status: 400 }
      );
    }

    // Initialize the ChromaDBManager with the collection
    const manager = new ChromaDBManager({
      collectionName: collectionName,
    });
    await manager.initialize();

    // Query the collection
    const results = (await manager.query(
      query,
      nResults,
      where
    )) as ExtendedQueryResult[];

    // Format and normalize scores (convert distances to similarity scores)
    const formattedResults = results.map((result) => {
      // Assuming cosine distance (1 - similarity), convert to similarity score 0-100%
      const distance = result.distance || 0;
      const similarityScore = Math.round((1 - distance) * 100);

      return {
        ...result,
        similarityScore,
      };
    });

    // Get related documents if requested
    let relatedDocuments: ExtendedQueryResult[] = [];
    if (includeRelated && formattedResults.length > 0) {
      try {
        // Since we can't directly access manager's private methods,
        // perform a new query with the first result's content
        const firstResultContent = formattedResults[0].pageContent;
        if (firstResultContent) {
          // Query using the content of the first result as the query text
          const relatedResults = (await manager.query(
            firstResultContent,
            3,
            where
          )) as ExtendedQueryResult[];

          // Filter out duplicates and format
          relatedDocuments = relatedResults
            .filter(
              (doc) =>
                !formattedResults.some((r) => r.metadata.id === doc.metadata.id)
            )
            .map((doc) => {
              const distance = doc.distance || 0;
              const similarityScore = Math.round((1 - distance) * 100);
              return {
                ...doc,
                similarityScore,
                isRelated: true,
              };
            });
        }
      } catch (relatedError) {
        console.error("Error fetching related documents:", relatedError);
        // Continue with main results even if related fetching fails
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedResults,
      related: relatedDocuments,
    });
  } catch (error) {
    console.error("Error querying collection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
