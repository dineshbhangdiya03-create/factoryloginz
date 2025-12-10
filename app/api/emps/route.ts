// app/api/emps/route.ts
import { NextResponse } from "next/server";
import { getEmps } from "@/lib/googleSheets";

export async function GET() {
  try {
    const emps = await getEmps();
    // Do NOT include passwords in production — returning here because sheet stores them and user requested client-side verify
    return NextResponse.json({ success: true, emps });
  } catch (err) {
    console.error("Error fetching emps", err);
    return NextResponse.json({ success: false, error: "Failed to load employees" }, { status: 500 });
  }
}
