"use server";

import { ChromaDBManager } from "@/lib/chroma-manager";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Define the upload directory
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure the upload directory exists
async function ensureUploadDirectory(collectionName: string): Promise<string> {
  const collectionDir = path.join(UPLOAD_DIR, collectionName);

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  if (!existsSync(collectionDir)) {
    await mkdir(collectionDir, { recursive: true });
  }

  return collectionDir;
}

/**
 * Handle file upload
 */
export async function uploadFile(
  formData: FormData
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  try {
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const collectionName = formData.get("collectionName") as string;

    if (!file || !fileName || !collectionName) {
      return {
        success: false,
        error: "Missing required parameters",
      };
    }

    // Create directories if they don't exist
    const uploadDir = await ensureUploadDirectory(collectionName);

    // Generate a file path
    const filePath = path.join(uploadDir, fileName);

    // Convert the file to a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Write the file to disk
    await writeFile(filePath, fileBuffer);

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    console.error("Failed to upload file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

/**
 * Process uploaded files
 */
export async function processFiles(
  collectionName: string,
  options: {
    fileNames: string[];
    chunkSize?: number;
    chunkOverlap?: number;
    processingMethod?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      fileNames,
      chunkSize = 1000,
      chunkOverlap = 200,
      processingMethod = "default",
    } = options;

    if (!collectionName || !fileNames || fileNames.length === 0) {
      return {
        success: false,
        error: "Missing required parameters",
      };
    }

    const uploadDir = path.join(UPLOAD_DIR, collectionName);
    const manager = new ChromaDBManager({
      collectionName: collectionName.trim(),
      chunkSize,
      chunkOverlap,
    });

    await manager.initialize();

    // Process each file
    for (const fileName of fileNames) {
      const filePath = path.join(uploadDir, fileName);
      const fs = await import("fs/promises");

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        console.error(
          `File ${fileName} does not exist or is not accessible:`,
          error
        );
        return {
          success: false,
          error: `File ${fileName} does not exist or is not accessible`,
        };
      }

      // Handle different file types based on extension
      const fileExtension = path.extname(fileName).toLowerCase();
      let fileContent = "";

      try {
        // For simplicity, we're reading all files as text
        // In a production app, you would use specialized libraries for PDF, DOCX, etc.
        if (fileExtension === ".pdf") {
          // In a real app: Use a PDF parsing library
          fileContent = `Parsed PDF content for ${fileName}. In a real implementation, use a PDF parsing library.`;
        } else if (fileExtension === ".docx" || fileExtension === ".doc") {
          // In a real app: Use a DOCX parsing library
          fileContent = `Parsed DOCX content for ${fileName}. In a real implementation, use a DOCX parsing library.`;
        } else {
          // Default text handling for txt, md, and other text files
          fileContent = await fs.readFile(filePath, "utf8");
        }

        // Apply different processing methods
        const processedContent = fileContent;
        if (processingMethod === "recursive") {
          // Simulate recursive character splitting
          console.log(`Applying recursive character splitting to ${fileName}`);
          // In a real implementation, you would use a specialized text splitter
        } else if (processingMethod === "markdown") {
          // Simulate markdown-aware processing
          console.log(`Applying markdown-aware processing to ${fileName}`);
          // In a real implementation, you would use a markdown parser
        }

        // Add to ChromaDB with enhanced metadata
        await manager.addDocuments([
          {
            pageContent: processedContent,
            metadata: {
              source: fileName,
              file_type: fileExtension.replace(".", ""),
              uploaded_at: new Date().toISOString(),
              processing_method: processingMethod,
              chunk_size: chunkSize,
              chunk_overlap: chunkOverlap,
            },
          },
        ]);
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        return {
          success: false,
          error: `Error processing file ${fileName}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    }

    // Revalidate path
    revalidatePath(`/studio/${collectionName}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to process files:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process files",
    };
  }
}
