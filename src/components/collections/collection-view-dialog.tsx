import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CollectionInfo } from "@/types/embeddings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DocumentData {
  id: string;
  document: string;
  metadata: Record<string, unknown>;
}

interface CollectionViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionName?: string;
}

export function CollectionViewDialog({
  open,
  onOpenChange,
  collectionName,
}: CollectionViewDialogProps) {
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCollectionDetails = useCallback(async () => {
    if (!collectionName) return;

    setIsLoading(true);
    try {
      // Fetch collection details and sample documents
      const response = await fetch(
        `/api/collections/${collectionName}?sample=5`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch collection details: ${response.statusText}`
        );
      }

      const data = await response.json();
      setCollection(data.collection);
      setDocuments(data.documents || []);
    } catch (error) {
      toast.error("Failed to fetch collection details", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    if (open && collectionName) {
      fetchCollectionDetails();
    } else {
      setCollection(null);
      setDocuments([]);
    }
  }, [open, collectionName, fetchCollectionDetails]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Collection Details: {collectionName}</DialogTitle>
          <DialogDescription>
            View details and sample documents from this collection
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            {collection && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Collection Info
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{collection.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Documents</p>
                      <p className="font-medium">{collection.count}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Dimension</p>
                      <p className="font-medium">{collection.dimension}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {collection.metadata?.created
                          ? new Date(
                              String(collection.metadata.created)
                            ).toLocaleString()
                          : "Unknown"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="font-medium">
                        {collection.metadata?.updated
                          ? new Date(
                              String(collection.metadata.updated)
                            ).toLocaleString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Sample Documents
                  </h3>
                  {documents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Metadata</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc, index) => (
                          <TableRow key={doc.id || index}>
                            <TableCell className="font-medium">
                              {doc.id || `doc-${index}`}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {doc.document}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(doc.metadata || {}).map(
                                  ([key, value]) => (
                                    <Badge key={key} variant="outline">
                                      {key}: {String(value)}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">
                      No documents found in this collection.
                    </p>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
