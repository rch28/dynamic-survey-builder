import { getServerSession } from "@/lib/auth/getServerSession";
import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is initialized
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
    // parse query params for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

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
        users (name, email)`
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
    const { data, error } = await query;

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
      return NextResponse.json(
        { error: "Failed to fetch logs" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("activity_logs")
      .select("id", { count: "exact" });

    if (countError) {
      console.error("Error counting logs:", countError);
    }

    return NextResponse.json({
      logs: logData || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: totalCount ? Math.ceil(totalCount / limit) : 1,
      },
    });
  } catch (error) {
    console.error("Admin logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
