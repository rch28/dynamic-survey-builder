import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/getServerSession";
import { isAdmin } from "@/lib/auth";

// GET - List users with pagination and search
export async function GET(request: Request) {
  try {
    // Check if Supabase is initialized
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin status
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters for pagination and search
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    // Calculate offset
    const offset = (page - 1) * limit;

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
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 1,
      },
    });
  } catch (error) {
    console.error("Error in users API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: Request) {
  try {
    // Check if Supabase is initialized
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin status
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const { name, email, password, role } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create user
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        email,
        password: password, // Note: In a real app, you would hash the password
        role: role || "user",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Log activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      activity_type: "USER_CREATED",
      details: `Created user: ${email}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ user: data[0] }, { status: 201 });
  } catch (error) {
    console.error("Error in create user API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
