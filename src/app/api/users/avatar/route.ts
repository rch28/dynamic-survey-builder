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
      .from("user-avatars")
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

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("user-avatars")
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update the user's avatar_url in the database
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Failed to update avatar URL" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      action: "update_avatar",
      resource_type: "user",
      resource_id: user.id,
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
