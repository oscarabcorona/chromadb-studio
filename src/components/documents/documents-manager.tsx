"use client";

import { useState } from "react";
import {
  deleteDocument,
  updateDocument,
  getCollectionDocuments,
  addDocument,
} from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { CircleCheck, Edit, FileText, RefreshCw, Trash2 } from "lucide-react";
import { FileUploadWrapper } from "../upload/file-upload-wrapper";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  // Component for adding documents via text input
  function AddDocumentForm({
    collectionName,
    onSuccess,
  }: {
    collectionName: string;
    onSuccess: () => void;
  }) {
    const [content, setContent] = useState("");
    const [source, setSource] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!content.trim()) {
        toast.error("Document content is required");
        return;
      }

      setIsSubmitting(true);

      try {
        // Create metadata with optional source
        const metadata: { source?: string } = {};
        if (source.trim()) {
          metadata.source = source.trim();
        }

        const result = await addDocument(collectionName, {
          content: content.trim(),
          metadata,
        });

        if (result.success) {
          toast.success("Document added successfully");
          setContent("");
          setSource("");
          onSuccess();
        } else {
          toast.error(`Failed to add document: ${result.error}`);
        }
      } catch (error) {
        toast.error(
          `An error occurred: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source (optional)</Label>
              <Input
                id="source"
                placeholder="Document source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter document content..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-y"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CircleCheck className="h-4 w-4 mr-2" />
              )}
              Add Document
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <CircleCheck className="h-4 w-4 mr-1" />
            Add Document
          </Button>
          <FileUploadWrapper collectionName={collectionName} />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground mt-2">
            Get started by uploading documents to this collection.
          </p>
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
              {documents.map((doc, index) => (
                <TableRow key={doc.metadata.id || `doc-${index}`}>
                  <TableCell className="font-medium">
                    {truncateText(doc.pageContent)}
                  </TableCell>
                  <TableCell>
                    {doc.metadata.id || (
                      <span className="text-red-500">ID not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {Object.entries(doc.metadata)
                      .filter(([key]) => key !== "id")
                      .map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-semibold">{key}:</span>{" "}
                          {typeof value === "string" && value.length > 20
                            ? `${value.substring(0, 20)}...`
                            : String(value)}
                        </div>
                      ))}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the content of the document. This will regenerate
              embeddings while preserving metadata.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={editDocumentContent}
              onChange={(e) => setEditDocumentContent(e.target.value)}
              className="h-64 resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleUpdateDocument}
              disabled={!editDocumentContent.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
            <DialogDescription>
              Add a new document to the collection. The text will be embedded
              using the collection&apos;s embedding model.
            </DialogDescription>
          </DialogHeader>
          <AddDocumentForm
            collectionName={collectionName}
            onSuccess={() => {
              refreshDocuments();
              setIsAddDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
