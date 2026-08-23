import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { AuthShell, Field } from "./login";
import { forgotPassword } from "@/lib/auth-api";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Campus to Career AI" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Enter a valid email");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-white tracking-tight">Reset password</h1>
      <p className="text-slate-300 mt-1 text-sm">We'll send you a recovery link.</p>
      {sent ? (
        <div className="mt-6 bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 text-center text-white">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
          <p className="mt-3 font-semibold text-white">Check your inbox</p>
          <p className="text-sm text-slate-300 mt-1">A reset link was sent to {email}.</p>
          <Link to="/login" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 font-semibold text-sm hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Email" error={err}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              />
            </div>
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
          </button>
          <p className="text-center text-sm text-slate-400">
            Remembered it?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
