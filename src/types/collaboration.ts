import { collaboratorRoleSchema, emailSchema } from "@/lib/validation";
import { z } from "zod";

export enum CollaboratorRole {
  OWNER = "owner",
  EDITOR = "editor",
  VIEWER = "viewer",
}

export interface Collaborator {
  id?: string;
  surveyId: string;
  userId: string;
  role: CollaboratorRole;
  createdAt?: Record<string, unknown>;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface ActivityLog {
  id?: string;
  userId: string;
  action: string;
  activityType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt?: string;
  user?: {
    name: string;
    email: string;
  };
}

export const addCollaboratorSchema = z.object({
  email: emailSchema,
  role: collaboratorRoleSchema.default(CollaboratorRole.VIEWER),
});

export const updateCollaboratorSchema = z.object({
  role: collaboratorRoleSchema,
});
