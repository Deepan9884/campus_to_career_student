import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Campus to Career AI" }] }),
  component: RegisterPage,
});

function strength(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Too weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-orange-500" },
    { label: "Medium", color: "bg-yellow-500" },
    { label: "Strong", color: "bg-green-500" },
  ] as const;
  return { score: Math.min(s, 3) as 0 | 1 | 2 | 3, ...map[Math.min(s, 3)] };
}

function RegisterPage() {
  const { register, googleLogin, githubLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const st = useMemo(() => strength(pw), [pw]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email";
    if (pw.length < 8) {
      e.pw = "Password must be at least 8 characters long";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw)) {
      e.pw = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    if (pw !== pw2) e.pw2 = "Passwords don't match";
    if (!terms) e.terms = "Please accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    let success = false;
    try {
      await register({ name, email, password: pw });
      toast.success("Account created successfully!");
      success = true;
    } catch (err: unknown) {
      const errObj = err as any;
      let msg = "";
      const fieldErrs: Record<string, string> = {};

      if (errObj?.errors && Array.isArray(errObj.errors) && errObj.errors.length > 0) {
        msg = errObj.errors
          .map((e: any) => {
            const errStr = typeof e === "string" ? e : e?.message || String(e);
            if (e?.field) {
              const fieldName = e.field.replace(/^body\./, "");
              if (fieldName === "password") fieldErrs.pw = errStr;
              else fieldErrs[fieldName] = errStr;
            }
            return errStr;
          })
          .join(". ");
      }
      if (Object.keys(fieldErrs).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrs }));
      }
      if (!msg && err instanceof Error && err.message) {
        msg = err.message;
      }
      if (!msg) {
        msg = "Registration failed. Please try a different email or check credentials.";
      }
      toast.error(msg);
    }
    if (success) {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
      <p className="text-slate-300 mt-1 text-sm">Start your prep journey in 60 seconds.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Field label="Full name" error={errors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 0100"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </Field>
        <Field label="Password" error={errors.pw}>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pw && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full ${st.color} transition-all`}
                  style={{ width: `${((st.score + 1) / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-300 w-16 text-right font-medium">{st.label}</span>
            </div>
          )}
        </Field>
        <Field label="Confirm password" error={errors.pw2}>
          <input
            type={show ? "text" : "password"}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </Field>
        <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 accent-[color:var(--color-primary)] rounded cursor-pointer"
          />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        {errors.terms && (
          <p className="text-xs text-rose-400 font-medium">{errors.terms}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer mt-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </button>
        <p className="text-center text-sm text-slate-400">
          Have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
            Sign in
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
            await googleLogin(cred);
            toast.success("Account created/linked!");
            navigate({ to: "/dashboard" });
          }}
          onGithubSuccess={async (payload) => {
            await githubLogin(payload);
            toast.success("Account created/linked via GitHub!");
            navigate({ to: "/dashboard" });
          }}
        />
      </form>
    </AuthShell>
  );
}
