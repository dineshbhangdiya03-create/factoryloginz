// app/api/workers/route.ts
import { NextResponse } from "next/server";
import { getWorkers } from "@/lib/googleSheets";

export async function GET() {
  try {
    const workers = await getWorkers();
    return NextResponse.json({ success: true, workers });
  } catch (err) {
    console.error("Error fetching workers", err);
    return NextResponse.json(
      { success: false, error: "Failed to load workers" },
      { status: 500 }
    );
  }
}
