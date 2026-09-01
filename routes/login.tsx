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
      const res = await login(email, password);
      const isNew =
        res?.isNewUser ||
        (res?.user?.createdAt && Date.now() - new Date(res.user.createdAt).getTime() < 60000);
      if (isNew) {
        toast.success(`Welcome to Campus to Career AI, ${res?.user?.name || "Student"}! 🚀`);
      } else {
        toast.success(`Welcome back, ${res?.user?.name || "Student"}!`);
      }
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message ? err.message : "Login failed";
      toast.error(msg);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
      <p className="text-slate-300 mt-1 text-sm">Sign in to continue your prep journey.</p>
      <form onSubmit={handle} className="mt-6 space-y-4">
        <Field label="Email" error={errors.email}>
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
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[color:var(--color-primary)] rounded cursor-pointer"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
            Forgot?
          </Link>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
        <p className="text-center text-sm text-slate-400">
          New here?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
            Create an account
          </Link>
        </p>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/80"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0f172a] px-3 text-slate-400 font-medium">Or continue with</span>
          </div>
        </div>

        <SocialAuthButtons
          isLoading={isLoading}
          onGoogleSuccess={async (cred) => {
            const res = await googleLogin(cred);
            const isNew =
              res?.isNewUser ||
              (res?.user?.createdAt && Date.now() - new Date(res.user.createdAt).getTime() < 60000);
            if (isNew) {
              toast.success(`Welcome to Campus to Career AI, ${res?.user?.name || "Student"}! 🚀`);
            } else {
              toast.success(`Welcome back, ${res?.user?.name || "Student"}!`);
            }
            navigate({ to: "/dashboard" });
          }}
          onGithubSuccess={async (payload) => {
            const res = await githubLogin(payload);
            const isNew =
              res?.isNewUser ||
              (res?.user?.createdAt && Date.now() - new Date(res.user.createdAt).getTime() < 60000);
            if (isNew) {
              toast.success(`Welcome to Campus to Career AI, ${res?.user?.name || "Student"}! 🚀`);
            } else {
              toast.success(`Welcome back, ${res?.user?.name || "Student"}!`);
            }
            navigate({ to: "/dashboard" });
          }}
        />

        {/* Mentor / Faculty Portal Cross-Link */}
        <div className="pt-3 border-t border-slate-800/80 text-center">
          <a
            href={import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:8081"}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-1.5 transition"
          >
            <span>Are you a Faculty Mentor? Go to Mentor Portal</span>
            <span>&rarr;</span>
          </a>
        </div>
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
      <label className="text-xs font-semibold text-slate-200 mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-400 font-medium mt-1">{error}</p>}
    </div>
  );
}
