import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/getServerSession";
import { isAdmin } from "@/lib/auth/isAdmin";

export async function GET(request: Request) {
  try {
    // Check if Supabase is initialized
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
    // Get the current user from cookies
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin status
    const adminCheck = await isAdmin();
    if (!adminCheck) {
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

    // Get visitor stats
    const { data: visitorData, error: visitorError } = await supabaseAdmin
      .from("visitors")
      .select("*")
      .gte("visit_date", timeRange)
      .lte("visit_date", endDate || now.toISOString())
      .order("visit_date", { ascending: true });

    if (visitorError) {
      console.error("Error fetching visitor stats:", visitorError);
      return NextResponse.json(
        { error: "Failed to fetch visitor stats" },
        { status: 500 }
      );
    }

    // Get device stats
    const { data: deviceData, error: deviceError } = await supabaseAdmin.rpc(
      "_exec_sql",
      {
        query: `
            SELECT device_type, COUNT(*) as count
            FROM visitors
            WHERE visit_date >= '${timeRange}' AND visit_date <= '${
          endDate || now.toISOString()
        }'
            GROUP BY device_type
            ORDER BY count DESC
        `,
      }
    );

    if (deviceError) {
      console.error("Error fetching device stats:", deviceError);
    }

    // Get referrer stats
    const { data: referrerData, error: referrerError } =
      await supabaseAdmin.rpc("_exec_sql", {
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
      });

    if (referrerError) {
      console.error("Error fetching referrer stats:", referrerError);
    }

    return NextResponse.json({
      visitorsByDay: visitorData || [],
      visitorsByDevice: deviceData || [],
      visitorsByReferrer: referrerData || [],
    });
  } catch (error) {
    console.error("Error in visitors API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
