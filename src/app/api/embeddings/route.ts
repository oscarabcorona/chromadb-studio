import { ChromaDBManager } from "@/lib/chroma-manager";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const { text, operation, collectionName } = await request.json();

    const manager = new ChromaDBManager({
      collectionName: collectionName || "default_collection",
    });

    await manager.initialize();

    switch (operation) {
      case "embed": {
        if (!text?.trim()) {
          return NextResponse.json(
            { error: "No text provided for embedding" },
            { status: 400 }
          );
        }

        // Add the document with a simple UUID
        const docId = uuidv4();
        await manager.addDocuments([
          {
            pageContent: text.trim(),
            metadata: {
              id: docId,
              source: "user-input",
              timestamp: new Date().toISOString(),
            },
          },
        ]);

        // Get the updated documents list
        const documents = await manager.getAllDocuments();
        return NextResponse.json({ success: true, documents });
      }

      case "create_collection":
        if (!collectionName) {
          return NextResponse.json(
            { error: "Collection name is required" },
            { status: 400 }
          );
        }
        await manager.initialize();
        const collectionInfo = await manager.getCollectionInfo();
        return NextResponse.json({ collection: collectionInfo });

      case "list_documents":
        const documents = await manager.getAllDocuments();
        return NextResponse.json({ documents });

      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in embeddings API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { docId, text, collectionName } = await request.json();

    if (!docId || !text?.trim()) {
      return NextResponse.json(
        { error: "Document ID and text are required" },
        { status: 400 }
      );
    }

    const manager = new ChromaDBManager({
      collectionName: collectionName || "default_collection",
    });

    await manager.initialize();
    await manager.updateDocument(docId, text.trim());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { docId, collectionName } = await request.json();

    if (!docId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const manager = new ChromaDBManager({
      collectionName: collectionName || "default_collection",
    });

    await manager.initialize();
    await manager.deleteDocument(docId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const manager = new ChromaDBManager();
    await manager.initialize();

    const collectionInfo = await manager.getCollectionInfo();
    const documents = await manager.getAllDocuments();

    return NextResponse.json({
      collection: collectionInfo,
      documents: documents,
    });
  } catch (error) {
    console.error("Error getting collections:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
