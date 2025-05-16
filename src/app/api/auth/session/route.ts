import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
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
