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
import { createCollection } from "@/app/actions";

const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Collection name is required")
    .max(64, "Collection name must be less than 64 characters")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "Collection name can only contain letters, numbers, hyphens, and underscores"
    ),
  dimension: z
    .number()
    .int()
    .min(1, "Dimension must be at least 1")
    .max(2048, "Dimension must be less than 2048"),
  description: z.string().optional(),
});

type CreateCollectionForm = z.infer<typeof createCollectionSchema>;

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCollectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateCollectionForm>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      name: "",
      dimension: 1536, // Default for OpenAI embeddings
      description: "",
    },
  });

  const onSubmit = async (data: CreateCollectionForm) => {
    setIsLoading(true);
    try {
      const result = await createCollection(data.name, data.dimension);
      if (result.success) {
        toast.success("Collection created successfully");
        onOpenChange(false);
        form.reset();
        onSuccess?.();
      } else {
        toast.error("Failed to create collection", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to create collection", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Create a new collection to store your embeddings. Collections are
            used to organize and manage your vector data.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my-collection" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dimension"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dimension</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1536"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Collection description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Collection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
