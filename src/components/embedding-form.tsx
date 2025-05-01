"use client";

import { useState, useEffect } from "react";
import type { CollectionInfo, QueryResult } from "@/types/embeddings";

export function EmbeddingForm() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [documents, setDocuments] = useState<QueryResult[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [results, setResults] = useState<QueryResult[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        headers: {
          "Content-Type": "application/json",
        },
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

      setResults(data.results);
      setSuccessMessage("Text successfully embedded!");
      setText(""); // Clear the input for next entry
      fetchCollection(); // Refresh the documents list
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create collection"
      );
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Current Collection</h2>
        <p className="text-gray-600 mt-2">
          Name: {collection.name}
          <br />
          Documents: {collection.count}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="text" className="block text-sm font-medium mb-2">
            Enter Text to Embed
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
          {loading ? "Processing..." : "Embed Text"}
        </button>

        {error && <div className="text-red-500 mt-4">Error: {error}</div>}
        {successMessage && (
          <div className="text-green-500 mt-4">{successMessage}</div>
        )}

        {results.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Similar Documents:</h3>
            <ul className="space-y-4">
              {results.map((result, index) => (
                <li key={index} className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">
                    Score: {result.score?.toFixed(4) || "N/A"}
                  </p>
                  <p className="mt-2">{result.pageContent}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>

      {documents.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-semibold mb-4">
            All Documents in Collection:
          </h3>
          <ul className="space-y-4">
            {documents.map((doc, index) => (
              <li key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <p className="mt-2">{doc.pageContent}</p>
                    {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">Metadata:</p>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(doc.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
