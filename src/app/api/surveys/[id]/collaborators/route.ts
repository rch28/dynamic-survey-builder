import { addCollaboratorSchema, CollaboratorRole } from "@/types/collaboration";
import {
  checkDatabaseConnection,
  checkSurveyAccess,
  logActivity,
} from "@/lib/db";
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
  uuidSchema,
  validateRequest,
} from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest("GET", `/api/surveys/${id}/collaborators`, user.id);

    try {
      uuidSchema.parse(id);
    } catch (error) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "Invalid survey ID format",
        error
      );
    }
    const accessCheck = await checkSurveyAccess(id, user.id);
    if (!accessCheck.success) return accessCheck.error;

    const searchParams = new URL(request.url).searchParams;
    const validatedParams = paginationSchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });
    const { page, limit } = validatedParams;
    const offset = (page - 1) * limit;

    // Fetch collaborators
    const {
      data: collaborators,
      error,
      count,
    } = await supabaseAdmin
      .from("collaborators")
      .select(
        `
        id,
        survey_id,
        user_id,
        role,
        created_at,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `,
        {
          count: "exact",
        }
      )
      .eq("survey_id", id)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to fetch collaborators",
        error
      );
    }

    // Transform the data to match our types
    const formattedCollaborators = collaborators?.map((c) => ({
      id: c.id,
      surveyId: c.survey_id,
      userId: c.user_id,
      role: c.role,
      createdAt: c.created_at,
      user: c.users || {
        id: "",
        name: "",
        email: "",
        avatarUrl: "",
      },
    }));

    return createSuccessResponse({
      collaborators: formattedCollaborators,
      pagination: {
        page,
        limit,
        total: count,
        pages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error("Get collaborators error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to fetch collaborators",
      error
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;

    const user = authResult.user;
    logApiRequest("POST", `/api/surveys/${id}/collaborators`, user.id);

    // Validate ID format
    try {
      uuidSchema.parse(id);
    } catch (error) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "Invalid survey ID format",
        error
      );
    }

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    // Check if user has edit access to the survey
    const accessCheck = await checkSurveyAccess(id, user.id, "EDITOR");
    if (!accessCheck.success) return accessCheck.error;

    // Parse and validate request body
    const body = await request.json();
    const validation = await validateRequest(addCollaboratorSchema, body);

    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid collaborator data",
        formatValidationErrors(validation.error)
      );
    }

    const { email, role } = validation.data;

    // Find the user by email
    let userData;
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("email", email)
      .single();

    if (userError || !existingUser) {
      // User doesn't exist, create a new user
      const { data: newUser, error: createUserError } = await supabaseAdmin
        .from("users")
        .insert({
          email,
          name: email.split("@")[0], // Use part of email as name
        })
        .select("id, name, email, avatar_url")
        .single();

      if (createUserError || !newUser) {
        console.error("Error creating user:", createUserError);
        return createErrorResponse(
          ErrorType.INTERNAL_ERROR,
          "Failed to create user",
          createUserError
        );
      }

      userData = newUser;
    } else {
      // Use the existing user
      userData = existingUser;
    }

    // Check if the user is already a collaborator
    const { data: existingCollaborator } = await supabaseAdmin
      .from("collaborators")
      .select("id")
      .eq("survey_id", id)
      .eq("user_id", userData.id)
      .single();

    if (existingCollaborator) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "User is already a collaborator"
      );
    }

    // Add the collaborator
    const { data: collaborator, error } = await supabaseAdmin
      .from("collaborators")
      .insert({
        survey_id: id,
        user_id: userData.id,
        role: role || CollaboratorRole.VIEWER,
      })
      .select("id, survey_id, user_id, role, created_at")
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to add collaborator",
        error
      );
    }

    await logActivity(user.id, "ADD_COLLABORATOR", "survey", id, {
      collaborator_id: userData.id,
      collaborator_email: email,
      role,
    });

    // Return the collaborator with user info
    const formattedCollaborator = {
      id: collaborator.id,
      surveyId: collaborator.survey_id,
      userId: collaborator.user_id,
      role: collaborator.role,
      createdAt: collaborator.created_at,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatarUrl: userData.avatar_url,
      },
    };

    return createSuccessResponse(
      {
        collaborator: formattedCollaborator,
      },
      201
    );
  } catch (error) {
    console.error("Add collaborator error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to add collaborator"
    );
  }
}
