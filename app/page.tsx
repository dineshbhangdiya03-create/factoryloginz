import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-cyan-50 to-white px-4 py-8 overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl mb-8 shadow-2xl transform hover:scale-110 transition-transform">
            <span className="text-6xl">🏭</span>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 mb-6 tracking-tight">
            Factory Attendance System
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 font-semibold max-w-2xl mx-auto">
            Modern attendance tracking for your factory workers
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Employee Card */}
          <Link href="/emp">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 hover:shadow-3xl transform hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">👥</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Emp Login</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Employees (non-workers) can login with name + password.
              </p>
              <div className="flex items-center gap-2 text-amber-600 font-bold text-lg group-hover:translate-x-2 transition-transform">
                <span>Login</span>
                <span>→</span>
              </div>
            </div>
          </Link>
          {/* Worker Card */}
          <Link href="/worker">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 hover:shadow-3xl transform hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">👷</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Worker</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Check in and check out from your work shift with a single tap. Fast, simple, and reliable.
              </p>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg group-hover:translate-x-2 transition-transform">
                <span>Get Started</span>
                <span>→</span>
              </div>
            </div>
          </Link>

          {/* Supervisor Card */}
          <Link href="/supervisor">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 hover:shadow-3xl transform hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">📊</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Supervisor</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Monitor real-time attendance status and view detailed reports of all workers.
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-lg group-hover:translate-x-2 transition-transform">
                <span>Access Dashboard</span>
                <span>→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 sm:p-10 border border-white/20">
          <h3 className="text-3xl font-black text-gray-900 mb-8 text-center">✨ Key Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">GPS Tracking</h4>
                <p className="text-gray-600">Location-based check-ins for accuracy</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Mobile Friendly</h4>
                <p className="text-gray-600">Works seamlessly on all devices</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Real-Time Updates</h4>
                <p className="text-gray-600">Instant status visibility for supervisors</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Secure Access</h4>
                <p className="text-gray-600">PIN-protected supervisor dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
