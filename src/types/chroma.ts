export interface ChromaCollection {
  name: string;
  metadata: Record<string, unknown>;
  count: number;
}

export interface ChromaDocument {
  id: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  document?: string;
}
