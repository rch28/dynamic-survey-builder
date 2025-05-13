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
    if (authError) {
      console.error("Auth update error:", authError);
      return NextResponse.json(
        { error: "Failed to update authentication profile" },
        { status: 500 }
      );
    }
    let userData;

    // Check if user exists by EITHER id OR email
    const { data: existingUserById } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("id", user.id)
      .maybeSingle();

    // If no user found by ID, check by email
    if (!existingUserById && user.email) {
      const { data: existingUserByEmail } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("email", user.email)
        .maybeSingle();

      if (existingUserByEmail) {
        // User exists with this email but different ID
        // Update the existing record to match the current auth user's ID
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from("users")
          .update({
            id: user.id, // Update to current auth ID
            name: name,
            avatar_url: avatarUrl || user.user_metadata?.avatar_url || "",
          })
          .eq("email", user.email)
          .select("id, name, email, avatar_url")
          .single();

        if (updateError) {
          console.error("Database update error:", updateError);
          return NextResponse.json(
            { error: "Failed to update user profile" },
            { status: 500 }
          );
        }

        userData = updatedUser;
      } else {
        // No user exists with this ID or email, create a new one
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from("users")
          .insert({
            id: user.id,
            name: name,
            email: user.email || "",
            avatar_url: avatarUrl || user.user_metadata?.avatar_url || "",
            updated_at: new Date().toISOString(),
          })
          .select("id, name, email, avatar_url")
          .single();

        if (insertError) {
          console.error("Database insert error:", insertError);
          return NextResponse.json(
            { error: "Failed to create user profile" },
            { status: 500 }
          );
        }

        userData = newUser;
      }
    } else {
      // User exists by ID, update it
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          name: name,
          avatar_url: avatarUrl || user.user_metadata?.avatar_url || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id, name, email, avatar_url")
        .maybeSingle();

      if (updateError) {
        console.error("Database update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update user profile" },
          { status: 500 }
        );
      }

      userData = updatedUser;
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

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
