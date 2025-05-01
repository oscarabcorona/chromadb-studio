export interface Document {
  pageContent: string;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  id?: string;
  source?: string;
  page?: number;
  timestamp?: string;
  chunk_index?: number;
  [key: string]: string | number | undefined;
}

export interface CollectionInfo {
  name: string;
  count: number;
  dimension: number;
  metadata?: Record<string, unknown>;
}

export interface QueryResult {
  pageContent: string;
  metadata: {
    id: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  embedding?: number[];
}

export interface EmbeddingFunction {
  embed: (texts: string[]) => Promise<number[][]>;
}

export interface ChromaDBManagerConfig {
  collectionName?: string;
  persistDirectory?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

export interface Collection {
  name: string;
  count: number;
  dimension: number;
  created: string;
}
