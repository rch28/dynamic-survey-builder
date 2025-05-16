import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import {
  validateRequest,
  createUserSchema,
  paginationSchema,
  formatValidationErrors,
} from "@/lib/validation";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { checkDatabaseConnection, logActivity } from "@/lib/db";

// GET - List users with pagination and search
export async function GET(request: NextRequest) {
  try {
    // Check admin privileges
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.error;

    const user = adminResult.user;
    logApiRequest("GET", "/api/admin/users", user.id);

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;

    // Parse query parameters
    const searchParams = new URL(request.url).searchParams;

    const validatedParams = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    });
    const { page, limit } = validatedParams;
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // Calculate offset

    // Build query
    let query = supabaseAdmin
      .from("users")
      .select("id, name, email, role, created_at, last_login", {
        count: "exact",
      });

    // Apply search if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to fetch users"
      );
    }

    return createSuccessResponse({
      users: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 1,
      },
    });
  } catch (error) {
    console.error("Error in users API:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to fetch users"
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Check admin privileges
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.error;

    const user = adminResult.user;
    logApiRequest("POST", "/api/admin/users", user.id);

    // Check database connection
    const dbCheck = checkDatabaseConnection();
    if (!dbCheck.success) return dbCheck.error;
    const supabaseAdmin = dbCheck.client;
    // Parse and validate request body
    const body = await request.json();
    const validation = await validateRequest(createUserSchema, body);

    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid user data",
        formatValidationErrors(validation.error)
      );
    }

    const { name, email, password, role } = validation.data;

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to create user"
      );
    }

    if (existingUser) {
      return createErrorResponse(
        ErrorType.BAD_REQUEST,
        "A user with this email already exists"
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user with transaction
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        email,
        password_hash: hashedPassword,
        role: role || "user",
        created_at: new Date().toISOString(),
      })
      .select("id, name, email, role, created_at")
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        "Failed to create user"
      );
    }

    // Log activity
    await logActivity(user.id, "CREATE_USER", "user", data.id, { email, role });

    return createSuccessResponse({ user: data }, 201);
  } catch (error) {
    console.error("Error in create user API:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to create user"
    );
  }
}
