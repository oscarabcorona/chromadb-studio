"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Database } from "lucide-react";
import { CollectionsTable } from "./collections/collections-table";
import { Separator } from "./ui/separator";
import { CreateCollectionDialog } from "./collections/create-collection-dialog";
import { listCollections } from "@/app/actions";
import { CollectionInfo } from "@/types/embeddings";
import { toast } from "sonner";

export function EmbeddingsManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const result = await listCollections();
      if (result.success && result.data) {
        setCollections(result.data);
        // If no collections exist, show the create dialog
        if (result.data.length === 0) {
          setIsCreateOpen(true);
        }
      } else if (result.error) {
        toast.error("Failed to load collections", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to load collections", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateSuccess = () => {
    fetchCollections();
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
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collections
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collections.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="collections" className="space-y-4">
          <CollectionsTable
            collections={collections}
            isLoading={isLoading}
            onCollectionDeleted={fetchCollections}
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
              {/* Search implementation will go here */}
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
              {/* Settings implementation will go here */}
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
