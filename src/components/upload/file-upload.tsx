"use client";

import {
  useState,
  // useTransition
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { WorkflowTimeline } from "../documents/workflow-timeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  FileUploadProps,
  // ProcessingMethod
} from "@/types/document-upload";
import { PROCESSING_METHOD_INFO } from "@/lib/document-processing";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useMemo } from "react";
import { formatBytes } from "@/lib/file-utils";

export function FileUpload({}: // collectionName,
// onComplete
FileUploadProps) {
  // const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("upload");
  const {
    files,
    activeFile,
    fileInputRef,
    setActiveFile,
    handleFileChange,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDrop,
    handleUpload,
  } = useFileUpload();
  console.log("🚀 ~ files upload:", files);

  // Calculate active file data once
  // const activeFileData = useMemo(() => {
  //   if (activeFile) {
  //     return files.find((f) => f.id === activeFile);
  //   }
  //   return files.length > 0 ? files[0] : null;
  // }, [activeFile, files]);

  // const closeAndComplete = () => {
  //   startTransition(() => {
  //     // hookCloseAndComplete();
  //   });
  // };

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
  }, [files, activeFile, removeFile, setActiveFile]);

  return (
    <Dialog>
      <DialogTrigger className="gap-2" asChild>
        <Button variant="outline">
          <FileUp className="h-4 w-4" />
          Upload Files
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload documents to add to your knowledge base
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                Supports PDF, TXT, DOCX, MD files.
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
                        value={"Chuncks"}
                        min={100}
                        max={5000}
                      />
                      <span className="text-sm text-muted-foreground">
                        characters
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Size of text chunks for embedding (recommended: 1000-2000)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chunkOverlap">Chunk Overlap</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="chunkOverlap"
                        type="number"
                        value={"Overlap"}
                        min={0}
                        max={1000}
                      />
                      <span className="text-sm text-muted-foreground">
                        characters
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Overlap between chunks (recommended: 10-20% of chunk size)
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
                    <Select>
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
                        <SelectItem value="markdown">Markdown Aware</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Method for splitting documents into chunks
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
                  <Button onClick={() => setActiveTab("process")}>
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
              disabled={files.length === 0}
              onClick={handleUpload}
              className="gap-1"
            >
              <ArrowRight className="h-4 w-4" />
              Extract & Embed
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
