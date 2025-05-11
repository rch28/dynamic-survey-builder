import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase";

import { getServerSession } from "@/lib/auth/getServerSession";

export async function GET() {
  try {
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    const { data: surveys, error } = await supabaseAdmin
      .from("surveys")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch surveys" },
        { status: 500 }
      );
    }

    return NextResponse.json({ surveys: surveys || [] }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/surveys:", error);
    return NextResponse.json(
      { error: "Failed to fetch surveys" },
      { status: 500 }
    );
  }
}
// POST /api/surveys
export async function POST(request: Request) {
  try {
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const surveyData = await request.json();
    if (!surveyData.title || !surveyData.questions) {
      return NextResponse.json(
        { error: "Title and questions are required" },
        { status: 400 }
      );
    }

    const newSurvey = {
      id: uuidv4(),
      user_id: user.id,
      title: surveyData.title,
      questions: surveyData.questions,
      description: surveyData.description || "",
      metadata: surveyData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin
      .from("surveys")
      .insert(newSurvey)
      .select()
      .single();
    if (error) {
      return NextResponse.json(
        { error: "Failed to create survey", details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ survey: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/surveys:", error);
    return NextResponse.json(
      { error: "Failed to create survey" },
      { status: 500 }
    );
  }
}
