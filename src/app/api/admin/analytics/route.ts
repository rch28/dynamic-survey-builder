import { getServerSession } from "@/lib/auth/getServerSession";
import { NextResponse } from "next/server";
import { Survey } from "@/types/survey";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/utils/supabase/server";

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

export async function GET(request: Request) {
  try {
    const supabaseAdmin = await createClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // check if user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

    // Get surveys created over time
    const { data: surveyCreationData, error: surveyCreationError } =
      await supabaseAdmin
        .from("surveys")
        .select("created_at")
        .gte("created_at", timeRange)
        .lte("created_at", endDate || now.toISOString())
        .order("created_at", { ascending: true });

    if (surveyCreationError) {
      console.error(
        "Error fetching survey creation data:",
        surveyCreationError
      );
      return NextResponse.json(
        { error: "Failed to fetch survey analytics" },
        { status: 500 }
      );
    }

    // Get responses over time
    const { data: responseData, error: responseError } = await supabaseAdmin
      .from("responses")
      .select("created_at")
      .gte("created_at", timeRange)
      .lte("created_at", endDate || now.toISOString())
      .order("created_at", { ascending: true });

    if (responseError) {
      console.error("Error fetching response data:", responseError);
    }

    // Get most popular surveys
    const { data: popularSurveys, error: popularSurveysError } =
      await supabaseAdmin.rpc("get_popular_surveys", {
        start_time: timeRange,
        end_time: endDate || now.toISOString(),
      });

    if (popularSurveysError) {
      console.error("Error fetching popular surveys:", popularSurveysError);
    }

    // If we have popular surveys, get their details
    let popularSurveysWithDetails: PopularSurveyWithDetails[] = [];
    if (popularSurveys?.length) {
      const surveyIds = popularSurveys.map((s: PopularSurvey) => s.survey_id);

      const { data: surveyDetails, error: detailsError } = await supabaseAdmin
        .from("surveys")
        .select("id, title, user_id, users (name)")
        .in("id", surveyIds);

      if (detailsError) {
        console.error("Error fetching survey details:", detailsError);
      } else if (surveyDetails) {
        // Merge survey details with response counts
        popularSurveysWithDetails = surveyDetails
          .map((survey) => {
            const responses =
              popularSurveys.find(
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

    // Get total counts
    const [surveyCount, responseCount, userCount] = await Promise.all([
      supabaseAdmin.from("surveys").select("id", { count: "exact" }),
      supabaseAdmin.from("responses").select("id", { count: "exact" }),
      supabaseAdmin.from("users").select("id", { count: "exact" }),
    ]);

    // Process survey creation data by day for charting
    const surveyCreationByDay = processDataByDay(surveyCreationData || []);

    const { data: surveyCategories } = await supabaseAdmin
      .from("surveys")
      .select("metadata")
      .gte("created_at", timeRange)
      .lte("created_at", endDate || now.toISOString());

    const categoryData = processCategoryData(surveyCategories || []);
    // Process response data by day for charting
    const responsesByDay = processDataByDay(responseData || []);
    return NextResponse.json({
      surveyCreation: surveyCreationByDay,
      responsesPerDay: responsesByDay,
      popularSurveys: popularSurveysWithDetails,
      totals: {
        surveys: surveyCount.count || 0,
        responses: responseCount.count || 0,
        users: userCount.count || 0,
      },
      surveysByCategory: categoryData,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
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
