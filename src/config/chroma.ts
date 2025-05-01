const DEFAULT_CHROMA_PATH = "http://localhost:8000";

export const CHROMA_CONFIG = {
  path: process.env.NEXT_PUBLIC_CHROMA_DB_PATH || DEFAULT_CHROMA_PATH,
  auth: process.env.NEXT_PUBLIC_CHROMA_AUTH_TOKEN,
  // Add any additional configuration options here
} as const;

// Validate configuration
if (!CHROMA_CONFIG.path) {
  console.warn(
    "ChromaDB path not configured. Using default:",
    DEFAULT_CHROMA_PATH
  );
}
