"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollaboratorRole } from "@/types/collaboration";
import { useSurveyStore } from "@/store/survey-store";
import { toast } from "sonner";

interface AddCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string | undefined;
  onSuccess: () => void;
}

export function AddCollaboratorDialog({
  open,
  onOpenChange,
  surveyId,
  onSuccess,
}: AddCollaboratorDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>(CollaboratorRole.VIEWER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addCollaborator = useSurveyStore((state) => state.addCollaborator);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!surveyId) {
      toast.error("Error", {
        description: "Please save the survey before adding collaborators",
      });
      return;
    }

    if (!email) {
      toast.error("Error", {
        description: "Please enter an email address",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/surveys/${surveyId}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      if (response.ok) {
        const data = await response.json();
        addCollaborator(data.collaborator);
        toast.success("Success", {
          description: "Collaborator added successfully",
        });
        setEmail("");
        setRole(CollaboratorRole.VIEWER);
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error("Error", {
          description: error.error || "Failed to add collaborator",
        });
      }
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast.error("Error", {
        description: "Failed to add collaborator",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" w-full mx-4 sm:w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Collaborator</DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on this survey. They will receive an
            email notification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="collaborator@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as CollaboratorRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CollaboratorRole.EDITOR}>
                  Editor (can edit)
                </SelectItem>
                <SelectItem value={CollaboratorRole.VIEWER}>
                  Viewer (can view only)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Collaborator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
