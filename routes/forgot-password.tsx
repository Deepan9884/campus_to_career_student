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
      <h1 className="text-3xl font-bold">Reset password</h1>
      <p className="text-muted-foreground mt-1 text-sm">We'll send you a recovery link.</p>
      {sent ? (
        <div className="mt-6 glass rounded-xl p-5 text-center">
          <CheckCircle2 className="h-10 w-10 text-[color:var(--color-success)] mx-auto" />
          <p className="mt-3 font-semibold">Check your inbox</p>
          <p className="text-sm text-muted-foreground mt-1">A reset link was sent to {email}.</p>
          <Link to="/login" className="mt-4 inline-block text-gradient font-semibold text-sm">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Email" error={err}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full glass-input rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              />
            </div>
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="text-gradient font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
