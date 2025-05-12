import { getServerSession } from "@/lib/auth/getServerSession";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function isAdmin() {
  const user = await getServerSession();
  if (!user) {
    return false;
  }
  if (user.user_metadata.role !== "admin") {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
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

    // Build the query
    let query = supabaseAdmin
      .from("activity_logs")
      .select(
        `id,
        user_id,
        activity_type,
        details,
        created_at,
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
    // Execute query
    const { data, error, count } = await query;

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
      logs: data,
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
