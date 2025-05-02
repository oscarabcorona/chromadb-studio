import { DocumentsTableSkeleton } from "@/components/documents/documents-table-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold bg-muted animate-pulse h-10 w-64 rounded"></h1>
        <p className="text-muted-foreground mt-2 bg-muted animate-pulse h-6 w-80 rounded"></p>
      </header>

      <main>
        {/* Documents Status Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="h-24 rounded-md bg-muted animate-pulse"></div>
          <div className="h-24 rounded-md bg-muted animate-pulse"></div>
        </div>
        <div className="h-4"></div> {/* Spacing */}
        {/* Documents Manager Skeleton */}
        <DocumentsTableSkeleton />
      </main>
    </div>
  );
}
