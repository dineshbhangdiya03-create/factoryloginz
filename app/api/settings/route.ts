// app/api/settings/route.ts
import { NextResponse } from "next/server";
import { getSettings } from "@/lib/googleSheets";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("Error fetching settings", err);
    return NextResponse.json({ success: false, error: "Failed to load settings" }, { status: 500 });
  }
}
