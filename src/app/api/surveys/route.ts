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
    // Fetch all surveys where the user is the owner
    const { data: ownedSurveys, error: ownedError } = await supabaseAdmin
      .from("surveys")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (ownedError) {
      console.error("Error fetching owned surveys:", ownedError);
      return NextResponse.json(
        { error: "Failed to fetch surveys" },
        { status: 500 }
      );
    }
    // Fetch all surveys where the user is a collaborator
    const { data: collaborations, error: collabError } = await supabaseAdmin
      .from("collaborators")
      .select(
        `role,
    survey_id,
    survey:surveys!survey_id (*)`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (collabError) {
      console.error("Error fetching collaborations:", collabError);
      return NextResponse.json(
        { error: "Failed to fetch surveys" },
        { status: 500 }
      );
    }

    // Format collaboration data
    const collaborativeSurveys = collaborations.map((collab) => {
      const survey = collab.survey;
      return {
        ...survey,
        collaborative: true,
        role: collab.role,
      };
    });

    // Return both owned and collaborative surveys
    const allSurveys = [
      ...ownedSurveys.map((survey) => ({ ...survey, owned: true })),
      ...collaborativeSurveys,
    ];

    return NextResponse.json({ surveys: allSurveys || [] }, { status: 200 });
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

    // ACTIVITY LOG
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      action: "create_survey",
      resource_type: "survey",
      resource_id: data.id,
      details: {
        updated_field: {
          title: surveyData.title,
          questions: surveyData.questions,
          description: surveyData.description,
          metadata: surveyData.metadata,
        },
      },
    });
    return NextResponse.json({ survey: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/surveys:", error);
    return NextResponse.json(
      { error: "Failed to create survey" },
      { status: 500 }
    );
  }
}
