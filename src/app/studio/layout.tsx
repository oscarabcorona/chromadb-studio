"use client";

import { ConnectionFlow } from "@/components/connection-flow";
import { useChromaStore } from "@/store/chroma-store";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { testConnection } from "@/app/actions";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected, dbUrl, collections, setConnected, setError } =
    useChromaStore();

  useEffect(() => {
    async function validateConnection() {
      if (!isConnected) {
        const result = await testConnection(dbUrl);
        if (!result.success) {
          setConnected(false);
          setError(result.error || "Connection failed");
          redirect("/");
        }
        setConnected(true);
      }
    }

    validateConnection();
  }, [isConnected, dbUrl, setConnected, setError]);

  useEffect(() => {
    if (!isConnected || collections.length === 0) {
      redirect("/");
    }
  }, [isConnected, collections.length]);

  return (
    <>
      <ConnectionFlow />
      {children}
    </>
  );
}
