import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { validateRequest, formatValidationErrors } from "@/lib/validation";
import { verifyPassword, checkRateLimit } from "@/lib/auth";
import { checkDatabaseConnection } from "@/lib/db";
import { loginSchema } from "@/lib/schemas/login-schema";

export async function POST(request: NextRequest) {
  try {
    logApiRequest("POST", "/api/auth/login");

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Check rate limit (5 attempts per minute)
    if (!checkRateLimit(`login:${ip}`, 5, 60 * 1000)) {
      return createErrorResponse(
        ErrorType.RATE_LIMITED,
        "Too many login attempts. Please try again later."
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = await validateRequest(loginSchema, body);

    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid login data",
        formatValidationErrors(validation.error)
      );
    }

    const { email, password } = validation.data;

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, email, password_hash, role, avatar_url")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return createErrorResponse(
        ErrorType.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    // Verify password
    const isPasswordValid = user.password_hash
      ? await verifyPassword(password, user.password_hash)
      : false;

    if (!isPasswordValid) {
      return createErrorResponse(
        ErrorType.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    // Update last login timestamp
    await supabaseAdmin
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    // Create user object for cookie (exclude sensitive data)
    const userForCookie = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url,
    };

    // Store user in a cookie
    const userCookie = JSON.stringify(userForCookie);
    const cookieStore = await cookies();
    cookieStore.set("user", userCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
    });

    return createSuccessResponse({
      success: true,
      user: userForCookie,
    });
  } catch (error) {
    console.error("Login error:", error);
    return createErrorResponse(ErrorType.INTERNAL_ERROR, "Login failed");
  }
}
