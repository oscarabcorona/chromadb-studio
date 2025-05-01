import { ChromaClient, Collection } from "chromadb";
import { ChromaCollection } from "@/types/chroma";
import { CHROMA_CONFIG } from "@/config/chroma";

interface RawCollection {
  name: string;
  metadata: Record<string, unknown>;
  count: number;
}

export class ChromaDBClient {
  private static instance: ChromaClient | null = null;
  private static client: ChromaClient;

  private constructor() {}

  public static async getInstance(): Promise<ChromaClient> {
    if (!ChromaDBClient.instance) {
      ChromaDBClient.client = new ChromaClient({
        path: CHROMA_CONFIG.path,
      });
      ChromaDBClient.instance = ChromaDBClient.client;
    }
    return ChromaDBClient.instance;
  }

  public static async listCollections(): Promise<ChromaCollection[]> {
    const client = await ChromaDBClient.getInstance();
    const collections =
      (await client.listCollections()) as unknown as RawCollection[];
    return collections.map((collection) => ({
      name: collection.name,
      metadata: collection.metadata,
      count: collection.count,
    }));
  }

  public static async getCollection(name: string): Promise<Collection> {
    const client = await ChromaDBClient.getInstance();
    return await client.getCollection({ name });
  }
}
