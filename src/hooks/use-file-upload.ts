"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { uploadFile, processFiles } from "@/app/actions";
import {
  UploadedFile,
  ProcessingSettings,
  FileStatus,
  WorkflowStep,
} from "@/types/document-upload";
import { generateFileId } from "@/lib/file-utils";
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

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await uploadFile(formData);
    },
  });

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

    setProcessingStep("upload");

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
        formData.append("collectionName", collectionName);

        // Simulate upload progress
        setFiles((prev) =>
          prev.map((f) => (f.id === fileData.id ? { ...f, progress: 40 } : f))
        );

        const result = await uploadMutation.mutateAsync(formData);

        if (result.success) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id
                ? { ...f, status: "complete", progress: 100 }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    error: result.error || "Upload failed",
                  }
                : f
            )
          );
          toast.error(`Failed to upload ${fileData.name}: ${result.error}`);
        }
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

    // Navigate to process tab after uploads complete
    setActiveTab("process");
  }, [files, collectionName, uploadMutation]);

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
    handleFileChange,
    removeFile,
    clearFiles,
    resetForm,
    closeAndComplete,
    handleDragOver,
    handleDrop,
    handleUpload,
    startProcessing,
  };
}
