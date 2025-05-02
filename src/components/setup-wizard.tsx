"use client";

import { useState, useEffect } from "react";
import { useChromaStore } from "@/store/chroma-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectionDialog } from "./connection-dialog";
import { CreateCollectionDialog } from "./collections/create-collection-dialog";
import { ConnectionStatus } from "./connection-status";
import { Steps, Step } from "@/components/ui/steps";
import { DatabaseIcon, FolderIcon, LayoutDashboardIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { listCollections, testConnection } from "@/app/actions";
import { toast } from "sonner";

export function SetupWizard() {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showCreateCollectionDialog, setShowCreateCollectionDialog] =
    useState(false);
  const {
    isConnected,
    collections,
    isLoading,
    error,
    dbUrl,
    setCollections,
    setLoading,
    setConnected,
    setError,
  } = useChromaStore();
  const router = useRouter();

  const currentStep = isConnected ? (collections.length > 0 ? 3 : 2) : 1;

  useEffect(() => {
    async function validateAndFetch() {
      if (isConnected) {
        setLoading(true);
        try {
          // First validate the connection
          const connectionResult = await testConnection(dbUrl);
          if (!connectionResult.success) {
            setConnected(false);
            setError(connectionResult.error || "Connection failed");
            toast.error("Connection lost. Please reconnect.");
            return;
          }

          // Then fetch collections
          const result = await listCollections();
          if (result.success) {
            setCollections(result.data || []);
            if (result.data && result.data.length === 0) {
              setShowCreateCollectionDialog(true);
            }
          } else {
            setError(result.error || "Failed to fetch collections");
            toast.error("Failed to fetch collections");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
          toast.error("An error occurred while setting up");
        } finally {
          setLoading(false);
        }
      }
    }

    validateAndFetch();
  }, [isConnected, dbUrl]);

  const handleContinue = () => {
    if (!isConnected) {
      setShowConnectionDialog(true);
    } else if (collections.length === 0) {
      setShowCreateCollectionDialog(true);
    } else {
      router.push("/studio");
    }
  };

  const handleCreateSuccess = async () => {
    setLoading(true);
    try {
      const result = await listCollections();
      if (result.success) {
        setCollections(result.data || []);
        if (result.data && result.data.length > 0) {
          router.push("/studio");
        }
      } else {
        setError(result.error || "Failed to refresh collections");
        toast.error("Failed to refresh collections");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
          <CardDescription>
            Complete these steps to start using ChromaDB Studio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Steps>
            <Step
              icon={DatabaseIcon}
              title="Connect"
              description="Connect to your ChromaDB instance"
              status={
                currentStep === 1
                  ? "current"
                  : currentStep > 1
                  ? "complete"
                  : "pending"
              }
            />
            <Step
              icon={FolderIcon}
              title="Collections"
              description="Create or select a collection"
              status={
                currentStep === 2
                  ? "current"
                  : currentStep > 2
                  ? "complete"
                  : "pending"
              }
            />
            <Step
              icon={LayoutDashboardIcon}
              title="Studio"
              description="Start using ChromaDB Studio"
              status={currentStep === 3 ? "current" : "pending"}
            />
          </Steps>

          <div className="space-y-4">
            <ConnectionStatus />
            {error && (
              <div className="text-destructive text-sm mt-2">{error}</div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleContinue} disabled={isLoading}>
                {!isConnected
                  ? "Connect to ChromaDB"
                  : collections.length === 0
                  ? "Create Collection"
                  : "Go to Studio"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
      />

      <CreateCollectionDialog
        open={showCreateCollectionDialog}
        onOpenChange={setShowCreateCollectionDialog}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
