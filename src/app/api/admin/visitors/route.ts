import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin } from "../logs/route";
import { getServerSession } from "@/lib/auth/getServerSession";

export async function GET(request: Request) {
  try {
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
      "execute_sql",
      {
        sql: `
            SELECT device_type, COUNT(*) as count
            FROM visitors
            WHERE visit_date >= $1 AND visit_date <= $2
            GROUP BY device_type
            ORDER BY count DESC
        `,
        args: [timeRange, endDate || now.toISOString()],
      }
    );

    if (deviceError) {
      console.error("Error fetching device stats:", deviceError);
    }

    // Get referrer stats
    const { data: referrerData, error: referrerError } =
      await supabaseAdmin.rpc("execute_sql", {
        sql: `
            SELECT referrer, COUNT(*) as count
            FROM visitors
            WHERE visit_date >= $1 AND visit_date <= $2
            AND referrer IS NOT NULL
            GROUP BY referrer
            ORDER BY count DESC
            LIMIT 10
        `,
        args: [timeRange, endDate || now.toISOString()],
      });

    if (referrerError) {
      console.error("Error fetching referrer stats:", referrerError);
    }

    return NextResponse.json({
      visitors: visitorData || [],
      devices: deviceData || [],
      referrers: referrerData || [],
    });
  } catch (error) {
    console.error("Error in visitors API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
