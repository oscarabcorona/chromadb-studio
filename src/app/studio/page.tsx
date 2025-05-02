import { EmbeddingsManager } from "@/components/embeddings-manager";
import { Suspense } from "react";
import { listCollections } from "@/app/actions";
import { CollectionsStatus } from "@/components/collections/collections-status";
import { CollectionsTableSkeleton } from "@/components/collections/collections-table-skeleton";

export default function StudioPage() {
  const collectionsPromise = listCollections();

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">ChromaDB Studio</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage your ChromaDB collections
        </p>
      </header>

      <main>
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="h-24 rounded-md bg-muted animate-pulse"></div>
            </div>
          }
        >
          <CollectionsStatus />
        </Suspense>
        <div className="h-4"></div>
        <Suspense fallback={<CollectionsTableSkeleton />}>
          <EmbeddingsManager collectionsPromise={collectionsPromise} />
        </Suspense>
      </main>
    </div>
  );
}
