import { checkDatabaseConnection, logActivity } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";

// Maximum file size (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export async function POST(request: Request) {
  try {
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;
    const user = authResult.user;
    logApiRequest("POST", "/api/users/avatar", user.id);

    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return createErrorResponse(ErrorType.BAD_REQUEST, "No file provided");
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        `File size exceeds the maximum limit of ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB`
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
      );
    }
    // Get the current avatar URL to delete later
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("id,avatar_url")
      .eq("id", user.id)
      .single();

    // Upload the file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to upload avatar",
        uploadError
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
          name: user.name,
        },
      }
    );
    if (authError) {
      console.error("Auth error:", authError);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to update user metadata",
        authError
      );
    }
    if (currentUser?.avatar_url) {
      try {
        const oldPath = currentUser.avatar_url.split("/").pop();
        if (oldPath) {
          await supabaseAdmin.storage
            .from("avatars")
            .remove([`avatars/${oldPath}`]);
        }
      } catch (deleteError) {
        console.error("Error deleting old avatar:", deleteError);
      }
    }

    if (!currentUser) {
      // Create user record if it doesn't exist
      await supabaseAdmin.from("users").insert({
        id: user.id,
        name: user.name || "",
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
    await logActivity(user.id, "UPDATED_AVATAR", "user", user.id, {
      updated_fields: ["avatar_url"],
    });

    return createSuccessResponse({
      avatarUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to upload avatar",
      error
    );
  }
}
