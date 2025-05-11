import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/getServerSession";

export async function POST(request: Request) {
  try {
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload the file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload avatar" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update auth user metadata
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          avatar_url: avatarUrl,
          name: user.user_metadata?.name || "",
        },
      }
    );
    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: 500 }
      );
    }
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
        name: user.user_metadata?.name || "",
        email: user.email || "",
        avatar_url: avatarUrl,
      });
    } else {
      // Update existing user
      await supabaseAdmin
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      action: "update_avatar",
      resource_type: "user",
      resource_id: user.id,
      details: { updated_fields: ["avatar_url"] },
    });

    return NextResponse.json({ avatarUrl }, { status: 200 });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
