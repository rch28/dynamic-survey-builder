import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/getServerSession";
import { isAdmin, requireAdmin } from "@/lib/auth";
import { checkDatabaseConnection } from "@/lib/db";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    // Check admin privileges
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.error;

    const user = adminResult.user;
    logApiRequest("GET", "/api/admin/visitors", user.id);

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    // Parse query parameters
    const searchParams = new URL(request.url).searchParams;
    const period = searchParams.get("period") || "7days"; // 24h, 7days, 30days, custom
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Determine time range based on period
    let timeRange;
    const now = new Date();

    if (period === "24h") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      timeRange = yesterday.toISOString();
    } else if (period === "7days") {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      timeRange = lastWeek.toISOString();
    } else if (period === "30days") {
      const lastMonth = new Date(now);
      lastMonth.setDate(lastMonth.getDate() - 30);
      timeRange = lastMonth.toISOString();
    } else if (period === "custom" && startDate) {
      timeRange = startDate;
    } else {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      timeRange = lastWeek.toISOString();
    }

    // Use Promise.all to run queries in parallel
    const [visitorResult, deviceResult, referrerResult] = await Promise.all([
      // Get visitor stats
      supabaseAdmin
        .from("visitors")
        .select("*")
        .gte("visit_date", timeRange)
        .lte("visit_date", endDate || now.toISOString())
        .order("visit_date", { ascending: true }),

      // Get device stats
      supabaseAdmin.rpc("_exec_sql", {
        query: `
              SELECT device_type, COUNT(*) as count
              FROM visitors
              WHERE visit_date >= '${timeRange}' AND visit_date <= '${
          endDate || now.toISOString()
        }'
              GROUP BY device_type
              ORDER BY count DESC
          `,
      }),

      // Get referrer stats
      supabaseAdmin.rpc("_exec_sql", {
        query: `
        SELECT referrer, COUNT(*) as count
        FROM visitors
        WHERE visit_date >= '${timeRange}' AND visit_date <= '${
          endDate || now.toISOString()
        }'
        AND referrer IS NOT NULL
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
    `,
      }),
    ]);

    // Handle errors
    if (visitorResult.error) {
      console.error("Error fetching visitor stats:", visitorResult.error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to fetch visitor stats"
      );
    }

    return createSuccessResponse({
      visitors: visitorResult.data || [],
      devices: deviceResult.data || [],
      referrers: referrerResult.data || [],
    });
  } catch (error) {
    console.error("Error in visitors API:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to fetch visitor data"
    );
  }
}
