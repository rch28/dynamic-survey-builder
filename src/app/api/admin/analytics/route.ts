import { NextRequest } from "next/server";
import { Survey } from "@/types/survey";
import { requireAdmin } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { checkDatabaseConnection } from "@/lib/db";

interface PopularSurvey {
  survey_id: string;
  count: number;
}

interface SurveyDetail {
  id: string;
  title: string;
  user_id: string;
  users: {
    name: string;
  };
}

interface PopularSurveyWithDetails extends SurveyDetail {
  responses: number;
}

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.error;

    const user = adminResult.user;
    logApiRequest("GET", "/api/admin/analytics", user.id);

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    // Parse query parameters
    const { searchParams } = new URL(request.url);
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
    const [
      surveyCreationResult,
      responseResult,
      popularSurveysResult,
      countResults,
    ] = await Promise.all([
      // Get surveys created over time
      supabaseAdmin
        .from("surveys")
        .select("created_at")
        .gte("created_at", timeRange)
        .lte("created_at", endDate || now.toISOString())
        .order("created_at", { ascending: true }),

      // Get responses over time
      supabaseAdmin
        .from("responses")
        .select("created_at")
        .gte("created_at", timeRange)
        .lte("created_at", endDate || now.toISOString())
        .order("created_at", { ascending: true }),

      // Get most popular surveys
      supabaseAdmin.rpc("get_popular_surveys", {
        start_time: timeRange,
        end_time: endDate || now.toISOString(),
      }),

      // Get total counts
      Promise.all([
        supabaseAdmin.from("surveys").select("id", { count: "exact" }),
        supabaseAdmin.from("responses").select("id", { count: "exact" }),
        supabaseAdmin.from("users").select("id", { count: "exact" }),
      ]),
    ]);

    // Handle errors
    if (surveyCreationResult.error) {
      console.error(
        "Error fetching survey creation data:",
        surveyCreationResult.error
      );
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to fetch survey analytics"
      );
    }

    // If we have popular surveys, get their details
    let popularSurveysWithDetails: PopularSurveyWithDetails[] = [];
    if (popularSurveysResult?.data?.length) {
      const surveyIds = popularSurveysResult?.data.map(
        (s: PopularSurvey) => s.survey_id
      );

      const { data: surveyDetails, error: detailsError } = await supabaseAdmin
        .from("surveys")
        .select("id, title, user_id, users (name)")
        .in("id", surveyIds);

      if (!detailsError && surveyDetails) {
        // Merge survey details with response counts
        popularSurveysWithDetails = surveyDetails
          .map((survey) => {
            const responses =
              popularSurveysResult?.data.find(
                (s: PopularSurvey) => s.survey_id === survey.id
              )?.count || 0;
            return {
              ...survey,
              responses,
              users: Array.isArray(survey.users)
                ? survey.users[0]
                : survey.users,
            };
          })
          .sort((a, b) => b.responses - a.responses);
      }
    }

    // Process survey creation data by day for charting
    const surveyCreationByDay = processDataByDay(
      surveyCreationResult.data || []
    );

    // Process response data by day for charting
    const responsesByDay = processDataByDay(responseResult.data || []);
    const { data: surveyCategories } = await supabaseAdmin
      .from("surveys")
      .select("metadata")
      .gte("created_at", timeRange)
      .lte("created_at", endDate || now.toISOString());

    const categoryData = processCategoryData(surveyCategories || []);
    // Process response data by day for charting

    return createSuccessResponse({
      surveyCreation: surveyCreationByDay,
      responses: responsesByDay,
      popularSurveys: popularSurveysWithDetails,
      surveyCategories: categoryData,
      totals: {
        surveys: countResults[0].count || 0,
        responses: countResults[1].count || 0,
        users: countResults[2].count || 0,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/analytics:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to fetch analytics data"
    );
  }
}

// Helper function to process time-series data
function processDataByDay(data: { created_at: string }[]) {
  const groupedByDay: Record<string, number> = {};

  data.forEach((item) => {
    const date = new Date(item.created_at);
    const day = date.toISOString().split("T")[0];

    if (!groupedByDay[day]) {
      groupedByDay[day] = 0;
    }

    groupedByDay[day]++;
  });

  // Convert to array format for charts
  return Object.keys(groupedByDay)
    .sort()
    .map((day) => ({
      date: day,
      count: groupedByDay[day],
    }));
}

function processCategoryData(surveys: Pick<Survey, "metadata">[]) {
  const categories: Record<string, number> = {};

  surveys.forEach((survey) => {
    let category = survey.metadata?.category || "Uncategorized";
    if (typeof category !== "string" || !category.trim()) {
      category = "Uncategorized";
    }

    if (!categories[category]) {
      categories[category] = 0;
    }

    categories[category]++;
  });

  return Object.keys(categories).map((category) => ({
    category,
    count: categories[category],
  }));
}
