import { CollectionsTableSkeleton } from "@/components/collections/collections-table-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">ChromaDB Studio</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage your ChromaDB collections
        </p>
      </header>

      <main>
        {/* Collections Status Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="h-24 rounded-md bg-muted animate-pulse"></div>
        </div>
        <div className="h-4"></div> {/* Spacing */}
        {/* Collections Manager Skeleton */}
        <CollectionsTableSkeleton />
      </main>
    </div>
  );
}
