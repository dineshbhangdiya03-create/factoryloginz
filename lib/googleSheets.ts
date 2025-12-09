// lib/googleSheets.ts
import { google } from "googleapis";

/**
 * ENV DEBUG (temporary – safe in local)
 * This helps confirm env vars are being read.
 */
console.log("ENV CHECK:", {
  email: process.env.GOOGLE_CLIENT_EMAIL,
  sheetId: process.env.ATTENDANCE_SHEET_ID,
  hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
});

const sheets = google.sheets("v4");

function getAuthClient() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  console.log("KEY DEBUG:", {
    hasKey: !!rawKey,
    keyLength: rawKey ? rawKey.length : 0,
  });

  const client = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: rawKey?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  // Force auth once to expose clear errors
  client.authorize().catch((err) => {
    console.error("JWT authorize error:", err);
  });

  return client;
}

// ================= SETTINGS =================

export async function getSettings() {
  const auth = getAuthClient();
  // Try key:value layout first (A1:B10)
  const res = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: process.env.ATTENDANCE_SHEET_ID!,
    range: "SETTINGS!A1:B10",
  });

  const rows = res.data.values || [];
  const map: Record<string, string> = {};
  rows.forEach((r) => {
    if (r[0]) map[r[0]] = r[1];
  });

  // If keys exist, prefer them
  if (map["FACTORY_LAT"] || map["FACTORY_LNG"]) {
    return {
      factoryLat: parseFloat(map["FACTORY_LAT"]),
      factoryLng: parseFloat(map["FACTORY_LNG"]),
      geofenceRadiusM: parseFloat(map["GEOFENCE_RADIUS_M"] || "80"),
      timezone: map["TIMEZONE"] || "Asia/Kolkata",
      supervisorPin: map["SUPERVISOR_PIN"] || "4321",
    };
  }

  // Fallback: some sheets store values directly in B1/B2/B3
  try {
    const direct = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: process.env.ATTENDANCE_SHEET_ID!,
      range: "SETTINGS!B1:B3",
    });
    const vals = (direct.data.values || []).flat();
    const factoryLat = parseFloat(vals[0]);
    const factoryLng = parseFloat(vals[1]);
    const geofenceRadiusM = parseFloat(vals[2] || "80");
    return {
      factoryLat: Number.isFinite(factoryLat) ? factoryLat : NaN,
      factoryLng: Number.isFinite(factoryLng) ? factoryLng : NaN,
      geofenceRadiusM: Number.isFinite(geofenceRadiusM) ? geofenceRadiusM : 80,
      timezone: map["TIMEZONE"] || "Asia/Kolkata",
      supervisorPin: map["SUPERVISOR_PIN"] || "4321",
    };
  } catch (e) {
    // final fallback
    return {
      factoryLat: NaN,
      factoryLng: NaN,
      geofenceRadiusM: 80,
      timezone: "Asia/Kolkata",
      supervisorPin: "4321",
    };
  }
}

export async function appendUnauthRow(
  timestamp: string,
  workerId: string,
  name: string,
  lat: number,
  lng: number,
  accuracyM: number,
  distanceM: number,
  reason: string,
  userAgent: string
) {
  const auth = getAuthClient();

  await sheets.spreadsheets.values.append({
    auth,
    spreadsheetId: process.env.ATTENDANCE_SHEET_ID!,
    range: "UNAUTH!A:I",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[timestamp, workerId, name, lat, lng, accuracyM, distanceM, reason, userAgent]],
    },
  });
}

// ================= WORKERS =================

export interface Worker {
  workerId: string;
  name: string;
  active: boolean;
}

export async function getWorkers(): Promise<Worker[]> {
  const auth = getAuthClient();

  const res = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: process.env.ATTENDANCE_SHEET_ID!,
    range: "WORKERS!A2:D",
  });

  const rows = res.data.values || [];

  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => ({
      workerId: r[0],
      name: r[1],
      active: String(r[3]).toUpperCase() === "TRUE",
    }))
    .filter((w) => w.active);
}

// ================= LOG INSERT =================

export async function appendLogRow(
  timestamp: string,
  workerId: string,
  name: string,
  action: "LOGIN" | "LOGOUT",
  lat: number,
  lng: number,
  accuracyM: number,
  withinGeofence: boolean,
  userAgent: string
) {
  const auth = getAuthClient();

  await sheets.spreadsheets.values.append({
    auth,
    spreadsheetId: process.env.ATTENDANCE_SHEET_ID!,
    range: "LOGS!A:I",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp,
          workerId,
          name,
          action,
          lat,
          lng,
          accuracyM,
          withinGeofence,
          userAgent,
        ],
      ],
    },
  });
}

// ================= STATUS =================

export async function getCurrentStatus() {
  const auth = getAuthClient();

  const logsRes = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: process.env.ATTENDANCE_SHEET_ID!,
    range: "LOGS!A2:I",
  });

  const workers = await getWorkers();
  const logs = logsRes.data.values || [];

  type Status = {
    workerId: string;
    name: string;
    lastAction: string;
    lastTime: string;
    present: boolean;
  };

  const map: Record<string, Status> = {};

  logs.forEach((row) => {
    const [ts, wid, name, action] = row;
    if (!wid) return;

    if (!map[wid] || new Date(ts) > new Date(map[wid].lastTime)) {
      map[wid] = {
        workerId: wid,
        name,
        lastAction: action,
        lastTime: ts,
        present: action === "LOGIN",
      };
    }
  });

  // Ensure all workers appear
  workers.forEach((w) => {
    if (!map[w.workerId]) {
      map[w.workerId] = {
        workerId: w.workerId,
        name: w.name,
        lastAction: "NONE",
        lastTime: "",
        present: false,
      };
    }
  });

  return Object.values(map);
}
