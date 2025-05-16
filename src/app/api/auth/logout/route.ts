import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    logApiRequest("POST", "/api/auth/logout");

    // Get current user for logging
    const user = await getCurrentUser();

    // Delete the user cookie
    const cookieStore = await cookies();
    cookieStore.delete("user");

    // Log the logout if user was authenticated
    if (user) {
      await logActivity(user.id, "LOGOUT", "session", user.id, {
        email: user.email,
      });
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return createErrorResponse(ErrorType.INTERNAL_ERROR, "Logout failed");
  }
}
