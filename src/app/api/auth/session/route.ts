import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("user");

    if (!userCookie) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = JSON.parse(userCookie.value);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
