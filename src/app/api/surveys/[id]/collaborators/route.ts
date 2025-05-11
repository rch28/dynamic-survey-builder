import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { CollaboratorRole } from "@/types/collaboration";
import { getServerSession } from "@/lib/auth/getServerSession";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSession();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if the user has access to the survey
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from("surveys")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (surveyError && !survey) {
      // If not the owner, check if they're a collaborator
      const { data: collaborator, error: collaboratorError } =
        await supabaseAdmin
          .from("collaborators")
          .select("id")
          .eq("survey_id", params.id)
          .eq("user_id", user.id)
          .single();

      if (collaboratorError && !collaborator) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Fetch collaborators
    const { data: collaborators, error } = await supabaseAdmin
      .from("collaborators")
      .select(
        `
        id,
        survey_id,
        user_id,
        role,
        created_at,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `
      )
      .eq("survey_id", params.id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch collaborators" },
        { status: 500 }
      );
    }

    // Transform the data to match our types
    const formattedCollaborators = collaborators.map((c) => ({
      id: c.id,
      surveyId: c.survey_id,
      userId: c.user_id,
      role: c.role,
      createdAt: c.created_at,
      user: c.users,
    }));

    return NextResponse.json(
      { collaborators: formattedCollaborators },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get collaborators error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getServerSession();

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { email, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if the current user is the owner or an editor
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from("surveys")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", currentUser.id)
      .single();

    if (surveyError && !survey) {
      // If not the owner, check if they're an editor
      const { data: collaborator, error: collaboratorError } =
        await supabaseAdmin
          .from("collaborators")
          .select("role")
          .eq("survey_id", params.id)
          .eq("user_id", currentUser.id)
          .eq("role", CollaboratorRole.EDITOR)
          .single();

      if (collaboratorError || !collaborator) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Find the user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("email", email)
      .single();

    if (userError || !user) {
      // User doesn't exist, create a new user
      const { data: newUser, error: createUserError } = await supabaseAdmin
        .from("users")
        .insert({
          email,
          name: email.split("@")[0], // Use part of email as name
        })
        .select("id, name, email, avatar_url")
        .single();

      if (createUserError || !newUser) {
        console.error("Error creating user:", createUserError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      // Use the newly created user
      const user = newUser;
    }

    // Check if the user is already a collaborator
    const { data: existingCollaborator, error: existingError } =
      await supabaseAdmin
        .from("collaborators")
        .select("id")
        .eq("survey_id", params.id)
        .eq("user_id", user.id)
        .single();

    if (existingCollaborator) {
      return NextResponse.json(
        { error: "User is already a collaborator" },
        { status: 400 }
      );
    }

    // Add the collaborator
    const { data: collaborator, error } = await supabaseAdmin
      .from("collaborators")
      .insert({
        survey_id: params.id,
        user_id: user.id,
        role: role || CollaboratorRole.VIEWER,
      })
      .select("id, survey_id, user_id, role, created_at")
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to add collaborator" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: currentUser.id,
      action: "add_collaborator",
      resource_type: "survey",
      resource_id: params.id,
      details: { collaborator_id: user.id, collaborator_email: email, role },
    });

    // Return the collaborator with user info
    const formattedCollaborator = {
      id: collaborator.id,
      surveyId: collaborator.survey_id,
      userId: collaborator.user_id,
      role: collaborator.role,
      createdAt: collaborator.created_at,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
      },
    };

    return NextResponse.json(
      { collaborator: formattedCollaborator },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add collaborator error:", error);
    return NextResponse.json(
      { error: "Failed to add collaborator" },
      { status: 500 }
    );
  }
}
