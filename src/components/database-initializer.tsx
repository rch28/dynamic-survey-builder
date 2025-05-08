"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

const DatabaseInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeDatabase = async () => {
    try {
      setIsInitializing(true);
      const response = await fetch("/api/setup-db");

      if (response.ok) {
        setIsInitialized(true);
        toast.success("Database initialized", {
          description: "The database tables have been created successfully.",
        });
      } else {
        const data = await response.json();
        toast.error("Initialization failed", {
          description: data.error || "Failed to initialize database",
        });
      }
    } catch (error) {
      console.error("Database initialization error:", error);
      toast.error("Initialization failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsInitializing(false);
    }
  };
  return (
    <div className="p-4 border rounded-md bg-muted/20">
      <h2 className="text-lg font-medium mb-2">Database Setup</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Initialize the database tables required for the survey builder.
      </p>
      <Button
        onClick={initializeDatabase}
        disabled={isInitializing || isInitialized}
      >
        {isInitializing
          ? "Initializing..."
          : isInitialized
          ? "Initialized"
          : "Initialize Database"}
      </Button>
    </div>
  );
};

export default DatabaseInitializer;
