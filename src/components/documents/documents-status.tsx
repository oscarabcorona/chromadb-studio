"use client";

import { CollectionInfo } from "@/types/embeddings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { FileText, History, Package, Sigma } from "lucide-react";

interface DocumentsStatusProps {
  collection: CollectionInfo;
}

export function DocumentsStatus({ collection }: DocumentsStatusProps) {
  const { count, dimension, metadata } = collection;
  const lastUpdated = metadata.updated
    ? formatDistanceToNow(new Date(metadata.updated), { addSuffix: true })
    : "Never";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground">
            Documents in this collection
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Embedding Size</CardTitle>
          <Sigma className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dimension}</div>
          <p className="text-xs text-muted-foreground">
            Dimensions per embedding
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          <History className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lastUpdated}</div>
          <p className="text-xs text-muted-foreground">
            Since last modification
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Collection</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{collection.name}</div>
          <p className="text-xs text-muted-foreground">
            Current collection name
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
