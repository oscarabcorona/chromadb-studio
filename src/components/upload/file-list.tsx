"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { File, X, CheckCircle2 } from "lucide-react";
import { UploadedFile } from "@/types/document-upload";
import { formatBytes } from "@/lib/file-utils";

interface FileListProps {
  files: UploadedFile[];
  activeFile: string | null;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onClearAll: () => void;
}

export function FileList({
  files,
  activeFile,
  onRemove,
  onSelect,
  onClearAll,
}: FileListProps) {
  // Use memoization for the file list to prevent unnecessary re-renders
  const fileListItems = useMemo(() => {
    return files.map((file) => (
      <div
        key={file.id}
        className={`flex items-center justify-between p-3 border rounded-md ${
          activeFile === file.id ? "border-blue-500 bg-blue-50/50" : ""
        }`}
        onClick={() => onSelect(file.id)}
      >
        <div className="flex items-center gap-3">
          <File className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {file.status === "complete" && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          {file.status === "error" && (
            <span className="text-xs text-red-500 mr-2">{file.error}</span>
          )}
          {(file.status === "uploading" || file.status === "processing") && (
            <Progress value={file.progress} className="w-20" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(file.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ));
  }, [files, activeFile, onRemove, onSelect]);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex justify-between">
        <h4 className="font-medium">Selected Files</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs"
        >
          Clear All
        </Button>
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-2">
        {fileListItems}
      </div>
    </div>
  );
}
