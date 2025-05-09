"use client";

import { useState, useRef, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  File,
  FileUp,
  Upload,
  X,
  CheckCircle2,
  PlayCircle,
  InfoIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { uploadFile, processFiles } from "@/app/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowTimeline } from "../documents/workflow-timeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

interface FileUploadProps {
  collectionName: string;
  onComplete: () => void;
}

type FileStatus = "idle" | "uploading" | "processing" | "complete" | "error";
type WorkflowStep =
  | "upload"
  | "processing"
  | "splitting"
  | "embedding"
  | "storing"
  | "complete";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number;
  error?: string;
  file?: File;
  workflowStep?: WorkflowStep;
}

type ProcessingMethod = "default" | "recursive" | "markdown";

interface ProcessingSettings {
  chunkSize: number;
  chunkOverlap: number;
  processingMethod: ProcessingMethod;
}

const PROCESSING_METHOD_INFO = {
  default: {
    title: "Default Text Splitting",
    description:
      "Splits text by paragraphs and then by sentences if needed. Good for general text documents.",
  },
  recursive: {
    title: "Recursive Character Splitting",
    description:
      "Recursively splits text by characters, periods, then paragraphs. Best for long, dense texts with varied structure.",
  },
  markdown: {
    title: "Markdown Aware",
    description:
      "Respects Markdown headings and structure when splitting. Ideal for Markdown documents or those with clear hierarchical structure.",
  },
};

export function FileUpload({ collectionName, onComplete }: FileUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<WorkflowStep>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Processing settings state
  const [processingSettings, setProcessingSettings] =
    useState<ProcessingSettings>({
      chunkSize: 1000,
      chunkOverlap: 200,
      processingMethod: "default",
    });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "idle" as FileStatus,
      progress: 0,
      file,
      workflowStep: "upload" as WorkflowStep,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
    if (activeFile === id) {
      setActiveFile(null);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const handleUpload = async () => {
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
  };

  const startProcessing = async () => {
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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "idle" as FileStatus,
      progress: 0,
      file,
      workflowStep: "upload" as WorkflowStep,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setProcessingSettings({
      chunkSize: 1000,
      chunkOverlap: 200,
      processingMethod: "default",
    });
    clearFiles();
    setActiveTab("upload");
    setShowProcessingDialog(false);
    setProcessingComplete(false);
    setActiveFile(null);
  };

  // Calculate active file data once
  const activeFileData = useMemo(() => {
    if (activeFile) {
      return files.find((f) => f.id === activeFile);
    }
    return files.length > 0 ? files[0] : null;
  }, [activeFile, files]);

  const closeAndComplete = () => {
    startTransition(() => {
      resetForm();
      setShowProcessingDialog(false);
      setIsOpen(false);
      onComplete();
    });
  };

  // Memoize files that are complete
  const completeFilesCount = useMemo(() => {
    return files.filter((f) => f.status === "complete").length;
  }, [files]);

  // Use memoization for the file list to prevent unnecessary re-renders
  const fileList = useMemo(() => {
    return files.map((file) => (
      <div
        key={file.id}
        className={`flex items-center justify-between p-3 border rounded-md ${
          activeFile === file.id ? "border-blue-500 bg-blue-50/50" : ""
        }`}
        onClick={() => setActiveFile(file.id)}
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
              removeFile(file.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ));
  }, [files, activeFile, formatBytes, removeFile]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <FileUp className="h-4 w-4" />
        Upload Files
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
          setIsOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload documents to add to your knowledge base
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <FileUp className="h-4 w-4 mr-2" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="process" disabled={files.length === 0}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Configure Processing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="py-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  Drop files here or click to browse
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports PDF, TXT, DOCX, MD files. Max 20MB.
                </p>
                <Input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.doc,.docx,.md"
                />
              </div>

              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between">
                    <h4 className="font-medium">Selected Files</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFiles}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {fileList}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="process" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configure Processing Settings</CardTitle>
                  <CardDescription>
                    Define how your documents will be processed and embedded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="chunkSize">Chunk Size</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="chunkSize"
                          type="number"
                          value={processingSettings.chunkSize}
                          onChange={(e) =>
                            setProcessingSettings((prev) => ({
                              ...prev,
                              chunkSize: parseInt(e.target.value) || 1000,
                            }))
                          }
                          min={100}
                          max={5000}
                        />
                        <span className="text-sm text-muted-foreground">
                          characters
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Size of text chunks for embedding (recommended:
                        1000-2000)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chunkOverlap">Chunk Overlap</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="chunkOverlap"
                          type="number"
                          value={processingSettings.chunkOverlap}
                          onChange={(e) =>
                            setProcessingSettings((prev) => ({
                              ...prev,
                              chunkOverlap: parseInt(e.target.value) || 200,
                            }))
                          }
                          min={0}
                          max={1000}
                        />
                        <span className="text-sm text-muted-foreground">
                          characters
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Overlap between chunks (recommended: 10-20% of chunk
                        size)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="processingMethod">
                          Processing Method
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-medium">Processing Methods:</p>
                              <ul className="text-xs mt-1 space-y-1">
                                {Object.entries(PROCESSING_METHOD_INFO).map(
                                  ([key, info]) => (
                                    <li key={key} className="mt-1">
                                      <span className="font-medium">
                                        {info.title}:
                                      </span>{" "}
                                      {info.description}
                                    </li>
                                  )
                                )}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select
                        value={processingSettings.processingMethod}
                        onValueChange={(value) =>
                          setProcessingSettings((prev) => ({
                            ...prev,
                            processingMethod: value as ProcessingMethod,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a processing method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            Default Text Splitting
                          </SelectItem>
                          <SelectItem value="recursive">
                            Recursive Character Splitting
                          </SelectItem>
                          <SelectItem value="markdown">
                            Markdown Aware
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {
                          PROCESSING_METHOD_INFO[
                            processingSettings.processingMethod
                          ]?.description
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center justify-between w-full">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("upload")}
                    >
                      Back to Files
                    </Button>
                    <Button
                      onClick={startProcessing}
                      disabled={completeFilesCount === 0 || isPending}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Process & Embed Files
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-2">
            {activeTab === "upload" && (
              <Button
                disabled={files.length === 0 || isPending}
                onClick={handleUpload}
                className="gap-1"
              >
                <ArrowRight className="h-4 w-4" />
                Upload & Continue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Processing Dialog */}
      <Dialog
        open={showProcessingDialog}
        onOpenChange={(open) => {
          // Prevent closing dialog during processing
          if (!open && !processingComplete) {
            return;
          }
          setShowProcessingDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {processingComplete
                ? "Processing Complete"
                : "Processing Documents"}
            </DialogTitle>
            <DialogDescription>
              {processingComplete
                ? "Your documents have been successfully processed and stored"
                : "Your documents are being processed and embedded"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {activeFileData && (
              <WorkflowTimeline
                currentStep={activeFileData.workflowStep || processingStep}
                fileName={activeFileData.name}
                processingMethod={processingSettings.processingMethod}
                chunkSize={processingSettings.chunkSize}
                chunkOverlap={processingSettings.chunkOverlap}
              />
            )}
          </div>

          {processingComplete && (
            <div className="flex flex-col items-center py-8">
              <CheckCircle2 className="h-20 w-20 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-center mb-2">
                Processing Complete!
              </h3>
              <p className="text-gray-600 text-center">
                All documents have been successfully processed and are ready to
                use
              </p>
            </div>
          )}

          <DialogFooter>
            {processingComplete && (
              <Button onClick={closeAndComplete} disabled={isPending}>
                Return to Collection
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
