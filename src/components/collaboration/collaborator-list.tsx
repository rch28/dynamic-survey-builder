"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, UserPlus, Trash2 } from "lucide-react";
import { useSurveyStore } from "@/store/survey-store";
import { CollaboratorRole } from "@/types/collaboration";
import { AddCollaboratorDialog } from "@/components/collaboration/add-collaborator-dialog";
import { toast } from "sonner";

export function CollaboratorList() {
  const survey = useSurveyStore((state) => state.survey);
  const collaborators = useSurveyStore((state) => state.collaborators);
  const setCollaborators = useSurveyStore((state) => state.setCollaborators);
  const updateCollaborator = useSurveyStore(
    (state) => state.updateCollaborator
  );
  const removeCollaborator = useSurveyStore(
    (state) => state.removeCollaborator
  );

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (survey.id) {
      fetchCollaborators();
    } else {
      setIsLoading(false);
      setCollaborators([]);
    }
  }, [survey.id]);

  const fetchCollaborators = async () => {
    if (!survey.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/surveys/${survey.id}/collaborators`);

      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
      } else {
        toast.error("Error", {
          description: "Failed to fetch collaborators",
        });
      }
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      toast.error("Error", {
        description: "Failed to fetch collaborators",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (
    collaboratorId: string,
    role: CollaboratorRole
  ) => {
    if (!survey.id) return;

    try {
      const response = await fetch(
        `/api/surveys/${survey.id}/collaborators/${collaboratorId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      if (response.ok) {
        updateCollaborator(collaboratorId, role);
        toast.success("success", {
          description: "Collaborator role updated",
        });
      } else {
        toast.error("Error", {
          description: "Failed to update collaborator role",
        });
      }
    } catch (error) {
      console.error("Error updating collaborator:", error);
      toast.error("Error", {
        description: "Failed to update collaborator role",
      });
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!survey.id) return;

    try {
      const response = await fetch(
        `/api/surveys/${survey.id}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        removeCollaborator(collaboratorId);
        toast.success("Success", {
          description: "Collaborator removed",
        });
      } else {
        toast.error("Error", {
          description: "Failed to remove collaborator",
        });
      }
    } catch (error) {
      console.error("Error removing collaborator:", error);
      toast.error("Error", {
        description: "Failed to remove collaborator",
      });
    }
  };

  const getRoleLabel = (role: CollaboratorRole) => {
    switch (role) {
      case CollaboratorRole.OWNER:
        return "Owner";
      case CollaboratorRole.EDITOR:
        return "Editor";
      case CollaboratorRole.VIEWER:
        return "Viewer";
      default:
        return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading collaborators...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Collaborators</h3>
        <Button onClick={() => setIsAddDialogOpen(true)} disabled={!survey.id}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Collaborator
        </Button>
      </div>

      {collaborators.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          No collaborators yet. Add collaborators to work together on this
          survey.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collaborators.map((collaborator) => (
              <TableRow key={collaborator.id}>
                <TableCell className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {collaborator.user?.avatarUrl && (
                      <AvatarImage
                        src={collaborator.user.avatarUrl || "/placeholder.svg"}
                        alt={collaborator.user.name}
                      />
                    )}
                    <AvatarFallback>
                      {collaborator.user
                        ? getInitials(collaborator.user.name)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{collaborator.user?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {collaborator.user?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleLabel(collaborator.role)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleRoleChange(
                            collaborator.id!,
                            CollaboratorRole.EDITOR
                          )
                        }
                        disabled={
                          collaborator.role === CollaboratorRole.OWNER ||
                          collaborator.role === CollaboratorRole.EDITOR
                        }
                      >
                        Make Editor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleRoleChange(
                            collaborator.id!,
                            CollaboratorRole.VIEWER
                          )
                        }
                        disabled={
                          collaborator.role === CollaboratorRole.OWNER ||
                          collaborator.role === CollaboratorRole.VIEWER
                        }
                      >
                        Make Viewer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleRemoveCollaborator(collaborator.id!)
                        }
                        disabled={collaborator.role === CollaboratorRole.OWNER}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AddCollaboratorDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        surveyId={survey.id}
        onSuccess={fetchCollaborators}
      />
    </div>
  );
}
