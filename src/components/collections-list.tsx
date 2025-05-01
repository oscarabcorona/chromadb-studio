"use client";

import { useEffect, useState } from "react";
import { ChromaCollection } from "@/types/chroma";

export function CollectionsList() {
  const [collections, setCollections] = useState<ChromaCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch("/api/collections");
        if (!response.ok) {
          throw new Error("Failed to fetch collections");
        }
        const data = await response.json();
        setCollections(data.collections);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch collections"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">Loading collections...</div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">ChromaDB Collections</h2>
      {collections.length === 0 ? (
        <p>No collections found</p>
      ) : (
        <ul className="space-y-4">
          {collections.map((collection, idx) => (
            <li
              key={idx}
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-semibold">{collection.name}</h3>
              <p className="text-sm text-gray-500">
                {Object.keys(collection.metadata).length > 0
                  ? JSON.stringify(collection.metadata)
                  : "No metadata"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Documents: {collection.count}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
