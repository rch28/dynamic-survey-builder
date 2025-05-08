import { supabaseAdmin } from "./supabase";

export async function setupDatabase() {
  try {
    // Create surveys table
    const { error: surveysError } = await supabaseAdmin.rpc(
      "create_table_if_not_exists",
      {
        table_name: "surveys",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        questions JSONB NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `,
      }
    );

    if (surveysError) {
      console.error("Error creating surveys table:", surveysError);
    }

    // Create responses table
    const { error: responsesError } = await supabaseAdmin.rpc(
      "create_table_if_not_exists",
      {
        table_name: "responses",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
        answers JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        respondent_id UUID
      `,
      }
    );

    if (responsesError) {
      console.error("Error creating responses table:", responsesError);
    }

    // Create users table if it doesn't exist
    const { error: usersError } = await supabaseAdmin.rpc(
      "create_table_if_not_exists",
      {
        table_name: "users",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `,
      }
    );

    if (usersError) {
      console.error("Error creating users table:", usersError);
    }

    console.log("Database setup completed");
  } catch (error) {
    console.error("Error setting up database:", error);
  }
}
