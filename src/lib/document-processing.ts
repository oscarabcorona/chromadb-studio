/**
 * Document processing constants and utilities
 */

import { ProcessingMethodInfo } from "@/types/document-upload";

/**
 * Information about different processing methods
 */
export const PROCESSING_METHOD_INFO: ProcessingMethodInfo = {
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

/**
 * Default processing settings
 */
export const DEFAULT_PROCESSING_SETTINGS = {
  chunkSize: 1000,
  chunkOverlap: 200,
  processingMethod: "default" as const,
};
