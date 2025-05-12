/**
 * Document upload type definitions
 */

export enum FileStatus {
  Idle = "idle",
  Uploading = "uploading",
  Processing = "processing",
  Complete = "complete",
  Error = "error",
}

export enum WorkflowStep {
  Upload = "upload",
  Uploaded = "uploaded",
  Processing = "processing",
  Splitting = "splitting",
  Embedding = "embedding",
  Storing = "storing",
  Complete = "complete",
}

export interface UploadedFile {
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

export type ProcessingMethod = "default" | "recursive" | "markdown";

export interface ProcessingSettings {
  chunkSize: number;
  chunkOverlap: number;
  processingMethod: ProcessingMethod;
}

export interface FileUploadProps {
  collectionName: string;
  onComplete: () => void;
}

export interface ProcessingMethodInfo {
  [key: string]: {
    title: string;
    description: string;
  };
}
