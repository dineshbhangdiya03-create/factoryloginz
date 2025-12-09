// app/api/auth-supervisor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/googleSheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;
    const settings = await getSettings();

    if (pin === settings.supervisorPin) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid PIN" },
        { status: 401 }
      );
    }
  } catch (err) {
    console.error("Error in supervisor auth", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
