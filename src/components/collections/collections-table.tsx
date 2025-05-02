import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteCollection } from "@/app/actions";
import { CollectionInfo } from "@/types/embeddings";
import { Skeleton } from "@/components/ui/skeleton";

interface CollectionsTableProps {
  collections: CollectionInfo[];
  isLoading: boolean;
  onCollectionDeleted: () => void;
}

export function CollectionsTable({
  collections,
  isLoading,
  onCollectionDeleted,
}: CollectionsTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    collection?: string;
  }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (collection: string) => {
    setDeleteDialog({ open: true, collection });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.collection) return;

    setIsDeleting(true);
    try {
      const result = await deleteCollection(deleteDialog.collection);
      if (result.success) {
        toast.success("Collection deleted successfully");
        onCollectionDeleted();
      } else {
        toast.error("Failed to delete collection", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to delete collection", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Dimension</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No collections found. Create your first collection to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              collections.map((collection) => (
                <TableRow key={collection.name}>
                  <TableCell className="font-medium">
                    {collection.name}
                  </TableCell>
                  <TableCell>{collection.count}</TableCell>
                  <TableCell>{collection.dimension}</TableCell>
                  <TableCell>
                    {new Date(
                      collection.created || Date.now()
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(collection.name)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              collection and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
