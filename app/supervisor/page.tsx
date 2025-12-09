// app/supervisor/page.tsx
"use client";

import { useState } from "react";

interface StatusRow {
  workerId: string;
  name: string;
  lastAction: string;
  lastTime: string;
  present: boolean;
}

export default function SupervisorPage() {
  const [pin, setPin] = useState("");
  const [auth, setAuth] = useState(false);
  const [status, setStatus] = useState<StatusRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth-supervisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid PIN");
      } else {
        setAuth(true);
        await loadStatus();
      }
    } catch (err) {
      console.error(err);
      setError("Error while login");
    } finally {
      setLoading(false);
    }
  }

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load status");
      } else {
        setStatus(data.status);
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching status");
    } finally {
      setLoading(false);
    }
  }

  if (!auth) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Premium Login Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/20">
            {/* Header with icon */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-6 shadow-lg transform hover:scale-110 transition-transform">
                <span className="text-4xl">🏭</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 tracking-tight">
                Supervisor
              </h1>
              <p className="text-lg text-gray-600 font-medium">Access your attendance dashboard</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-7">
              {/* PIN Input */}
              <div className="space-y-3">
                <label className="block text-xl font-bold text-gray-900">
                  🔐 Security PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your PIN"
                  maxLength={6}
                  className="w-full px-6 py-4 text-lg font-semibold tracking-widest text-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300 transition-all duration-300 placeholder-gray-400"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 px-6 mt-8 text-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-2xl hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Authenticating...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    🔓 Login
                  </span>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 animate-pulse">
                <p className="text-red-800 text-lg font-semibold flex items-center gap-2">
                  <span>⚠️</span> {error}
                </p>
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                🏢 Factory Attendance Management System
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50 to-white p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Animated gradient orbs - background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight">📊 Attendance Dashboard</h1>
            <p className="text-lg text-gray-600 mt-3 font-medium">Real-time factory worker status</p>
          </div>
          <button
            onClick={loadStatus}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-5 px-8 text-lg font-bold rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 shadow-md">
            <p className="text-red-800 text-xl font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/30">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-cyan-500 to-blue-600 border-b-4 border-cyan-400">
                <tr>
                  <th className="px-6 sm:px-8 py-6 text-left text-lg font-bold text-white">👤 Worker ID</th>
                  <th className="px-6 sm:px-8 py-6 text-left text-lg font-bold text-white">📝 Name</th>
                  <th className="px-6 sm:px-8 py-6 text-left text-lg font-bold text-white">✅ Status</th>
                  <th className="px-6 sm:px-8 py-6 text-left text-lg font-bold text-white hidden lg:table-cell">⚡ Last Action</th>
                  <th className="px-6 sm:px-8 py-6 text-left text-lg font-bold text-white hidden md:table-cell">🕐 Last Time (IST)</th>
                </tr>
              </thead>
              <tbody>
                {status.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 sm:px-8 py-12 text-center text-xl text-gray-500 font-medium">
                      📭 No worker data available
                    </td>
                  </tr>
                ) : (
                  status.map((row, idx) => (
                    <tr
                      key={row.workerId}
                      className={`border-b border-gray-200 transition-all duration-300 hover:bg-cyan-50 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-6 sm:px-8 py-6 text-lg font-bold text-gray-900">{row.workerId}</td>
                      <td className="px-6 sm:px-8 py-6 text-lg font-semibold text-gray-800">{row.name}</td>
                      <td className="px-6 sm:px-8 py-6">
                        <span
                          className={`inline-block px-6 py-3 rounded-full text-lg font-bold shadow-md transform transition-transform hover:scale-110 ${
                            row.present
                              ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
                              : "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                          }`}
                        >
                          {row.present ? "✓ Present" : "✕ Absent"}
                        </span>
                      </td>
                      <td className="px-6 sm:px-8 py-6 text-lg text-gray-700 hidden lg:table-cell font-semibold">{row.lastAction}</td>
                      <td className="px-6 sm:px-8 py-6 text-lg text-gray-700 hidden md:table-cell font-semibold">{row.lastTime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {loading && (
          <div className="mt-8 p-8 text-center">
            <p className="text-2xl text-gray-600 font-semibold animate-pulse">⏳ Loading status…</p>
          </div>
        )}
      </div>
    </div>
  );
}
