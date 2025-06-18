import { requireAdmin } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import {
  formatValidationErrors,
  updateUserSchema,
  uuidSchema,
  validateRequest,
} from "@/lib/validation";
import { checkDatabaseConnection, logActivity } from "@/lib/db";

// GET - Get a specific user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.error;

    const user = adminResult.user;
    logApiRequest("GET", `/api/admin/users/${id}`, user.id);

    // Validate ID format
    try {
      uuidSchema.parse(id);
    } catch (error) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "Invalid user ID format",
        error
      );
    }

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    // Get user
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, created_at, last_login")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return createErrorResponse(ErrorType.NOT_FOUND, "User not found");
    }

    return createSuccessResponse({ user: data });
  } catch (error) {
    console.error("Error in get user API:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to fetch user"
    );
  }
}

// PATCH - Update a user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check admin privileges
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.error;

    const user = adminResult.user;
    logApiRequest("PATCH", `/api/admin/users/${id}`, user.id);

    // Validate ID format
    try {
      uuidSchema.parse(id);
    } catch (error) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "Invalid user ID format",
        error
      );
    }

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    // Parse and validate request body
    const body = await request.json();
    const validation = await validateRequest(updateUserSchema, body);

    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid user data",
        formatValidationErrors(validation.error)
      );
    }

    const updates = validation.data;

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingUser) {
      return createErrorResponse(ErrorType.NOT_FOUND, "User not found");
    }

    // Update user
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, role, created_at, last_login, avatar_url")
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to update user"
      );
    }

    // Log activity
    await logActivity(user.id, "UPDATE_USER", "user", id, {
      updated_fields: Object.keys(updates),
    });

    return createSuccessResponse({ user: data });
  } catch (error) {
    console.error("Error in update user API:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to update user"
    );
  }
}

// DELETE - Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check admin privileges
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.error;

    const user = adminResult.user;
    logApiRequest("DELETE", `/api/admin/users/${id}`, user.id);

    // Validate ID format
    try {
      uuidSchema.parse(id);
    } catch (error) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "Invalid user ID format",
        error
      );
    }

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    // Check if user is trying to delete themselves
    if (id === user.id) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "You cannot delete your own account"
      );
    }

    // Check if user exists and get email for logging
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("id", id)
      .single();

    if (checkError || !existingUser) {
      return createErrorResponse(ErrorType.NOT_FOUND, "User not found");
    }

    // Delete user with transaction
    const { error } = await supabaseAdmin.from("users").delete().eq("id", id);

    if (error) {
      console.error("Error deleting user:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to delete user"
      );
    }

    // Log activity
    await logActivity(user.id, "DELETE_USER", "user", id, {
      email: existingUser.email,
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error("Error in delete user API:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to delete user"
    );
  }
}
