"use client";

import { useState } from "react";
import {
  addDocument,
  deleteDocument,
  updateDocument,
  getCollectionDocuments,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { QueryResult } from "@/types/embeddings";
import {
  CircleCheck,
  Edit,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface DocumentsManagerProps {
  collectionName: string;
  initialDocuments?: {
    success: boolean;
    data?: QueryResult[];
    error?: string;
  };
}

export function DocumentsManager({
  collectionName,
  initialDocuments,
}: DocumentsManagerProps) {
  const [documents, setDocuments] = useState<QueryResult[]>(
    initialDocuments?.success && initialDocuments?.data
      ? initialDocuments.data
      : []
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newDocumentContent, setNewDocumentContent] = useState("");
  const [editDocumentId, setEditDocumentId] = useState("");
  const [editDocumentContent, setEditDocumentContent] = useState("");
  const [deleteDocumentId, setDeleteDocumentId] = useState("");
  const [isLoading, setIsLoading] = useState(
    initialDocuments?.success ? false : true
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(
    initialDocuments?.error || null
  );

  // Function to load documents manually
  const refreshDocuments = async () => {
    try {
      setIsRefreshing(true);
      const result = await getCollectionDocuments(collectionName);

      if (result.success && result.data) {
        setDocuments(result.data);
        setError(null);
      } else if (result.error) {
        setError(result.error);
        toast.error(`Failed to load documents: ${result.error}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      toast.error(`An error occurred: ${errorMessage}`);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  // Load documents if not provided initially
  if (isLoading && !initialDocuments?.success) {
    refreshDocuments();
  }

  const handleAddDocument = async () => {
    if (!newDocumentContent.trim()) {
      toast.error("Document content cannot be empty");
      return;
    }

    try {
      const result = await addDocument(collectionName, {
        content: newDocumentContent,
      });

      if (result.success) {
        toast.success("Document added successfully");
        setIsAddDialogOpen(false);
        setNewDocumentContent("");
        refreshDocuments();
      } else {
        toast.error(`Failed to add document: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        `An error occurred: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleUpdateDocument = async () => {
    if (!editDocumentContent.trim()) {
      toast.error("Document content cannot be empty");
      return;
    }

    try {
      const result = await updateDocument(
        collectionName,
        editDocumentId,
        editDocumentContent
      );

      if (result.success) {
        toast.success("Document updated successfully");
        setIsEditDialogOpen(false);
        setEditDocumentId("");
        setEditDocumentContent("");
        refreshDocuments();
      } else {
        toast.error(`Failed to update document: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        `An error occurred: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleDeleteDocument = async () => {
    try {
      const result = await deleteDocument(collectionName, deleteDocumentId);

      if (result.success) {
        toast.success("Document deleted successfully");
        refreshDocuments();
      } else {
        toast.error(`Failed to delete document: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        `An error occurred: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const openEditDialog = (document: QueryResult) => {
    setEditDocumentId(document.metadata.id);
    setEditDocumentContent(document.pageContent);
    setIsEditDialogOpen(true);
  };

  // Truncate long text for display
  const truncateText = (text: string, maxLength = 70) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return <p>Loading documents...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={refreshDocuments} disabled={isRefreshing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Collection Documents</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDocuments}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
                <DialogDescription>
                  Add a new document to the collection. The document will be
                  automatically embedded.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Document Content</Label>
                  <Textarea
                    id="content"
                    value={newDocumentContent}
                    onChange={(e) => setNewDocumentContent(e.target.value)}
                    rows={10}
                    placeholder="Enter document content here..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddDocument}>
                  <CircleCheck className="h-4 w-4 mr-1" /> Add Document
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground mt-2">
            Get started by adding a document to this collection.
          </p>
          <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add your first document
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Content</TableHead>
                <TableHead className="w-[25%]">ID</TableHead>
                <TableHead className="w-[15%]">Metadata</TableHead>
                <TableHead className="w-[20%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.metadata.id}>
                  <TableCell className="font-medium">
                    {truncateText(doc.pageContent)}
                  </TableCell>
                  <TableCell>{truncateText(doc.metadata.id, 20)}</TableCell>
                  <TableCell>
                    {Object.keys(doc.metadata).length > 1 ? (
                      <span className="text-xs text-muted-foreground">
                        {Object.keys(doc.metadata).length - 1} fields
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDocumentId(doc.metadata.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this document?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteDocument}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the content of this document. The document will be
              re-embedded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editContent">Document Content</Label>
              <Textarea
                id="editContent"
                value={editDocumentContent}
                onChange={(e) => setEditDocumentContent(e.target.value)}
                rows={10}
                placeholder="Enter document content here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateDocument}>
              <CircleCheck className="h-4 w-4 mr-1" /> Update Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
