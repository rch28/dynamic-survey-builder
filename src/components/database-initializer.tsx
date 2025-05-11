"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function DatabaseInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/init-supabase");

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to initialize database");
        }

        setInitialized(true);
        toast.success("Database initialized", {
          description: "The database has been successfully set up.",
        });
      } catch (err) {
        console.error("Database initialization error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        toast.error("Database initialization failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // This component doesn't render anything visible
  return null;
}
