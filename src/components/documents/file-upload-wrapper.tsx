"use client";

import { FileUpload } from "./file-upload";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface FileUploadWrapperProps {
  collectionName: string;
}

export function FileUploadWrapper({ collectionName }: FileUploadWrapperProps) {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());

  const handleComplete = () => {
    // Force a complete refresh of the collection data
    router.refresh();
    // Also force a navigation to the same page to ensure UI is fully updated
    router.push(`/studio/${collectionName}`);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <FileUpload collectionName={collectionName} onComplete={handleComplete} />
    </QueryClientProvider>
  );
}
