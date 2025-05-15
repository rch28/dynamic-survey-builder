import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";
import { createErrorResponse, ErrorType } from "./api-utils";
import { User } from "@/types";
import { getServerSession } from "./auth/getServerSession";

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify a password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Get the current user from cookies
export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await getServerSession();
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      name: user.user_metadata.name,
      email: user.user_metadata.email,
      role: user.user_metadata.role,
      avatar_url: user.user_metadata.avatar_url,
      created_at: user.user_metadata.created_at,
      updated_at: user.user_metadata.updated_at,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Check if a user is authenticated
export async function requireAuth(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: createErrorResponse(
        ErrorType.UNAUTHORIZED,
        "Authentication required"
      ),
    };
  }

  return { success: true, user };
}

// Check if a user is an admin
export async function isAdmin() {
  const user = await getServerSession();
  if (!user) {
    return false;
  }
  if (user.user_metadata.role !== "admin") {
    return false;
  }
  return true;
}

// Require admin privileges
export async function requireAdmin(request: Request) {
  const authResult = await requireAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  const isUserAdmin = await isAdmin();

  if (!isUserAdmin) {
    return {
      success: false,
      error: createErrorResponse(
        ErrorType.FORBIDDEN,
        "Admin privileges required"
      ),
    };
  }

  return { success: true, user: authResult.user };
}

// Rate limiting implementation
const rateLimits: Record<string, { count: number; resetTime: number }> = {};

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  // Clean up expired entries
  Object.keys(rateLimits).forEach((k) => {
    if (rateLimits[k].resetTime < now) {
      delete rateLimits[k];
    }
  });

  // Initialize or get current limit data
  if (!rateLimits[key] || rateLimits[key].resetTime < now) {
    rateLimits[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return true;
  }

  // Increment count and check limit
  rateLimits[key].count++;

  if (rateLimits[key].count > limit) {
    return false;
  }

  return true;
}
