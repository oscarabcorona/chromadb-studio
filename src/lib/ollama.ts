import { EmbeddingFunction } from "@/types/embeddings";

export class OllamaEmbeddings implements EmbeddingFunction {
  private baseUrl: string;
  private model: string;

  constructor(config: { baseUrl?: string; model?: string } = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:11434";
    this.model = config.model || "mxbai-embed-large";
  }

  async embed(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      try {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            prompt: text,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get embeddings: ${response.statusText}`);
        }

        const data = await response.json();
        embeddings.push(data.embedding);
      } catch (error) {
        console.error("Error getting embedding:", error);
        throw error;
      }
    }

    return embeddings;
  }
}
