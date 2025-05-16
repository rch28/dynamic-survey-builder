import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    logApiRequest("GET", "/api/auth/session");

    const user = await getCurrentUser();

    return createSuccessResponse({ user });
  } catch (error) {
    console.error("Session error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to get session"
    );
  }
}
