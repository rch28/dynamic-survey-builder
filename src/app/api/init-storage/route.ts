import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // Create avatars bucket if it doesn't exist
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const avatarsBucketExists = buckets?.some(
      (bucket) => bucket.name === "avatars"
    );

    if (!avatarsBucketExists) {
      const { data, error } = await supabaseAdmin.storage.createBucket(
        "avatars",
        {
          public: true, // Make files publicly accessible
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
          ],
          fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
        }
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json(
      { message: "Storage initialized" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Storage initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize storage" },
      { status: 500 }
    );
  }
}
