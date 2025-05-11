"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  UploadedFile,
  FileStatus,
  WorkflowStep,
} from "@/types/document-upload";
import { generateFileId } from "@/lib/file-utils";

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      const newFiles = Array.from(e.target.files).map((file) => ({
        id: generateFileId(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "idle" as FileStatus,
        progress: 0,
        file,
        workflowStep: "upload" as WorkflowStep,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    []
  );

  const removeFile = useCallback(
    (id: string) => {
      // Bug if removing file can't upload again.
      setFiles((prev) => prev.filter((file) => file.id !== id));
      if (activeFile === id) {
        setActiveFile(null);
      }
    },
    [activeFile]
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
      id: generateFileId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "idle" as FileStatus,
      progress: 0,
      file,
      workflowStep: "upload" as WorkflowStep,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      toast.error("Please add files to upload");
      return;
    }

    // Update all files to uploading status
    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        status: "uploading",
        progress: 0,
        workflowStep: "upload",
      }))
    );

    // Upload files one by one
    for (const fileData of files) {
      try {
        if (!fileData.file) continue;

        setActiveFile(fileData.id);

        // Update this specific file's status
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "uploading",
                  progress: 10,
                  workflowStep: "upload",
                }
              : f
          )
        );

        const formData = new FormData();
        formData.append("file", fileData.file);
        formData.append("fileName", fileData.name);

        // Simulate upload progress
        setFiles((prev) =>
          prev.map((f) => (f.id === fileData.id ? { ...f, progress: 40 } : f))
        );

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: "complete", progress: 100 }
              : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : f
          )
        );
        toast.error(
          `Error uploading ${fileData.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }, [files]);

  return {
    // State
    files,
    activeFile,
    fileInputRef,

    // State setters
    setFiles,
    setActiveFile,

    // Actions
    handleFileChange,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDrop,
    handleUpload,
  };
}
