"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useChromaStore } from "@/store/chroma-store";
import { testConnection } from "@/app/actions";
import { Loader2 } from "lucide-react";

const connectionSchema = z.object({
  dbUrl: z
    .string()
    .min(1, "Database URL is required")
    .url("Must be a valid URL"),
});

type ConnectionForm = z.infer<typeof connectionSchema>;

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionDialog({
  open,
  onOpenChange,
}: ConnectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { dbUrl, setDbUrl, setConnected } = useChromaStore();

  const form = useForm<ConnectionForm>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      dbUrl: dbUrl,
    },
  });

  const handleSubmit = async (data: ConnectionForm) => {
    setIsLoading(true);
    try {
      const result = await testConnection(data.dbUrl);
      if (result.success) {
        setDbUrl(data.dbUrl);
        setConnected(true);
        toast.success("Successfully connected to ChromaDB");
        onOpenChange(false);
      } else {
        toast.error("Failed to connect to ChromaDB", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to connect to ChromaDB", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        aria-labelledby="connection-dialog-title"
        aria-describedby="connection-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="connection-dialog-title">
            Connect to ChromaDB
          </DialogTitle>
          <DialogDescription id="connection-dialog-description">
            Enter your ChromaDB server URL to connect. The default URL is
            http://localhost:8000
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            aria-label="Connection form"
          >
            <FormField
              control={form.control}
              name="dbUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="http://localhost:8000"
                      {...field}
                      aria-label="Database URL input"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
