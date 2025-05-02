import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { listCollections } from "@/app/actions";

// This is a Server Component - note the absence of "use client"
export async function CollectionsStatus() {
  // Fetch directly in the component for better streaming support
  const result = await listCollections();
  const collectionsCount =
    result.success && result.data ? result.data.length : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Collections
          </CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{collectionsCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
