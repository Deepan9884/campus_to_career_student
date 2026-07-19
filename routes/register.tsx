import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores";
import { GoogleLogin } from "@react-oauth/google";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — CareerForge AI" }] }),
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
  const { register, googleLogin, isLoading } = useAuth();
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
    if (st.score < 3) e.pw = "Use 8+ chars, mixed case, and a number";
    if (pw !== pw2) e.pw2 = "Passwords don't match";
    if (!terms) e.terms = "Please accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await register({ name, email, password: pw });
      toast.success("Account created!");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && "errors" in err && Array.isArray((err as any).errors)
          ? (err as any).errors.map((e: { message: string }) => e.message).join(". ")
          : err instanceof Error
            ? err.message
            : "Registration failed";
      toast.error(msg);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="text-muted-foreground mt-1 text-sm">Start your prep journey in 60 seconds.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Field label="Full name" error={errors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 0100"
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
          />
        </Field>
        <Field label="Password" error={errors.pw}>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full glass-input rounded-xl px-3 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
              <span className="text-xs text-muted-foreground w-16 text-right">{st.label}</span>
            </div>
          )}
        </Field>
        <Field label="Confirm password" error={errors.pw2}>
          <input
            type={show ? "text" : "password"}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
          />
        </Field>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 accent-[color:var(--color-primary)]"
          />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        {errors.terms && (
          <p className="text-xs text-[color:var(--color-destructive)]">{errors.terms}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Have an account?{" "}
          <Link to="/login" className="text-gradient font-semibold">
            Sign in
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
                  toast.success("Account linked/created!");
                  navigate({ to: "/dashboard" });
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : "Google signup failed");
                }
              }
            }}
            onError={() => {
              toast.error("Google signup failed");
            }}
            theme="filled_black"
            shape="pill"
            width="100%"
            text="signup_with"
          />
        </div>
      </form>
    </AuthShell>
  );
}
