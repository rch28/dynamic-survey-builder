import { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth";

// Simple in-memory cache for admin status
const adminCache: Record<string, { isAdmin: boolean; expires: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export async function GET(request: NextRequest) {
  try {
    logApiRequest("GET", "/api/admin/check");
    const adminResult = await requireAdmin(request);

    // If successful, user is an admin
    if (adminResult.success) {
      // Cache the result
      adminCache[adminResult.user.id] = {
        isAdmin: true,
        expires: Date.now() + CACHE_TTL,
      };

      return createSuccessResponse({ isAdmin: true });
    }
  } catch (error) {
    console.error("Admin check error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to check admin status"
    );
  }
}
