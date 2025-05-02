"use client";

import { useEffect, useState } from "react";
import { useChromaStore } from "@/store/chroma-store";
import { ConnectionDialog } from "./connection-dialog";
import { CreateCollectionDialog } from "./collections/create-collection-dialog";
import { listCollections } from "@/app/actions";
import { Loader2 } from "lucide-react";

export function ConnectionFlow() {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showCreateCollectionDialog, setShowCreateCollectionDialog] =
    useState(false);
  const {
    isConnected,
    setConnected,
    setCollections,
    dbUrl,
    isLoading,
    setLoading,
    setError,
  } = useChromaStore();

  useEffect(() => {
    const checkConnection = async () => {
      if (!isConnected) {
        setShowConnectionDialog(true);
        return;
      }

      setLoading(true);
      try {
        const result = await listCollections();
        if (result.success) {
          setCollections(result.data || []);
          if (result.data && result.data.length === 0) {
            setShowCreateCollectionDialog(true);
          }
          setError(null);
        } else {
          setConnected(false);
          setShowConnectionDialog(true);
          setError(result.error || "Failed to list collections");
        }
      } catch (error) {
        setConnected(false);
        setShowConnectionDialog(true);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [isConnected, dbUrl, setCollections, setConnected, setError, setLoading]);

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        role="alert"
        aria-label="Loading"
      >
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Checking connection...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
      />
      <CreateCollectionDialog
        open={showCreateCollectionDialog}
        onOpenChange={setShowCreateCollectionDialog}
      />
    </>
  );
}
