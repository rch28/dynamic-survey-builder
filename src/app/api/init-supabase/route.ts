import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }
    // Create users table if it doesn't exist
    const { error: usersError } = await supabaseAdmin.rpc("_exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'user',
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `,
    });

    if (usersError) {
      console.error("SQL error creating users table:", usersError);
      return NextResponse.json(
        { error: "Failed to create users table" },
        { status: 500 }
      );
    }

    // Create surveys table if it doesn't exist
    const { error: surveysError } = await supabaseAdmin.rpc("_exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS surveys (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          description TEXT,
          questions JSONB NOT NULL,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS surveys_user_id_idx ON surveys(user_id);
      `,
    });

    if (surveysError) {
      console.error("SQL error creating surveys table:", surveysError);
      return NextResponse.json(
        { error: "Failed to create surveys table" },
        { status: 500 }
      );
    }

    // Create collaborators table if it doesn't exist
    const { error: collaboratorsError } = await supabaseAdmin.rpc("_exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS collaborators (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id),
          role TEXT NOT NULL DEFAULT 'viewer',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(survey_id, user_id)
        );
        CREATE INDEX IF NOT EXISTS collaborators_survey_id_idx ON collaborators(survey_id);
        CREATE INDEX IF NOT EXISTS collaborators_user_id_idx ON collaborators(user_id);
      `,
    });

    if (collaboratorsError) {
      console.error(
        "SQL error creating collaborators table:",
        collaboratorsError
      );
      return NextResponse.json(
        { error: "Failed to create collaborators table" },
        { status: 500 }
      );
    }

    // Create responses table if it doesn't exist
    const { error: responsesError } = await supabaseAdmin.rpc("_exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS responses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
          respondent_id UUID REFERENCES users(id),
          answers JSONB NOT NULL,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS responses_survey_id_idx ON responses(survey_id);
      `,
    });

    if (responsesError) {
      console.error("SQL error creating responses table:", responsesError);
      return NextResponse.json(
        { error: "Failed to create responses table" },
        { status: 500 }
      );
    }

    // Create activity_logs table if it doesn't exist
    const { error: logsError } = await supabaseAdmin.rpc("_exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS activity_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id),
          action TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          resource_id UUID,
          details JSONB DEFAULT '{}'::jsonb,
          ip_address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
        CREATE INDEX IF NOT EXISTS activity_logs_resource_id_idx ON activity_logs(resource_id);
      `,
    });

    if (logsError) {
      console.error("SQL error creating activity_logs table:", logsError);
      return NextResponse.json(
        { error: "Failed to create activity_logs table" },
        { status: 500 }
      );
    }

    // Create visitors table if it doesn't exist
    const { error: visitorsError } = await supabaseAdmin.rpc("_exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS visitors (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
          visitor_id TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          referrer TEXT,
          completed BOOLEAN DEFAULT false,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE
        );
        CREATE INDEX IF NOT EXISTS visitors_survey_id_idx ON visitors(survey_id);
      `,
    });

    if (visitorsError) {
      console.error("SQL error creating visitors table:", visitorsError);
      return NextResponse.json(
        { error: "Failed to create visitors table" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Database initialized successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}
