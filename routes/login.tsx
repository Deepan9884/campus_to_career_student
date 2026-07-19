import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores";
import { GoogleLogin } from "@react-oauth/google";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — CareerForge AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, googleLogin, isLoading } = useAuth();
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
      toast.error(err instanceof Error ? err.message : "Login failed");
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

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  await googleLogin(credentialResponse.credential);
                  toast.success("Welcome back!");
                  navigate({ to: "/dashboard" });
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : "Google login failed");
                }
              }
            }}
            onError={() => {
              toast.error("Google login failed");
            }}
            theme="filled_black"
            shape="pill"
            width="100%"
          />
        </div>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl btn-gradient grid place-items-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-xl">CareerForge AI</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight">
            Become <span className="text-gradient">internship-ready</span>
            <br /> in weeks, not months.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md">
            ATS-scored resumes, AI mock interviews, GitHub project reviews, and a personalized
            roadmap — all in one place.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {["10k+ resumes", "50k+ interviews", "200+ roles"].map((s) => (
              <div key={s} className="glass rounded-xl p-3 text-center text-xs text-slate-200">
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">© 2024 CareerForge AI</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="glass-strong rounded-2xl p-8 w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

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
