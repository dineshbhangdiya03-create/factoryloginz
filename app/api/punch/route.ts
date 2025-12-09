// app/api/punch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { appendLogRow, getSettings, appendUnauthRow } from "@/lib/googleSheets";
import { isWithinGeofence } from "@/lib/geo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId, name, action, lat, lng, accuracy } = body;

    if (!workerId || !name || !action || lat == null || lng == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["LOGIN", "LOGOUT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const { within, distance } = isWithinGeofence(
      lat,
      lng,
      settings.factoryLat,
      settings.factoryLng,
      settings.geofenceRadiusM
    );

    const now = new Date();
    const timestampIST = now.toLocaleString("en-GB", {
      timeZone: settings.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const userAgent = req.headers.get("user-agent") || "";

    await appendLogRow(
      timestampIST,
      workerId,
      name,
      action,
      lat,
      lng,
      accuracy ?? distance,
      within,
      userAgent
    );

    if (!within) {
      // Log unauthorized attempt to UNAUTH tab
      try {
        await appendUnauthRow(
          timestampIST,
          workerId,
          name,
          lat,
          lng,
          accuracy ?? distance,
          distance,
          "Location outside factory",
          userAgent
        );
      } catch (e) {
        console.error("Failed to write UNAUTH row", e);
      }

      return NextResponse.json({
        success: false,
        warning: true,
        message: "APKA LOCATION FACTORY SE DOOR DIKHA RAHA HAI",
        distance,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${action} for ${name}`,
      distance,
    });
  } catch (err) {
    console.error("Error in punch endpoint", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
