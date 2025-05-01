"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import type { CollectionInfo, QueryResult } from "@/types/embeddings";

interface EditingDoc {
  id: string;
  text: string;
}

export function EmbeddingsManager() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [documents, setDocuments] = useState<QueryResult[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [editingDoc, setEditingDoc] = useState<EditingDoc | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCollection();
  }, []);

  const fetchCollection = async () => {
    try {
      const response = await fetch("/api/embeddings");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch collection");
      }

      setCollection(data.collection);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch collection"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          operation: "embed",
          collectionName: collection?.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }

      setSuccessMessage("Text successfully embedded!");
      setText("");
      fetchCollection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/embeddings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId,
          collectionName: collection?.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete document");
      }

      setSuccessMessage("Document successfully deleted!");
      fetchCollection();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete document"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (docId: string, newText: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/embeddings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId,
          text: newText.trim(),
          collectionName: collection?.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update document");
      }

      setSuccessMessage("Document successfully updated!");
      setEditingDoc(null);
      fetchCollection();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update document"
      );
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "create_collection",
          collectionName: newCollectionName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create collection");
      }

      setCollection(data.collection);
      setNewCollectionName("");
      setSuccessMessage("Collection created successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create collection"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  if (!collection) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Create a Collection</h2>
        <form onSubmit={createCollection} className="space-y-4">
          <div>
            <label
              htmlFor="collectionName"
              className="block text-sm font-medium mb-2"
            >
              Collection Name
            </label>
            <input
              type="text"
              id="collectionName"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter collection name..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Collection"}
          </button>
          {error && <div className="text-red-500 mt-4">Error: {error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Current Collection</h2>
        <p className="text-gray-600 mt-2">
          Name: {collection.name}
          <br />
          Documents: {collection.count}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label htmlFor="text" className="block text-sm font-medium mb-2">
            Add New Text Embedding
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-2 border rounded-md"
            placeholder="Enter text to embed..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Add Embedding"}
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      {successMessage && (
        <div className="text-green-500 mb-4">{successMessage}</div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Embedded Documents</h3>
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div key={index} className="p-4 border rounded-lg">
              {editingDoc?.id === doc.metadata.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingDoc?.text ?? ""}
                    onChange={(e) => {
                      if (editingDoc) {
                        setEditingDoc({
                          id: editingDoc.id,
                          text: e.target.value,
                        });
                      }
                    }}
                    className="w-full p-2 border rounded-md"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (editingDoc) {
                          handleUpdate(doc.metadata.id!, editingDoc.text);
                        }
                      }}
                      disabled={loading}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingDoc(null)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <p>{doc.pageContent}</p>
                    {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">Metadata:</p>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(doc.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                    {doc.embedding && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleExpand(doc.metadata.id!)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          {expandedDocs.has(doc.metadata.id!) ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Embedding Vector
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show Embedding Vector
                            </>
                          )}
                        </button>
                        {expandedDocs.has(doc.metadata.id!) && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-md overflow-x-auto">
                            <p className="text-xs font-mono">
                              [
                              {doc.embedding
                                .map((n) => n.toFixed(6))
                                .join(", ")}
                              ]
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Vector Dimensions: {doc.embedding.length}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() =>
                        setEditingDoc({
                          id: doc.metadata.id!,
                          text: doc.pageContent,
                        })
                      }
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.metadata.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
