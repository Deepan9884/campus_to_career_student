import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";
import { verifyResetToken, resetPassword, type VerifyResetTokenResponse } from "@/lib/auth-api";
import { useAuth } from "@/stores";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — Campus to Career AI" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const [status, setStatus] = useState<"loading" | "form" | "error" | "success">("loading");
  const [reason, setReason] = useState<VerifyResetTokenResponse["reason"]>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setReason("invalid");
      return;
    }
    verifyResetToken(token)
      .then((res) => {
        if (res.valid) {
          setStatus("form");
        } else {
          setStatus("error");
          setReason(res.reason);
        }
      })
      .catch(() => {
        setStatus("error");
        setReason("invalid");
      });
  }, [token]);

  const validate = () => {
    const e: typeof errors = {};
    if (password.length < 8) e.password = "Min 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      e.password = "Must include uppercase, lowercase, and a number";
    if (password !== confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setStatus("success");
      toast.success("Password reset! You're now signed in.");
      if (!user) {
        const { useAuth: getAuth } = await import("@/stores");
        await getAuth.getState().checkAuth();
      }
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("This reset link has been used or expired. Please request a new one.");
      setStatus("error");
      setReason("used");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
          <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
        </div>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="h-10 w-10 text-[color:var(--color-destructive)]" />
          <h1 className="text-2xl font-bold">Link invalid or expired</h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            {reason === "expired"
              ? "This reset link has expired. Reset links are valid for 15 minutes."
              : reason === "used"
                ? "This reset link has already been used. Each link can only be used once."
                : "This reset link is invalid. Please check the link or request a new one."}
          </p>
          <Link
            to="/forgot-password"
            className="mt-4 btn-gradient btn-gradient-hover rounded-xl px-6 py-2.5 text-sm font-semibold"
          >
            Request a new link
          </Link>
          <Link to="/login" className="text-sm text-gradient font-semibold mt-2">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-[color:var(--color-success)]" />
          <h1 className="text-2xl font-bold">Password reset!</h1>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold">Set new password</h1>
      <p className="text-muted-foreground mt-1 text-sm">Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="New password" error={errors.password}>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full glass-input rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            />
          </div>
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Reset password
        </button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-gradient font-semibold">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
