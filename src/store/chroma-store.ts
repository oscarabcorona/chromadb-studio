"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CollectionInfo } from "@/types/embeddings";

interface ChromaState {
  dbUrl: string;
  isConnected: boolean;
  collections: CollectionInfo[];
  isLoading: boolean;
  error: string | null;
  setDbUrl: (url: string) => void;
  setConnected: (connected: boolean) => void;
  setCollections: (collections: CollectionInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  dbUrl: process.env.NEXT_PUBLIC_CHROMA_DB_PATH || "http://localhost:8000",
  isConnected: false,
  collections: [],
  isLoading: false,
  error: null,
};

export const useChromaStore = create<ChromaState>()(
  persist(
    (set) => ({
      ...initialState,
      setDbUrl: (dbUrl: string) =>
        set({ dbUrl, isConnected: false, error: null }),
      setConnected: (isConnected: boolean) => set({ isConnected }),
      setCollections: (collections: CollectionInfo[]) => set({ collections }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: "chroma-storage",
      partialize: (state) => ({
        dbUrl: state.dbUrl,
        isConnected: state.isConnected,
        collections: state.collections,
      }),
    }
  )
);
