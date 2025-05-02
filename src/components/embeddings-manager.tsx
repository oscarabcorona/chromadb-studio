"use client";

import { useState } from "react";
import { use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { CollectionsTable } from "./collections/collections-table";
import { Separator } from "./ui/separator";
import { CreateCollectionDialog } from "./collections/create-collection-dialog";
import { listCollections } from "@/app/actions";
import { CollectionInfo } from "@/types/embeddings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EmbeddingsManager({
  collectionsPromise,
}: {
  collectionsPromise: Promise<{
    success: boolean;
    data?: CollectionInfo[];
    error?: string;
  }>;
}) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const result = use(collectionsPromise);
  const collections = result.success && result.data ? result.data : [];

  if (!result.success && result.error) {
    toast.error("Failed to load collections", {
      description: result.error,
    });
  }

  if (collections.length === 0 && !isCreateOpen) {
    setIsCreateOpen(true);
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const freshResult = await listCollections();
      if (!freshResult.success && freshResult.error) {
        toast.error("Failed to refresh collections", {
          description: freshResult.error,
        });
      }
    } catch (error) {
      toast.error("Failed to refresh collections", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsRefreshing(false);
      router.refresh();
    }
  };

  const handleCreateSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Collections</h2>
          <p className="text-muted-foreground">
            Manage and explore your ChromaDB collections
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh collections"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            aria-label="Create new collection"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="collections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="collections" className="space-y-4">
          <CollectionsTable
            collections={collections}
            isLoading={false}
            onCollectionDeleted={handleRefresh}
          />
        </TabsContent>
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Embeddings</CardTitle>
              <CardDescription>
                Search through your collections using text or vector queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Search functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your ChromaDB connection and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Settings configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateCollectionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
