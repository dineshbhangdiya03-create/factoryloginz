"use client";

import React, { useEffect, useState } from "react";

type Emp = { empId: string; name: string; password: string };

export default function EmpPage() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [selected, setSelected] = useState<Emp | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowFallback, setAllowFallback] = useState(false);
  const [lastAction, setLastAction] = useState<"LOGIN" | "LOGOUT" | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/emps");
        const data = await res.json();
        if (!mounted) return;
        if (data.success) {
          setEmps(data.emps || []);
        } else {
          setError("Failed to load employees");
        }
      } catch (e) {
        console.error(e);
        setError("Error loading employees");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handlePunch(action: "LOGIN" | "LOGOUT") {
    setError(null);
    setMessage(null);
    setAllowFallback(false);
    setLastAction(action);

    if (!selected) {
      setError("Please select your name");
      return;
    }

    if (!password) {
      setError("Please enter password");
      return;
    }

    // Simple client-side password check against sheet value (acceptable per request, not secure)
    if (selected.password !== password) {
      setError("Invalid password");
      return;
    }

    setBusy(true);

    try {
      if (!("geolocation" in navigator)) {
        throw new Error("Geolocation not available");
      }

      // Optional: check permission state first to give clearer guidance
      try {
        // @ts-ignore - permissions may not exist in all browsers
        if ((navigator as any).permissions && (navigator as any).permissions.query) {
          try {
            const p = await (navigator as any).permissions.query({ name: "geolocation" });
            if (p.state === "denied") {
              throw new Error("Location permission is blocked in your browser. Please enable location for this site.");
            }
          } catch (permErr) {
            // ignore permission query errors
          }
        }
      } catch (e) {
        // ignore
      }

      // Use explicit callbacks so we can capture PositionError properties (code/message/name)
      const pos: GeolocationPosition = await new Promise((resolve, reject) => {
        const success = (p: GeolocationPosition) => resolve(p);
        const failure = (e: any) => {
          // Some browsers return DOMException/PositionError with non-enumerable props; build a structured object
          const errObj: any = {
            name: e?.name || (e?.code ? "PositionError" : "Error"),
            code: e?.code ?? null,
            message: e?.message || String(e),
          };
          console.error("Geolocation failure:", errObj);
          reject(errObj);
        };

        navigator.geolocation.getCurrentPosition(success, failure, { enableHighAccuracy: true, timeout: 20000 });
      });

      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: selected.empId,
          name: selected.name,
          action,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          type: "EMP",
        }),
      });

      // Try to parse JSON, but fall back to text for robust debugging
      let data: any = null;
      let rawText: string | null = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        try {
          rawText = await res.text();
        } catch (tErr) {
          rawText = null;
        }
        console.error("/api/punch returned non-JSON response", { status: res.status, parseErr, rawText });
      }

      if (!res.ok || !data?.success) {
        const serverMessage = data?.error || data?.message || rawText || `HTTP ${res.status}`;
        console.error("Punch failed:", { status: res.status, body: data ?? rawText });
        setError(serverMessage || "Failed to punch");
      } else {
        setMessage((data.message || "Marked successfully") + (data.distance ? ` (distance ${data.distance}m)` : ""));
      }
    } catch (err: any) {
      // Improved error logging: print rich info for non-Error throwables
      if (err instanceof Error) {
        console.error("EMP handlePunch error:", err);
        setError(err.message || "Error during punch");
      } else {
        try {
          // Some DOMExceptions / PositionErrors don't serialize; show details
          console.error("EMP handlePunch non-error (raw):", err);
          try {
            console.dir(err);
          } catch (dErr) {
            // ignore
          }
          try {
            console.error("EMP handlePunch non-error ownProps:", Object.getOwnPropertyNames(err));
          } catch (pErr) {
            // ignore
          }

          const msg = (err && (err.message || err.name)) || (typeof err === "object" ? JSON.stringify(err) : String(err));
          setError(msg || "Error during punch");
          // If this was a timeout or permission issue, allow factory fallback so user can choose
          if (err?.code === 3 || /timeout/i.test(msg) || /denied|permission/i.test(msg)) {
            setAllowFallback(true);
          }
        } catch (e) {
          console.error("EMP handlePunch unknown error", err);
          setError("Error during punch");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function useFactoryFallback() {
    if (!lastAction) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const sres = await fetch("/api/settings");
      const sdata = await sres.json();
      const lat = sdata?.settings?.factoryLat ?? NaN;
      const lng = sdata?.settings?.factoryLng ?? NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError("Factory coordinates unavailable on server. Cannot use fallback.");
        return;
      }

      const pres = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: selected?.empId,
          name: selected?.name,
          action: lastAction,
          lat,
          lng,
          accuracy: 0,
          type: "EMP",
        }),
      });

      const pdata = await pres.json();
      if (!pres.ok || !pdata.success) {
        setError(pdata.error || pdata.message || `Fallback failed (HTTP ${pres.status})`);
      } else {
        setMessage((pdata.message || "Marked successfully (fallback)") + (pdata.distance ? ` (distance ${pdata.distance}m)` : ""));
        setAllowFallback(false);
      }
    } catch (e: any) {
      console.error("Fallback error:", e);
      setError(e?.message || String(e) || "Error using fallback");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black mb-3">EMP LOGIN</h1>
          <p className="text-base sm:text-lg text-gray-600">Employees: select your name and enter password</p>
        </div>

        <div className="bg-white/85 rounded-3xl shadow-lg p-6 sm:p-8">
          <div className="mb-6">
            <label className="block text-xl font-black mb-2">👥 Select Name</label>
            {loading ? (
              <div className="h-12 flex items-center">Loading…</div>
            ) : (
              <select
                className="w-full p-3 rounded-lg border border-gray-200"
                value={selected?.empId || ""}
                onChange={(e) => {
                  const em = emps.find((x) => x.empId === e.target.value) || null;
                  setSelected(em);
                  setError(null);
                }}
              >
                <option value="">-- Choose name --</option>
                {emps.map((em) => (
                  <option key={em.empId} value={em.empId}>
                    {em.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-xl font-black mb-2">🔒 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-200"
              placeholder="Enter password"
            />
          </div>

          {/* Show selected ID and sheet hint */}
          {selected && (
            <div className="mb-4 text-sm text-gray-700">
              <p><strong>Your ID:</strong> <span className="font-mono">{selected.empId}</span></p>
              <p className="mt-1">Note: Employee IDs and passwords are read from the Google Sheet `EMP` tab — ID is column A and passwords are in column F.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <button
              disabled={busy}
              onClick={() => handlePunch("LOGIN")}
              className="bg-emerald-500 text-white py-3 rounded-lg font-bold"
            >
              {busy ? "Processing..." : "LOGIN"}
            </button>

            <button
              disabled={busy}
              onClick={() => handlePunch("LOGOUT")}
              className="bg-red-500 text-white py-3 rounded-lg font-bold"
            >
              {busy ? "Processing..." : "LOGOUT"}
            </button>
          </div>

          {allowFallback && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">If location is blocked or timing out you can try again or use the factory fallback location (server value).</p>
              <div className="flex gap-3">
                <button onClick={() => handlePunch(lastAction || "LOGIN")} className="px-4 py-2 rounded bg-gray-200">Retry</button>
                <button onClick={useFactoryFallback} className="px-4 py-2 rounded bg-amber-500 text-white">Use Factory Fallback</button>
              </div>
            </div>
          )}

          {message && <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 mb-3">{message}</div>}
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-800 mb-3">{error}</div>}
        </div>
      </div>
    </div>
  );
}
