import { Document } from "@/types/embeddings";

export class TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(config: { chunkSize?: number; chunkOverlap?: number } = {}) {
    this.chunkSize = config.chunkSize || 800;
    this.chunkOverlap = Math.min(config.chunkOverlap || 80, this.chunkSize);
  }

  splitText(text: string): string[] {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      // Calculate the end index for this chunk
      let endIndex = Math.min(startIndex + this.chunkSize, text.length);

      // If this isn't the last chunk and we're not at a word boundary
      if (endIndex < text.length && !text[endIndex].match(/\s/)) {
        // Look for the last word boundary
        const lastSpace = text.lastIndexOf(" ", endIndex);
        if (lastSpace > startIndex) {
          endIndex = lastSpace;
        }
      }

      // Get the chunk
      const chunk = text.slice(startIndex, endIndex).trim();

      // Only add non-empty chunks
      if (chunk) {
        chunks.push(chunk);
      }

      // Move the start index forward, accounting for overlap
      startIndex = endIndex - this.chunkOverlap;

      // Ensure we make forward progress
      if (startIndex <= chunks.length) {
        startIndex = endIndex;
      }
    }

    return chunks;
  }

  splitDocument(doc: Document): Document[] {
    const chunks = this.splitText(doc.pageContent);
    return chunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: {
        ...doc.metadata,
        chunk_index: index,
      },
    }));
  }

  splitDocuments(documents: Document[]): Document[] {
    return documents.flatMap((doc) => this.splitDocument(doc));
  }
}
