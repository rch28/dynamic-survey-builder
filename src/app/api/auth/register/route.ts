import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
// In a real app, you would use a database
// This is a simplified example using cookies for demo purposes
export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    //  check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const userId = uuidv4();

    // supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    console.log("Auth data:", authData);
    if (authError) {
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 500 }
      );
    }

    // Create a user object
    const user = { id: userId, name, email };
    const userCookie = JSON.stringify(user);
    const response = NextResponse.json(
      { success: true, user },
      { status: 201 }
    );
    response.cookies.set("user", userCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
