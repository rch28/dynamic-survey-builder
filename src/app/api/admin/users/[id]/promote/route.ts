import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { checkDatabaseConnection } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const checkDb = checkDatabaseConnection();
    if (!checkDb.success) return checkDb.error;
    const supabaseAdmin = checkDb.client;

    // Verify admin status
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, role")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't promote if already admin
    if (user.role === "admin") {
      return NextResponse.json({ message: "User is already an admin" });
    }

    // Update the user's role to admin
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ role: "admin" })
      .eq("id", id);

    if (updateError) {
      console.error("Error promoting user:", updateError);
      return NextResponse.json(
        { error: "Failed to promote user" },
        { status: 500 }
      );
    }

    // Log the promotion
    await supabaseAdmin.from("activity_logs").insert({
      user_id: id,
      activity_type: "USER_PROMOTED",
      details: `Promoted user ${user.email} to admin`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "User promoted to admin successfully",
    });
  } catch (error) {
    console.error("Error in promote user API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
