import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/getServerSession";

export async function GET() {
  try {
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: profile, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, avatar_url, role, created_at, last_login")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Transform the data to match our types
    const formattedProfile = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      createdAt: profile.created_at,
      lastLogin: profile.last_login,
    };

    return NextResponse.json({ user: formattedProfile }, { status: 200 });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    const { name, avatarUrl } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    // 1. Update auth user metadata
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          name,
          avatar_url: avatarUrl || user.user_metadata?.avatar_url || "",
        },
      }
    );
    // Check if user exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingUser) {
      // Create user record if it doesn't exist
      await supabaseAdmin.from("users").insert({
        id: user.id,
        name: name,
        email: user.email || "",
        avatar_url: avatarUrl || user.user_metadata?.avatar_url || "",
      });
    } else {
      // Update existing user
      await supabaseAdmin
        .from("users")
        .update({
          name: name,
          avatar_url: avatarUrl || user.user_metadata?.avatar_url || "",
        })
        .eq("id", user.id);
    }

    // 2. Update your custom users table
    const updateData = { name };

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select("id, name, email, avatar_url")
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      action: "update_profile",
      resource_type: "user",
      resource_id: user.id,
      details: {
        updated_fields: avatarUrl ? ["name", "avatar_url"] : ["name"],
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
