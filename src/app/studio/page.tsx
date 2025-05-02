import { EmbeddingsManager } from "@/components/embeddings-manager";

export default function StudioPage() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">ChromaDB Studio</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage your ChromaDB collections
        </p>
      </header>

      <main>
        <EmbeddingsManager />
      </main>
    </div>
  );
}
