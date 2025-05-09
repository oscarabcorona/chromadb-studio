/**
 * Document upload type definitions
 */

export type FileStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "complete"
  | "error";

export type WorkflowStep =
  | "upload"
  | "processing"
  | "splitting"
  | "embedding"
  | "storing"
  | "complete";

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
