import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Campus to Career AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, googleLogin, githubLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email";
    if (password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message ? err.message : "Login failed";
      toast.error(msg);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-1 text-sm">Sign in to continue your prep journey.</p>
      <form onSubmit={handle} className="mt-6 space-y-4">
        <Field label="Email" error={errors.email}>
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
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[color:var(--color-primary)]"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-[color:var(--color-primary)] hover:underline">
            Forgot?
          </Link>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="text-gradient font-semibold">
            Create an account
          </Link>
        </p>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0f172a] px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <SocialAuthButtons
          isLoading={isLoading}
          onGoogleSuccess={async (cred) => {
            await googleLogin(cred);
            toast.success("Welcome back!");
            navigate({ to: "/dashboard" });
          }}
          onGithubSuccess={async (payload) => {
            await githubLogin(payload);
            toast.success("Welcome back via GitHub!");
            navigate({ to: "/dashboard" });
          }}
        />
      </form>
    </AuthShell>
  );
}

import { AuthShell } from "@/components/AuthShell";
export { AuthShell };

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-xs text-[color:var(--color-destructive)] mt-1">{error}</p>}
    </div>
  );
}
