"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { QueryResult } from "@/types/embeddings";
import { Loader2, Search, Lightbulb } from "lucide-react";
import { queryCollection } from "@/app/actions/documents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Extended version of QueryResult to include similarity score
interface ExtendedQueryResult extends QueryResult {
  similarityScore?: number;
  isRelated?: boolean;
}

interface QueryFormProps {
  collectionName: string;
}

export function QueryForm({ collectionName }: QueryFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExtendedQueryResult[]>([]);
  const [relatedResults, setRelatedResults] = useState<ExtendedQueryResult[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeRelated, setIncludeRelated] = useState(true);
  const [nResults, setNResults] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await queryCollection(
        collectionName,
        query,
        nResults,
        {},
        includeRelated
      );

      if (response.success) {
        setResults((response.data as ExtendedQueryResult[]) || []);
        setRelatedResults((response.related as ExtendedQueryResult[]) || []);
      } else {
        setError(response.error || "Failed to query collection");
      }
    } catch (err) {
      setError("An error occurred while searching");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderResultCard = (result: ExtendedQueryResult, index: number) => (
    <Card
      key={result.metadata.id || index}
      className={result.isRelated ? "border-blue-200" : ""}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">ID: {result.metadata.id}</p>
              {result.similarityScore !== undefined && (
                <Badge variant="outline" className="ml-2 bg-green-50">
                  {result.similarityScore}% match
                </Badge>
              )}
              {result.isRelated && (
                <Badge variant="outline" className="ml-2 bg-blue-50">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Related
                </Badge>
              )}
            </div>
            {result.metadata.source && (
              <p className="text-xs text-muted-foreground">
                Source: {result.metadata.source}
              </p>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{result.pageContent}</p>
          {result.metadata && Object.keys(result.metadata).length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Metadata:</p>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {Object.entries(result.metadata)
                  .filter(([key]) => key !== "id" && key !== "source")
                  .map(([key, value]) => (
                    <p key={key} className="text-xs">
                      <span className="font-bold">{key}:</span> {String(value)}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter your query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeRelated"
              checked={includeRelated}
              onCheckedChange={(checked) =>
                setIncludeRelated(checked as boolean)
              }
            />
            <Label htmlFor="includeRelated">Find related documents</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="nResults">Results:</Label>
            <select
              id="nResults"
              className="h-8 rounded-md border border-input px-3 py-1 text-sm"
              value={nResults}
              onChange={(e) => setNResults(Number(e.target.value))}
            >
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      {(results.length > 0 || relatedResults.length > 0) && (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="results" className="flex gap-2 items-center">
              Search Results
              {results.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {results.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="related" className="flex gap-2 items-center">
              Related Documents
              {relatedResults.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {relatedResults.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            {results.length > 0 ? (
              results.map((result, index) => renderResultCard(result, index))
            ) : (
              <p className="text-muted-foreground">
                No matching documents found.
              </p>
            )}
          </TabsContent>

          <TabsContent value="related" className="space-y-4">
            {relatedResults.length > 0 ? (
              relatedResults.map((result, index) =>
                renderResultCard(result, index)
              )
            ) : (
              <p className="text-muted-foreground">
                No related documents found.
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
