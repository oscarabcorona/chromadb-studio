"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { processFiles } from "@/app/actions/uploads";
import {
  UploadedFile,
  ProcessingSettings,
  WorkflowStep,
} from "@/types/document-upload";
import { DEFAULT_PROCESSING_SETTINGS } from "@/lib/document-processing";

interface UseFileUploadProps {
  collectionName: string;
  onComplete: () => void;
}

export function useFileUpload({
  collectionName,
  onComplete,
}: UseFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<WorkflowStep>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingSettings, setProcessingSettings] =
    useState<ProcessingSettings>(DEFAULT_PROCESSING_SETTINGS);

  // Process files mutation
  const processMutation = useMutation({
    mutationFn: async (options: {
      collectionName: string;
      fileNames: string[];
      chunkSize: number;
      chunkOverlap: number;
      processingMethod: string;
    }) => {
      return await processFiles(options.collectionName, {
        fileNames: options.fileNames,
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap,
        processingMethod: options.processingMethod,
      });
    },
  });

  const removeFile = useCallback(
    (id: string) => {
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

  const resetForm = useCallback(() => {
    setProcessingSettings(DEFAULT_PROCESSING_SETTINGS);
    clearFiles();
    setActiveTab("upload");
    setShowProcessingDialog(false);
    setProcessingComplete(false);
    setActiveFile(null);
  }, [clearFiles]);

  const closeAndComplete = useCallback(() => {
    resetForm();
    setShowProcessingDialog(false);
    setIsOpen(false);
    onComplete();
  }, [resetForm, onComplete]);

  const startProcessing = useCallback(async () => {
    setShowProcessingDialog(true);
    setProcessingStep("processing");
    setProcessingComplete(false);

    try {
      // Only process files that were successfully uploaded
      const uploadedFileIds = files
        .filter((f) => f.status === "complete")
        .map((f) => f.name);

      if (uploadedFileIds.length === 0) {
        toast.error("No successfully uploaded files to process");
        return;
      }

      // Get the first complete file to track progress for
      const firstCompleteFile = files.find((f) => f.status === "complete");
      if (firstCompleteFile) {
        setActiveFile(firstCompleteFile.id);
      }

      // Set all files to processing
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "complete"
            ? {
                ...f,
                status: "processing",
                progress: 0,
                workflowStep: "processing",
              }
            : f
        )
      );

      // Simulate the text splitting step with optimized animation frames
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProcessingStep("splitting");
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "processing"
            ? { ...f, workflowStep: "splitting", progress: 30 }
            : f
        )
      );

      // Simulate the embedding step
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProcessingStep("embedding");
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "processing"
            ? { ...f, workflowStep: "embedding", progress: 60 }
            : f
        )
      );

      // Simulate the storing step
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStep("storing");
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "processing"
            ? { ...f, workflowStep: "storing", progress: 80 }
            : f
        )
      );

      const result = await processMutation.mutateAsync({
        collectionName,
        fileNames: uploadedFileIds,
        chunkSize: processingSettings.chunkSize,
        chunkOverlap: processingSettings.chunkOverlap,
        processingMethod: processingSettings.processingMethod,
      });

      if (result.success) {
        // Update files to processed
        setProcessingStep("complete");
        setFiles((prev) =>
          prev.map((f) =>
            f.status === "processing"
              ? {
                  ...f,
                  status: "complete",
                  progress: 100,
                  workflowStep: "complete",
                }
              : f
          )
        );

        // Set processing as complete to show final step
        setProcessingComplete(true);
        toast.success("Files processed successfully");
      } else {
        // Update files to error
        setFiles((prev) =>
          prev.map((f) =>
            f.status === "processing"
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: result.error || "Processing failed",
                }
              : f
          )
        );
        toast.error(`Failed to process files: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        `Error processing files: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [files, collectionName, processingSettings, processMutation]);

  // The complete file count
  const completeFilesCount = files.filter(
    (f) => f.status === "complete"
  ).length;

  return {
    // State
    files,
    isOpen,
    activeTab,
    activeFile,
    processingStep,
    fileInputRef,
    showProcessingDialog,
    processingComplete,
    processingSettings,
    completeFilesCount,

    // State setters
    setFiles,
    setIsOpen,
    setActiveTab,
    setActiveFile,
    setProcessingSettings,
    setShowProcessingDialog,

    // Actions
    removeFile,
    clearFiles,
    resetForm,
    closeAndComplete,
    startProcessing,
  };
}
