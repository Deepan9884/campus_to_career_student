import React, { useState } from "react";
import {
  Lock,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { setAccessToken, API_BASE } from "../lib/api";
import { toast } from "sonner";

export function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Login failed");
      }

      setAccessToken(json.data.accessToken);
      toast.success("Welcome back to Mentor Portal!");
      onLoginSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center selection:bg-indigo-600 selection:text-white font-sans relative overflow-hidden">
      {/* Soft Ambient Light Glow & Subtle Dot Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-50 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-200/50 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-200/40 blur-[130px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen relative z-10">
        
        {/* Left Panel - Branding Showcase (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative p-8 xl:p-14 flex-col justify-between overflow-hidden">
          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <img
              src="/logo.png"
              alt="Campus to Career AI"
              className="h-12 xl:h-14 w-auto max-w-[260px] object-contain drop-shadow-xs"
            />
          </div>

          {/* Hero Branding Content */}
          <div className="relative z-10 max-w-xl space-y-5 my-auto py-6">
            <div className="space-y-3">
              <h1 className="text-2xl xl:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                Student placement benchmarks & cohort telemetry.
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                Monitor student skill deficiencies, competitive coding performance, ATS resume scores, and multi-round AI voice interview audits from one unified command center.
              </p>
            </div>

            {/* Faculty & Mentee Collaboration Illustration */}
            <div className="relative flex items-center justify-center py-2">
              <img
                src="/teacher-mentor.png"
                alt="Faculty Mentorship & Career Readiness"
                className="w-full max-h-[360px] xl:max-h-[420px] object-contain pointer-events-none select-none transition-transform duration-500 hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Executive Light Theme Sign-In Form */}
        <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md space-y-6">
            
            {/* Mobile Header Brand Icon */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
              <img src="/logo.png" alt="Campus to Career AI" className="h-12 w-auto max-w-[240px] object-contain" />
            </div>

            {/* Executive Light Theme Login Card */}
            <div className="rounded-3xl p-8 sm:p-10 space-y-6 relative overflow-hidden bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 text-slate-900">
              
              {/* Section Heading */}
              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full shadow-xs">
                    Faculty & Mentor Portal
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Sign in to workspace
                </h2>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Enter your institutional credentials to manage student placement telemetry.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mentor@campustocareer.ai"
                      required
                      className="w-full bg-slate-50/80 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => toast.info("Contact your campus system administrator to reset credentials.")}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50/80 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-900 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none placeholder:text-slate-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 hover:text-slate-800">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Keep me signed in for 30 days</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm py-3 rounded-xl shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-[1.01]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
