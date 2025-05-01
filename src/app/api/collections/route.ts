"use server";

import { ChromaClient } from "chromadb";
import { NextResponse } from "next/server";
import { CHROMA_CONFIG } from "@/config/chroma";

let client: ChromaClient | null = null;

async function getClient() {
  if (!client) {
    client = new ChromaClient({
      path: CHROMA_CONFIG.path,
    });
  }
  return client;
}

export async function GET() {
  try {
    const client = await getClient();
    const collections = await client.listCollections();
    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
