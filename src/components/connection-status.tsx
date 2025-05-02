"use client";

import { useEffect } from "react";
import { useChromaStore } from "@/store/chroma-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { testConnection } from "@/app/actions";

export function ConnectionStatus() {
  const { dbUrl, isConnected, setConnected, isLoading, setLoading, setError } =
    useChromaStore();

  useEffect(() => {
    const checkConnection = async () => {
      if (!dbUrl) return;

      setLoading(true);
      try {
        const result = await testConnection(dbUrl);
        setConnected(result.success);
        if (!result.success) {
          setError(result.error || "Failed to connect");
        }
      } catch (error) {
        setConnected(false);
        setError(error instanceof Error ? error.message : "Failed to connect");
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [dbUrl, setConnected, setError, setLoading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Connection Status
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isConnected ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
        <CardDescription>Current connection to ChromaDB</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Database URL</div>
          <div className="text-sm text-muted-foreground break-all">{dbUrl}</div>
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Status</div>
          <div className="text-sm">
            {isLoading ? (
              <span className="text-muted-foreground">
                Checking connection...
              </span>
            ) : isConnected ? (
              <span className="text-green-500">Connected</span>
            ) : (
              <span className="text-red-500">Disconnected</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
