import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { checkDatabaseConnection, logActivity } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import {
  formatValidationErrors,
  paginationSchema,
  validateRequest,
} from "@/lib/validation";
import { surveySchema } from "@/types/survey";

export async function GET(request: NextRequest) {
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    // Log the API request
    logApiRequest("GET", "/api/surveys", user.id);

    const { searchParams } = new URL(request.url);
    const validatedParams = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    });
    const { page, limit } = validatedParams;
    const offset = (page - 1) * limit;
    // Fetch all surveys where the user is the owner
    const { data: ownedSurveys, error: ownedError } = await supabaseAdmin
      .from("surveys")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ownedError) {
      console.error("Error fetching owned surveys:", ownedError);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to fetch surveys",
        ownedError
      );
    }
    // Fetch all surveys where the user is a collaborator
    const { data: collaborations, error: collabError } = await supabaseAdmin
      .from("collaborators")
      .select(
        `role,
    survey_id,
    survey:surveys!survey_id (*)`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (collabError) {
      console.error("Error fetching collaborations:", collabError);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to fetch collaborations",
        collabError
      );
    }

    // Format collaboration data
    const collaborativeSurveys = collaborations.map((collab) => {
      const survey = collab.survey;
      return {
        ...survey,
        collaborative: true,
        role: collab.role,
      };
    });

    // Return both owned and collaborative surveys
    const allSurveys = [
      ...ownedSurveys.map((survey) => ({ ...survey, owned: true })),
      ...collaborativeSurveys,
    ];
    const totalCount = ownedSurveys.length + collaborations.length;
    return createSuccessResponse({
      surveys: allSurveys,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount || 0,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/surveys:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to fetch surveys",
      error
    );
  }
}
// POST /api/surveys
export async function POST(request: Request) {
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest("POST", "/api/surveys", user.id);

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

    const newSurvey = {
      id: uuidv4(),
      user_id: user.id,
      title: surveyData.title,
      questions: surveyData.questions,
      description: surveyData.description || "",
      metadata: surveyData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin
      .from("surveys")
      .insert(newSurvey)
      .select()
      .single();
    if (error) {
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to create survey"
      );
    }

    // Log activity
    await logActivity(user.id, "CREATE", "survey", data.id, {
      title: data.title,
    });

    return createSuccessResponse({ survey: data }, 201);
  } catch (error) {
    console.error("Error in POST /api/surveys:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to create survey"
    );
  }
}
