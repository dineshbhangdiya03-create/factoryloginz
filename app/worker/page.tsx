"use client";

import React, { useEffect, useState } from "react";
import Select from "react-select";

type Worker = { workerId: string; name: string };

const FACTORY_LAT = 19.1235931691;
const FACTORY_LNG = 72.8912651580;

export default function WorkerPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selected, setSelected] = useState<Worker | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/workers");
        const data = await res.json();
        if (!mounted) return;
        if (data.success) {
          setWorkers(data.workers || []);
        } else {
          setError("Failed to load workers");
        }
      } catch (e) {
        console.error(e);
        setError("Error loading workers");
      } finally {
        setLoadingWorkers(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function sendPunch(lat: number, lng: number, accuracy: number, mode: "gps" | "fallback", action: "LOGIN" | "LOGOUT") {
    try {
      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: selected!.workerId,
          name: selected!.name,
          action,
          lat,
          lng,
          accuracy,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || data.message || "Failed to punch");
      } else {
        setMessage(
          (data.message || "Marked successfully") + (mode === "fallback" ? " (using fallback location)" : "") + (data.distance ? ` (distance ${data.distance}m)` : "")
        );
        if (data.warning) setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Error sending data");
    } finally {
      setBusy(false);
    }
  }
  // Try to get a high-accuracy position by retrying a few times and picking the best reading
  async function getAccuratePosition(maxAttempts = 3, perAttemptTimeout = 20000) {
    if (!("geolocation" in navigator)) {
      throw new Error("Geolocation not available");
    }

    let best: GeolocationPosition | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          const id = navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            (e) => reject(e),
            { enableHighAccuracy: true, timeout: perAttemptTimeout, maximumAge: 0 }
          );
          // no-op: let browser handle timeout
        });

        if (!best || pos.coords.accuracy < best.coords.accuracy) {
          best = pos;
        }

        // If accuracy is good enough, stop early
        if (pos.coords.accuracy && pos.coords.accuracy <= 50) {
          return pos;
        }
        // otherwise continue and attempt again to improve
      } catch (e) {
        // continue attempts, but remember best if any
        console.warn("geolocation attempt failed", e);
        // Surface the last error message for debugging
        // (we won't throw immediately as we may get a better reading on retry)
        // @ts-ignore
        lastGeoError = e as GeolocationPositionError | Error;
      }
    }

    if (best) return best;
    // If we have a final error, include its message
    // @ts-ignore
    const msg = lastGeoError ? lastGeoError.message || String(lastGeoError) : "Unable to get geolocation";
    throw new Error(msg);
  }

  async function handlePunch(action: "LOGIN" | "LOGOUT") {
    setError(null);
    setMessage(null);

    if (!selected) {
      setError("Please pick your name");
      return;
    }

    setBusy(true);

    try {
      // Check permission state first (if supported)
      if ((navigator as any).permissions && (navigator as any).permissions.query) {
        try {
          const pState = await (navigator as any).permissions.query({ name: "geolocation" });
          if (pState.state === "denied") {
            setError("Location permission is blocked in your browser. Please enable location for this site.");
            setBusy(false);
            return;
          }
        } catch (permErr) {
          // ignore permission check errors and continue to request location
          console.warn("permissions.query error", permErr);
        }
      }

      const pos = await getAccuratePosition(3, 20000);
      // If the reading is available but not very accurate, show accuracy to user
      if (pos.coords && typeof pos.coords.accuracy === "number" && pos.coords.accuracy > 200) {
        setError(`Location accuracy is low (${Math.round(pos.coords.accuracy)}m). Try moving outdoors or use mobile GPS.`);
      }

      sendPunch(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? 0, "gps", action);
    } catch (err: any) {
      console.error("GEO ERROR:", err);
      // Provide a clearer error to the user with reason if available
      const reason = err?.message ? String(err.message) : String(err || "Unknown error");
      setError(`⚠️ Unable to get high accuracy location: ${reason}. Using fallback location.`);
      // fallback for local/dev - use factory coords so server can still log attempt
      sendPunch(FACTORY_LAT, FACTORY_LNG, 0, "fallback", action);
    }
  }

  // react-select options
  const options = workers.map((w) => ({ value: w.workerId, label: w.name }));

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white px-4 py-6 overflow-hidden">

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header (smaller) */}
        <div className="text-center mb-8 lg:mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/0 rounded-3xl mb-6 shadow-none">
            {/* removed clock icon and heavy gradient */}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-3 tracking-tight">ATTENDANCE</h1>
          <p className="text-base sm:text-lg text-gray-600 font-medium">Factory ke Gate Pe Aake Login Karna hai</p>
        </div>

        {/* Main Card (reduced padding and slightly more transparent) */}
        <div className="bg-white/85 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 mb-6 border border-white/20">
          {/* Worker Selection */}
          <div className="mb-8">
            <label className="block text-xl sm:text-2xl font-black text-gray-900 mb-4">👤 Select your name</label>
            {loadingWorkers ? (
              <div className="h-16 sm:h-20 flex items-center justify-center text-lg text-gray-500">
                <span className="animate-pulse">Loading names…</span>
              </div>
            ) : (
              <div className="relative">
                <Select
                  options={options}
                  onChange={(opt: any) => {
                    const w = workers.find((x) => x.workerId === opt?.value) || null;
                    setSelected(w);
                    setMessage(null);
                    setError(null);
                  }}
                  isClearable
                  placeholder="-- Choose name --"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "56px",
                      borderRadius: "16px",
                      borderColor: "#e5e7eb",
                      fontSize: "16px",
                      padding: "2px",
                      color: "#000",
                      backgroundColor: "#f9fafb",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.04)",
                      border: "1px solid #e5e7eb",
                    }),
                    input: (base) => ({
                      ...base,
                      color: "#000",
                      fontSize: "16px",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "#888",
                      fontSize: "16px",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "#000",
                      fontSize: "16px",
                    }),
                    option: (base, state) => ({
                      ...base,
                      fontSize: "16px",
                      padding: "12px",
                      cursor: "pointer",
                      background: state.isSelected
                        ? "linear-gradient(to right, #06b6d4, #0284c7)"
                        : state.isFocused
                        ? "#f7fbfd"
                        : "#fff",
                      color: state.isSelected ? "#fff" : "#000",
                    }),
                    menuList: (base) => ({
                      ...base,
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                    }),
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <button
              disabled={busy}
              onClick={() => handlePunch("LOGIN")}
              className="bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white py-6 sm:py-7 lg:py-8 px-6 rounded-2xl text-lg sm:text-xl lg:text-2xl font-black shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <span>✓</span> {busy ? "Processing..." : "LOGIN"}
            </button>

            <button
              disabled={busy}
              onClick={() => handlePunch("LOGOUT")}
              className="bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600 text-white py-6 sm:py-7 lg:py-8 px-6 rounded-2xl text-lg sm:text-xl lg:text-2xl font-black shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <span>✕</span> {busy ? "Processing..." : "LOGOUT"}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
              <p className="text-emerald-900 text-base sm:text-lg font-semibold">✓ {message}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm animate-pulse">
              <p className="text-red-900 text-base sm:text-lg font-semibold">⚠️ {error}</p>
            </div>
          )}

          {/* Tip */}
          <div className="text-sm sm:text-base text-gray-700 bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
            <p className="font-semibold">💡 Tip:</p>
            <p>Mobile use .</p>
          </div>
        </div>

        {/* Worker ID Display */}
        {selected && (
          <div className="text-center p-5 rounded-2xl bg-white/85 backdrop-blur-lg border border-white/20 shadow-md">
            <p className="text-gray-700 text-base">Logged in as: <span className="font-black text-gray-900 text-xl">{selected.name}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
