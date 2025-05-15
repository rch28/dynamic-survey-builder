import { supabaseAdmin } from "./supabase";
import { ApiError, createErrorResponse, ErrorType } from "./api-utils";
import { NextResponse } from "next/server";

interface DatabaseConnectionError {
  success: false;
  error: NextResponse<ApiError<unknown>>;
}

interface DatabaseConnectionSuccess {
  success: true;
  client: NonNullable<typeof supabaseAdmin>;
}
// Check if database is available
export function checkDatabaseConnection():
  | DatabaseConnectionSuccess
  | DatabaseConnectionError {
  if (!supabaseAdmin) {
    return {
      success: false,
      error: createErrorResponse(
        ErrorType.SERVICE_UNAVAILABLE,
        "Database connection not available"
      ),
    };
  }

  return { success: true as const, client: supabaseAdmin };
}

// Check if a user owns a survey
export async function checkSurveyOwnership(surveyId: string, userId: string) {
  const dbCheck = checkDatabaseConnection();
  if (!dbCheck.success) return dbCheck;
  const supabaseAdmin = dbCheck.client;
  try {
    const { data, error } = await supabaseAdmin
      .from("surveys")
      .select("id")
      .eq("id", surveyId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: createErrorResponse(
          ErrorType.NOT_FOUND,
          "Survey not found or you don't have access"
        ),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error checking survey ownership:", error);
    return {
      success: false,
      error: createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to verify survey access"
      ),
    };
  }
}

// Check if a user has access to a survey (owner or collaborator)
export async function checkSurveyAccess(
  surveyId: string,
  userId: string,
  requiredRole?: string
) {
  const dbCheck = checkDatabaseConnection();
  if (!dbCheck.success) return dbCheck;
  const supabaseAdmin = dbCheck.client;

  try {
    // First check if user is the owner
    const { data: survey } = await supabaseAdmin
      .from("surveys")
      .select("id")
      .eq("id", surveyId)
      .eq("user_id", userId)
      .single();

    if (survey) {
      return { success: true, role: "OWNER" };
    }

    // If not the owner, check if they're a collaborator
    const { data: collaborator, error: collaboratorError } = await supabaseAdmin
      .from("collaborators")
      .select("role")
      .eq("survey_id", surveyId)
      .eq("user_id", userId)
      .single();

    if (collaboratorError || !collaborator) {
      return {
        success: false,
        error: createErrorResponse(
          ErrorType.FORBIDDEN,
          "You don't have access to this survey"
        ),
      };
    }

    // If a specific role is required, check it
    if (
      requiredRole &&
      collaborator.role !== requiredRole &&
      collaborator.role !== "owner"
    ) {
      return {
        success: false,
        error: createErrorResponse(
          ErrorType.FORBIDDEN,
          `${requiredRole} role required for this operation`
        ),
      };
    }

    return { success: true, role: collaborator.role };
  } catch (error) {
    console.error("Error checking survey access:", error);
    return {
      success: false,
      error: createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to verify survey access"
      ),
    };
  }
}

// Log activity
export async function logActivity(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
) {
  if (!supabaseAdmin) return;

  try {
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
