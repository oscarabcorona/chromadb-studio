"use client";

import { useState } from "react";
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

export function EmbeddingsManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
            <div className="text-2xl font-bold">0</div>
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
          <CollectionsTable />
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
      />
    </div>
  );
}
