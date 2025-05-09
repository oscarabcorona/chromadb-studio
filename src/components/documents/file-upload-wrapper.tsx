"use client";

import { FileUpload } from "./file-upload";
import { useRouter } from "next/navigation";

interface FileUploadWrapperProps {
  collectionName: string;
}

export function FileUploadWrapper({ collectionName }: FileUploadWrapperProps) {
  const router = useRouter();

  const handleComplete = () => {
    // Force a complete refresh of the collection data
    router.refresh();
    // Also force a navigation to the same page to ensure UI is fully updated
    router.push(`/studio/${collectionName}`);
  };

  return (
    <FileUpload collectionName={collectionName} onComplete={handleComplete} />
  );
}
