import type { NextRequest } from "next/server";

import {
  checkDatabaseConnection,
  checkSurveyOwnership,
  logActivity,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  formatValidationErrors,
  uuidSchema,
  validateRequest,
} from "@/lib/validation";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { updateCollaboratorSchema } from "@/types/collaboration";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  const { id, collaboratorId } = await params;
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest(
      "PATCH",
      `/api/surveys/${id}/collaborators/${collaboratorId}`,
      user.id
    );

    // Validate ID formats
    try {
      uuidSchema.parse(id);
      uuidSchema.parse(collaboratorId);
    } catch (error) {
      return createErrorResponse(ErrorType.BAD_REQUEST, "Invalid ID format", error);
    }
    const ownershipCheck = await checkSurveyOwnership(id, user.id);
    if (!ownershipCheck.success) return ownershipCheck.error;

    // Parse and validate request body
    const body = await request.json();
    const validation = await validateRequest(updateCollaboratorSchema, body);

    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid role data",
        formatValidationErrors(validation.error)
      );
    }

    const { role } = validation.data;

    // Update the collaborator's role
    const { data: collaborator, error } = await supabaseAdmin
      .from("collaborators")
      .update({ role })
      .eq("id", collaboratorId)
      .eq("survey_id", id)
      .select("id, user_id, role")
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to update collaborator"
      );
    }

    // Log the activity
    await logActivity(user.id, "UPDATE_COLLABORATOR", "survey", id, {
      collaborator_id: collaborator.user_id,
      role,
    });

    return createSuccessResponse({ collaborator });
  } catch (error) {
    console.error("Update collaborator error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to update collaborator"
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  const { id, collaboratorId } = await params;
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;

    const user = authResult.user;
    logApiRequest(
      "DELETE",
      `/api/surveys/${id}/collaborators/${collaboratorId}`,
      user.id
    );

    // Validate ID formats
    try {
      uuidSchema.parse(id);
      uuidSchema.parse(collaboratorId);
    } catch (error) {
      return createErrorResponse(ErrorType.BAD_REQUEST, "Invalid ID format", error);
    }

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    // Only the owner can remove collaborators
    const ownershipCheck = await checkSurveyOwnership(id, user.id);
    if (!ownershipCheck.success) return ownershipCheck.error;

    // Get the collaborator info before deleting
    const { data: collaborator, error: getError } = await supabaseAdmin
      .from("collaborators")
      .select("user_id")
      .eq("id", collaboratorId)
      .single();

    if (getError) {
      console.error("Database error:", getError);
      return createErrorResponse(
        ErrorType.NOT_FOUND,
        "Failed to find collaborator"
      );
    }

    // Delete the collaborator
    const { error } = await supabaseAdmin
      .from("collaborators")
      .delete()
      .eq("id", collaboratorId)
      .eq("survey_id", id);

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to remove collaborator"
      );
    }

    // Log the activity
    await logActivity(user.id, "REMOVE_COLLABORATOR", "survey", id, {
      collaborator_id: collaborator.user_id,
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to remove collaborator"
    );
  }
}
