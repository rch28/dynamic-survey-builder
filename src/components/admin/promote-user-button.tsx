"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface PromoteUserButtonProps {
  userId: string;
  userEmail: string;
  onSuccess: () => void;
}

export function PromoteUserButton({
  userId,
  userEmail,
  onSuccess,
}: PromoteUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePromote = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Success", {
          description: `${userEmail} has been promoted to admin`,
        });
        onSuccess();
      } else {
        toast.error("Error", {
          description: data.error || "Failed to promote user",
        });
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      toast("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1"
      >
        <ShieldCheck className="h-4 w-4" />
        <span>Promote to Admin</span>
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote User to Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote {userEmail} to admin? This will
              give them full access to all administrative functions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePromote();
              }}
              disabled={isLoading}
            >
              {isLoading ? "Promoting..." : "Promote User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
