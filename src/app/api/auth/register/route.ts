import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { validateRequest, formatValidationErrors } from "@/lib/validation";
import { hashPassword, checkRateLimit } from "@/lib/auth";
import { checkDatabaseConnection } from "@/lib/db";
import { registerSchema } from "@/lib/schemas/register-schema";

export async function POST(request: NextRequest) {
  try {
    logApiRequest("POST", "/api/auth/register");

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Check rate limit (3 registrations per hour)
    if (!checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return createErrorResponse(
        ErrorType.RATE_LIMITED,
        "Too many registration attempts. Please try again later."
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = await validateRequest(registerSchema, body);

    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid registration data",
        formatValidationErrors(validation.error)
      );
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "User with this email already exists"
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a new user
    const userId = uuidv4();

    // Insert the user into Supabase
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        name,
        email,
        password_hash: hashedPassword,
        role: "user",
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      })
      .select("id, name, email, role, avatar_url")
      .single();

    if (insertError || !newUser) {
      console.error("Error creating user:", insertError);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Registration failed"
      );
    }

    // Create user object for cookie
    const userForCookie = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatarUrl: newUser.avatar_url,
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

    return createSuccessResponse(
      {
        success: true,
        user: userForCookie,
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return createErrorResponse(ErrorType.INTERNAL_ERROR, "Registration failed");
  }
}
