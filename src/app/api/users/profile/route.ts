import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { checkDatabaseConnection, logActivity } from "@/lib/db";
import {
  formatValidationErrors,
  updateProfileSchema,
  validateRequest,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest("GET", "/api/users/profile", user.id);
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;

    // Fetch user profile
    const { data: profile, error } = await dbCheck.client
      .from("users")
      .select("id, name, email, avatar_url, role, created_at, last_login")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to fetch user profile",
        error
      );
    }

    // Transform the data to match our types
    const formattedProfile = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      createdAt: profile.created_at,
      lastLogin: profile.last_login,
    };

    return createSuccessResponse({ user: formattedProfile });
  } catch (error) {
    console.error("Get user profile error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to fetch user profile",
      error
    );
  }
}

export async function PUT(request: Request) {
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest("PUT", "/api/users/profile", user.id);
    const body = await request.json();
    const validation = await validateRequest(updateProfileSchema, body);
    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid profile data",
        formatValidationErrors(validation.error)
      );
    }
    const { name } = validation.data;

    // 1. Update auth user metadata
    const { error: authError } = await dbCheck.client.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          name,
        },
      }
    );
    if (authError) {
      console.error("Database Error:", authError);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to update authentication profile",
        authError
      );
    }
    let userData;

    // Check if user exists by EITHER id OR email
    const { data: existingUserById } = await dbCheck.client
      .from("users")
      .select("id, email")
      .eq("id", user.id)
      .maybeSingle();

    // If no user found by ID, check by email
    if (!existingUserById && user.email) {
      const { data: existingUserByEmail } = await dbCheck.client
        .from("users")
        .select("id, email")
        .eq("email", user.email)
        .maybeSingle();

      if (existingUserByEmail) {
        const { data: updatedUser, error: updateError } = await dbCheck.client
          .from("users")
          .update({
            id: user.id, // Update to current auth ID
            name: name,
          })
          .eq("email", user.email)
          .select("id, name, email, avatar_url")
          .single();

        if (updateError) {
          console.error("Database update error:", updateError);
          return createErrorResponse(
            ErrorType.INTERNAL_ERROR,
            "Failed to update user profile",
            updateError
          );
        }

        userData = updatedUser;
      } else {
        // No user exists with this ID or email, create a new one
        const { data: newUser, error: insertError } = await dbCheck.client
          .from("users")
          .insert({
            id: user.id,
            name: name,
            email: user.email || "",

            updated_at: new Date().toISOString(),
          })
          .select("id, name, email, avatar_url")
          .single();

        if (insertError) {
          console.error("Database insert error:", insertError);
          return createErrorResponse(
            ErrorType.INTERNAL_ERROR,
            "Failed to create user profile",
            insertError
          );
        }

        userData = newUser;
      }
    } else {
      // User exists by ID, update it
      const { data: updatedUser, error: updateError } = await dbCheck.client
        .from("users")
        .update({
          name: name,

          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id, name, email, avatar_url")
        .maybeSingle();

      if (updateError) {
        console.error("Database update error:", updateError);
        return createErrorResponse(
          ErrorType.INTERNAL_ERROR,
          "Failed to update user profile",
          updateError
        );
      }

      userData = updatedUser;
    }

    await logActivity(user.id, "UPDATE_PROFILE", "user", user.id, {
      updated_fields: ["name"],
    });

    return createSuccessResponse({ user: userData });
  } catch (error) {
    console.error("Update user profile error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to update user profile",
      error
    );
  }
}
