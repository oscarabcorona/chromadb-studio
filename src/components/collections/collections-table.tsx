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

interface Collection {
  name: string;
  count: number;
  dimension: number;
  created: string;
}

export function CollectionsTable() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    collection?: string;
  }>({ open: false });

  const handleDelete = (collection: string) => {
    setDeleteDialog({ open: true, collection });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.collection) return;

    try {
      // TODO: Implement delete collection
      setCollections(
        collections.filter((c) => c.name !== deleteDialog.collection)
      );
    } catch (error) {
      console.error("Failed to delete collection:", error);
    } finally {
      setDeleteDialog({ open: false });
    }
  };

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
                  <TableCell>{collection.created}</TableCell>
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
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
