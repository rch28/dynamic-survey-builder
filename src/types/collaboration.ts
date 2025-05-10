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
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  createdAt?: string;
  user?: {
    name: string;
    email: string;
  };
}
