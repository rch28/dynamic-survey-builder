import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";

// Common function to get authenticated user ID to avoid repetition
async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createClient(); // Create client specific to this request context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return null;
    }
    return user.id;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}
function getSurveyIdFromUrl(request: NextRequest): string | null {
  const pathSegments = request.nextUrl.pathname.split("/");
  return pathSegments[pathSegments.length - 1] || null;
}
export async function GET(request: NextRequest) {
  try {
    // Extract the id from params immediately
    const surveyId = getSurveyIdFromUrl(request);
    if (!surveyId) {
      return NextResponse.json({ error: "Survey ID missing" }, { status: 400 });
    }

    //  check if user already exists
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    // Fetch survey from Supabase
    const { data: survey, error } = await supabaseAdmin
      .from("surveys")
      .select("*")
      .eq("id", surveyId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    return NextResponse.json({ survey }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/surveys:", error);
    return NextResponse.json(
      { error: "Failed to fetch survey" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const surveyId = getSurveyIdFromUrl(request);
    if (!surveyId) {
      return NextResponse.json({ error: "Survey ID missing" }, { status: 400 });
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    const surveyData = await request.json();
    if (!surveyData || !surveyData.title || !surveyData.questions) {
      return NextResponse.json(
        { error: "Title and questions are required" },
        { status: 400 }
      );
    }
    // Update survey in Supabase
    const { data: updatedSurvey, error } = await supabaseAdmin
      .from("surveys")
      .update({
        title: surveyData.title,
        questions: surveyData.questions,
        description: surveyData.description || "",
        metadata: surveyData.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", surveyId)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update survey" },
        { status: 500 }
      );
    }
    // Actigity log
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action: "update_survey",
      resource_type: "survey",
      resource_id: surveyData.id,
      details: {
        updated_field: {
          title: surveyData.title,
          questions: surveyData.questions,
          description: surveyData.description,
          metadata: surveyData.metadata,
        },
      },
    });
    return NextResponse.json({ survey: updatedSurvey }, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/surveys:", error);
    return NextResponse.json(
      { error: "Failed to update survey" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const surveyId = getSurveyIdFromUrl(request);
    if (!surveyId) {
      return NextResponse.json({ error: "Survey ID missing" }, { status: 400 });
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    // Delete survey from Supabase
    const { error } = await supabaseAdmin
      .from("surveys")
      .delete()
      .eq("id", surveyId)
      .eq("user_id", userId);
    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete survey" },
        { status: 500 }
      );
    }
    // Actigity log
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action: "delete_survey",
      resource_type: "survey",
      resource_id: surveyId,
    });

    return NextResponse.json(
      { message: "Survey deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/surveys:", error);
    return NextResponse.json(
      { error: "Failed to delete survey" },
      { status: 500 }
    );
  }
}
