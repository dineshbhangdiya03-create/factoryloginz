// app/api/status/route.ts
import { NextResponse } from "next/server";
import { getCurrentStatus } from "@/lib/googleSheets";

export async function GET() {
  try {
    const status = await getCurrentStatus();
    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Error fetching status", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
