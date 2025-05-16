import { NextRequest } from "next/server";

import {
  checkDatabaseConnection,
  checkSurveyAccess,
  logActivity,
} from "@/lib/db";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import {
  formatValidationErrors,
  uuidSchema,
  validateRequest,
} from "@/lib/validation";
import { surveySchema } from "@/types/survey";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    // Extract the id from params immediately
    const { id } = await params;
    try {
      uuidSchema.parse(id);
    } catch (error) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "Invalid survey ID format",
        error
      );
    }

    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest("GET", "/api/surveys/[id]", user.id);

    // First, check if user is the owner
    const { data: ownedSurvey, error: ownedError } = await supabaseAdmin
      .from("surveys")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (ownedSurvey && !ownedError) {
      // Get user information in a separate query
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("name, email, avatar_url")
        .eq("id", ownedSurvey.user_id)
        .single();

      // User is the owner, return with ownership flag and user data
      return createSuccessResponse({
        survey: {
          ...ownedSurvey,
          isOwner: true,
          user: userData || null,
        },
      });
    }
    // If not the owner, check if user is a collaborator
    const { data: collaboration, error: collabError } = await supabaseAdmin
      .from("collaborators")
      .select(" role, survey_id")
      .eq("survey_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (collaboration && !collabError) {
      // Get the survey
      const { data: surveyData } = await supabaseAdmin
        .from("surveys")
        .select("*")
        .eq("id", collaboration.survey_id)
        .single();

      // Get owner information
      const { data: ownerData } = await supabaseAdmin
        .from("users")
        .select("name, email, avatar_url")
        .eq("id", surveyData.user_id)
        .single();

      // User is a collaborator, return with role
      return createSuccessResponse({
        survey: {
          ...surveyData,
          isOwner: false,
          role: collaboration.role,
          user: ownerData || null,
        },
      });
    }

    return createErrorResponse(ErrorType.NOT_FOUND, "Survey not found");
  } catch (error) {
    console.error("Error in GET /api/surveys:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to fetch survey",
      error
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    const { id } = await params;
    try {
      uuidSchema.parse(id);
    } catch (error) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "Invalid survey ID format",
        error
      );
    }
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest("PUT", "/api/surveys/[id]", user.id);

    const accessCheck = await checkSurveyAccess(id, user.id, "EDITOR");
    if (!accessCheck.success) return accessCheck.error;
    const body = await request.json();
    const validation = await validateRequest(surveySchema, body);
    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid survey data",
        formatValidationErrors(validation.error)
      );
    }
    const surveyData = validation.data;

    // Update survey in Supabase (without the user_id filter so collaborators can edit)
    const { data: updatedSurvey, error } = await supabaseAdmin
      .from("surveys")
      .update({
        title: surveyData.title,
        questions: surveyData.questions,
        description: surveyData.description || "",
        metadata: surveyData.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", id) // Only filter by survey ID, not by user_id
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to update survey"
      );
    }
    await logActivity(user.id, "UPDATE", "survey", id, {
      title: surveyData.title,
      questions: surveyData.questions,
      description: surveyData.description,
      metadata: surveyData.metadata,
    });

    return createSuccessResponse({
      survey: updatedSurvey,
    });
  } catch (error) {
    console.error("Error in PUT /api/surveys:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to update survey",
      error
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    const { id } = await params;
    try {
      uuidSchema.parse(id);
    } catch (error) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "Invalid survey ID format",
        error
      );
    }

    const authResult = await requireAuth(request);
    if (authResult.error) return authResult;
    const user = authResult.user;
    logApiRequest("DELETE", "/api/surveys/[id]", user.id);
    // Check if user is the owner (only owners can delete surveys)
    const ownerShipCheck = await checkSurveyAccess(id, user.id);
    if (!ownerShipCheck.success) return ownerShipCheck.error;

    // Get survey info before deletion for logging
    const { data: survey } = await supabaseAdmin
      .from("surveys")
      .select("title")
      .eq("id", id)
      .single();
    const { error } = await supabaseAdmin.from("surveys").delete().eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to delete survey"
      );
    }

    // Log activity
    await logActivity(user.id, "DELETE", "survey", id, {
      title: survey?.title || "Unknown",
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/surveys:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to delete survey",
      error
    );
  }
}
