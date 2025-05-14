import { getServerSession } from "@/lib/auth/getServerSession";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    // Fetch activity logs
    const { data: activities, error } = await supabaseAdmin
      .from("activity_logs")
      .select(
        `
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at,
        users:user_id (
          name,
          email
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity logs" },
        { status: 500 }
      );
    }

    // Transform the data to match our types
    const formattedActivities = activities.map((a) => ({
      id: a.id,
      userId: a.user_id,
      action: a.action,
      resourceType: a.resource_type,
      resourceId: a.resource_id,
      details: a.details,
      createdAt: a.created_at,
      user: a.users,
    }));

    return NextResponse.json(
      { activities: formattedActivities },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get activity logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
