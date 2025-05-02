import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CollectionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionName?: string;
  onSuccess?: () => void;
}

export function CollectionEditDialog({
  open,
  onOpenChange,
  collectionName,
  onSuccess,
}: CollectionEditDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const fetchCollectionMetadata = useCallback(async () => {
    if (!collectionName) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/collections/${collectionName}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch collection details: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extract string metadata for editing
      const stringMetadata: Record<string, string> = {};
      const rawMetadata = data.collection.metadata || {};

      Object.entries(rawMetadata).forEach(([key, value]) => {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          stringMetadata[key] = String(value);
        }
      });

      setMetadata(stringMetadata);
    } catch (error) {
      toast.error("Failed to fetch collection metadata", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }, [collectionName]);

  const resetForm = useCallback(() => {
    setMetadata({});
    setNewKey("");
    setNewValue("");
  }, []);

  useEffect(() => {
    if (open && collectionName) {
      fetchCollectionMetadata();
    } else {
      resetForm();
    }
  }, [open, collectionName, fetchCollectionMetadata, resetForm]);

  const handleSaveMetadata = async () => {
    if (!collectionName) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/collections/${collectionName}/metadata`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ metadata }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update metadata: ${response.statusText}`);
      }

      toast.success("Collection metadata updated successfully");
      onSuccess?.();
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update collection metadata", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMetadata = () => {
    if (!newKey.trim()) {
      toast.error("Key cannot be empty");
      return;
    }

    setMetadata((prev) => ({
      ...prev,
      [newKey]: newValue,
    }));

    setNewKey("");
    setNewValue("");
  };

  const handleRemoveMetadata = (key: string) => {
    setMetadata((prev) => {
      const newMetadata = { ...prev };
      delete newMetadata[key];
      return newMetadata;
    });
  };

  const handleMetadataValueChange = (key: string, value: string) => {
    setMetadata((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Collection: {collectionName}</DialogTitle>
          <DialogDescription>
            Update metadata for this collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Metadata</h3>
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Input value={key} disabled className="flex-1 bg-muted" />
                <Input
                  value={value}
                  onChange={(e) =>
                    handleMetadataValueChange(key, e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveMetadata(key)}
                  type="button"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2 pt-2">
            <div className="grid flex-1 gap-1">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="description"
              />
            </div>
            <div className="grid flex-1 gap-1">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="My collection"
              />
            </div>
            <Button type="button" onClick={handleAddMetadata}>
              Add
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveMetadata}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
