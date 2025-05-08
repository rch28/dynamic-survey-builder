import { NextResponse } from "next/server";
import { setupDatabase } from "@/lib/database-setup";

export async function GET() {
  try {
    await setupDatabase();
    return NextResponse.json({
      success: true,
      message: "Database setup completed",
    });
  } catch (error) {
    console.error("Error in setup-db route:", error);
    return NextResponse.json(
      { error: "Failed to set up database" },
      { status: 500 }
    );
  }
}
