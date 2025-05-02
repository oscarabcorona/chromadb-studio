import { Suspense } from "react";
import { DocumentsTableSkeleton } from "@/components/documents/documents-table-skeleton";
import { getCollectionDocuments, getCollectionInfo } from "@/app/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentsManager } from "@/components/documents/documents-manager";
import { DocumentsStatus } from "@/components/documents/documents-status";

interface PageProps {
  params: Promise<{ collectionName: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  // Await the params object
  const resolvedParams = await params;
  const collectionName = resolvedParams.collectionName;

  // Get collection info
  const collection = await getCollectionInfo(collectionName);

  if (!collection.success || !collection.data) {
    notFound();
  }

  // Fetch documents server-side
  const documents = await getCollectionDocuments(collectionName);

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <Link href="/studio">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Collections
          </Button>
        </Link>
        <h1 className="text-4xl font-bold">{collectionName}</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage documents in this collection
        </p>
      </div>

      <main>
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="h-24 rounded-md bg-muted animate-pulse"></div>
            </div>
          }
        >
          <DocumentsStatus collection={collection.data} />
        </Suspense>
        <div className="h-4"></div>
        <Suspense fallback={<DocumentsTableSkeleton />}>
          <DocumentsManager
            initialDocuments={documents}
            collectionName={collectionName}
          />
        </Suspense>
      </main>
    </div>
  );
}
