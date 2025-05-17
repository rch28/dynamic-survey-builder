import { requireAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import {
  dateRangeSchema,
  formatValidationErrors,
  paginationSchema,
  validateRequest,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const checkDb = checkDatabaseConnection();
    if (!checkDb.success) return checkDb.error;
    const supabaseAdmin = checkDb.client;

    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest("GET", "/api/admin/logs", user.id);
    // parse query params for pagination and filtering
    const searchParams = new URL(request.url).searchParams;

    const validatedParams = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const { page, limit } = validatedParams;

    // Validate date range parameters
    const dateRangeValidation = await validateRequest(dateRangeSchema, {
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    if (!dateRangeValidation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid date range parameters",
        formatValidationErrors(dateRangeValidation.error)
      );
    }

    const { startDate, endDate } = dateRangeValidation.data;
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabaseAdmin
      .from("activity_logs")
      .select(
        `id,
        user_id,
        action,
        activity_type,
        details,
        created_at,
        ip_address,
        users (name, email)`,
        {
          count: "exact",
        }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
    if (type) {
      query = query.eq("activity_type", type);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (action) {
      query = query.eq("action", action);
    }
    // Execute query
    const { data, error, count } = await query;

    const logData = data?.map((log) => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      activityType: log.activity_type,
      details: log.details,
      createdAt: log.created_at,
      ipAddress: log.ip_address,
      user: log.users,
    }));
    if (error) {
      console.error("Error fetching logs:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to fetch logs",
        error.message
      );
    }

    return createSuccessResponse({
      logs: logData || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 1,
      },
    });
  } catch (error) {
    console.error("Admin logs error:", error);
    return createErrorResponse(ErrorType.INTERNAL_ERROR, "Admin log Error");
  }
}
