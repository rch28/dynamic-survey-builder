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
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
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
    // First, check if user is the owner
    const { data: ownedSurvey, error: ownedError } = await supabaseAdmin
      .from("surveys")
      .select("*")
      .eq("id", surveyId)
      .eq("user_id", userId)
      .single();

    if (ownedSurvey && !ownedError) {
      // Get user information in a separate query
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("name, email, avatar_url")
        .eq("id", ownedSurvey.user_id)
        .single();

      // User is the owner, return with ownership flag and user data
      return NextResponse.json(
        {
          survey: {
            ...ownedSurvey,
            isOwner: true,
            user: userData || null,
          },
        },
        { status: 200 }
      );
    }
    // If not the owner, check if user is a collaborator
    const { data: collaboration, error: collabError } = await supabaseAdmin
      .from("collaborators")
      .select(" role, survey_id")
      .eq("survey_id", surveyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (collaboration && !collabError) {
      // Get the survey
      const { data: surveyData } = await supabaseAdmin
        .from("surveys")
        .select("*")
        .eq("id", collaboration.survey_id)
        .single();

      // Get owner information
      const { data: ownerData } = await supabaseAdmin
        .from("users")
        .select("name, email, avatar_url")
        .eq("id", surveyData.user_id)
        .single();

      // User is a collaborator, return with role
      return NextResponse.json(
        {
          survey: {
            ...surveyData,
            isOwner: false,
            role: collaboration.role,
            user: ownerData || null,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
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
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
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
    // Check if user is the owner
    const { data: ownedSurvey } = await supabaseAdmin
      .from("surveys")
      .select("id")
      .eq("id", surveyId)
      .eq("user_id", userId)
      .maybeSingle();

    const isOwner = !!ownedSurvey;
    let canEdit = isOwner;

    // If not the owner, check if user is a collaborator with editor role
    if (!isOwner) {
      const { data: collaboration } = await supabaseAdmin
        .from("collaborators")
        .select("role")
        .eq("survey_id", surveyId)
        .eq("user_id", userId)
        .eq("role", "editor")
        .maybeSingle();

      canEdit = !!collaboration;
    }

    // Return error if user doesn't have permission
    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this survey" },
        { status: 403 }
      );
    }

    // Update survey in Supabase (without the user_id filter so collaborators can edit)
    const { data: updatedSurvey, error } = await supabaseAdmin
      .from("surveys")
      .update({
        title: surveyData.title,
        questions: surveyData.questions,
        description: surveyData.description || "",
        metadata: surveyData.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", surveyId) // Only filter by survey ID, not by user_id
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update survey" },
        { status: 500 }
      );
    }

    // Activity log with user role context
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action: "update_survey",
      resource_type: "survey",
      resource_id: surveyId,
      details: {
        updated_as: isOwner ? "owner" : "collaborator",
        updated_field: {
          title: surveyData.title,
          questions: surveyData.questions,
          description: surveyData.description,
          metadata: surveyData.metadata,
        },
      },
    });

    // Include role information in the response
    return NextResponse.json(
      {
        survey: {
          ...updatedSurvey,
          isOwner,
          role: isOwner ? null : "editor",
        },
      },
      { status: 200 }
    );
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
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
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
    // Check if user is the owner (only owners can delete surveys)
    const { data: ownedSurvey } = await supabaseAdmin
      .from("surveys")
      .select("id")
      .eq("id", surveyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!ownedSurvey) {
      return NextResponse.json(
        { error: "Only the survey owner can delete this survey" },
        { status: 403 }
      );
    }

    // First delete all collaborators
    await supabaseAdmin
      .from("collaborators")
      .delete()
      .eq("survey_id", surveyId);

    // Delete survey from Supabase
    const { error } = await supabaseAdmin
      .from("surveys")
      .delete()
      .eq("id", surveyId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete survey" },
        { status: 500 }
      );
    }

    // Activity log
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action: "delete_survey",
      resource_type: "survey",
      resource_id: surveyId,
      details: {
        deleted_as: "owner",
      },
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
