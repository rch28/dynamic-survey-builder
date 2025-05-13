import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/getServerSession";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; collaboratorId: string } }
) {
  try {
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Check if the current user is the owner
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from("surveys")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (surveyError && !survey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the collaborator's role
    const { data: collaborator, error } = await supabaseAdmin
      .from("collaborators")
      .update({ role })
      .eq("id", params.collaboratorId)
      .eq("survey_id", params.id)
      .select("id, user_id, role")
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update collaborator" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      action: "update_collaborator",
      resource_type: "survey",
      resource_id: params.id,
      details: { collaborator_id: collaborator.user_id, role },
    });

    return NextResponse.json({ collaborator }, { status: 200 });
  } catch (error) {
    console.error("Update collaborator error:", error);
    return NextResponse.json(
      { error: "Failed to update collaborator" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; collaboratorId: string } }
) {
  try {
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if the current user is the owner
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from("surveys")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (surveyError && !survey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the collaborator info before deleting
    const { data: collaborator, error: getError } = await supabaseAdmin
      .from("collaborators")
      .select("user_id")
      .eq("id", params.collaboratorId)
      .single();

    if (getError) {
      console.error("Database error:", getError);
      return NextResponse.json(
        { error: "Failed to find collaborator" },
        { status: 404 }
      );
    }

    // Delete the collaborator
    const { error } = await supabaseAdmin
      .from("collaborators")
      .delete()
      .eq("id", params.collaboratorId)
      .eq("survey_id", params.id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to remove collaborator" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      action: "remove_collaborator",
      resource_type: "survey",
      resource_id: params.id,
      details: { collaborator_id: collaborator.user_id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    return NextResponse.json(
      { error: "Failed to remove collaborator" },
      { status: 500 }
    );
  }
}
