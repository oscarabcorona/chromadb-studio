declare module "chromadb" {
  export type IncludeEnum =
    | "embeddings"
    | "documents"
    | "metadatas"
    | "distances";

  export interface GetParams {
    ids?: string[];
    where?: Record<string, unknown>;
    limit?: number;
    offset?: number;
    include?: IncludeEnum[];
  }

  export interface QueryParams {
    queryEmbeddings: number[][];
    nResults?: number;
    where?: Record<string, unknown>;
    include?: IncludeEnum[];
  }

  export interface Collection {
    name: string;
    metadata: Record<string, unknown>;
    count(): Promise<number>;
    add(params: {
      ids: string[];
      embeddings: number[][];
      metadatas?: Record<string, unknown>[];
      documents?: string[];
    }): Promise<void>;
    get(params?: GetParams): Promise<{
      ids: string[];
      embeddings?: number[][];
      metadatas?: Record<string, unknown>[];
      documents?: string[];
    }>;
    query(params: QueryParams): Promise<{
      ids: string[][];
      embeddings?: number[][][];
      metadatas?: Record<string, unknown>[][];
      documents?: string[][];
      distances?: number[][];
    }>;
    update(params: {
      ids: string[];
      embeddings?: number[][];
      metadatas?: Record<string, unknown>[];
      documents?: string[];
    }): Promise<void>;
    delete(params: {
      ids?: string[];
      where?: Record<string, unknown>;
    }): Promise<void>;
  }

  export class ChromaClient {
    constructor(params?: {
      path?: string;
      fetchOptions?: {
        headers?: Record<string, string>;
      };
    });
    heartbeat(): Promise<number>;
    listCollections(): Promise<string[]>;
    getCollection(params: { name: string }): Promise<Collection>;
    getOrCreateCollection(params: {
      name: string;
      metadata?: Record<string, unknown>;
    }): Promise<Collection>;
    deleteCollection(params: { name: string }): Promise<void>;
  }
}
