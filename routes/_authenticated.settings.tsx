import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import {
  Moon,
  Sun,
  Monitor,
  Camera,
  Github,
  Shield,
  Link as LinkIcon,
  Download,
  LogOut,
  Key,
  CheckCircle2,
  SlidersHorizontal,
  FileText,
  Target,
  EyeOff,
  Mic,
  Map,
  BarChart3,
  X,
  Lock,
  Save,
  Trophy,
  Linkedin,
} from "lucide-react";
import { useAuth } from "@/stores";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  forgotPassword,
  logoutAllSessions,
  exportUserData,
  generate2FA,
  verify2FA,
  disable2FA,
} from "@/lib/auth-api";
import { getAllCodingProfiles } from "@/lib/coding-profiles-api";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Campus to Career AI" }] }),
  component: SettingsPage,
});

const MODULES = [
  { key: "/events", label: "Events & Proofs", icon: Trophy },
  { key: "/resume", label: "Resume Analyzer", icon: FileText },
  { key: "/interview", label: "Mock Interview", icon: Mic },
  { key: "/github", label: "GitHub Projects", icon: Github },
  { key: "/linkedin-posts", label: "LinkedIn Post Ideas", icon: Linkedin },
  { key: "/skills", label: "Skill Gap Analysis", icon: Target },
  { key: "/roadmap", label: "Learning Roadmap", icon: Map },
  { key: "/coding-platforms", label: "Coding Platforms", icon: BarChart3 },
  { key: "/analytics", label: "Analytics", icon: BarChart3 },
];

function SettingsPage() {
  const { user, updateUser, isCheckingAuth, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // 2FA state
  const [qrCode, setQrCode] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  // Linked profiles
  const [linkedProfiles, setLinkedProfiles] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    location: "",
    targetRole: "",
    githubUsername: "",
    avatar: "",
  });

  const [preferences, setPreferences] = useState<{
    theme: "dark" | "light" | "system";
    notifyOn: string[];
    emailDigest: "off" | "daily" | "weekly";
    aiDifficulty: "Beginner" | "Intermediate" | "Advanced";
    preferredLanguage: string;
    resumePrivacy: boolean;
    dailyGoalProblems: number;
    hiddenModules: string[];
  }>({
    theme:
      typeof document !== "undefined" && document.documentElement.classList.contains("light")
        ? "light"
        : "dark",
    notifyOn: MODULES.map((m) => m.key),
    emailDigest: "off",
    aiDifficulty: "Intermediate",
    preferredLanguage: "Python",
    resumePrivacy: false,
    dailyGoalProblems: 2,
    hiddenModules: [],
  });

  // Fetch linked accounts
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const res = await getAllCodingProfiles();
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        setLinkedProfiles(list);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfiles();
  }, []);

  // Load state from user object
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        bio: user.profile?.bio ?? "",
        location: user.profile?.location ?? "",
        targetRole: user.profile?.targetRole ?? user.targetRole ?? "",
        githubUsername: user.profile?.githubUsername ?? user.githubUsername ?? "",
        avatar: user.avatar ?? "",
      });
      if (user.preferences) {
        setPreferences((prev) => {
          let resolvedTheme = prev.theme;
          if (typeof window !== "undefined" && !(window as any).__theme_initialized) {
            resolvedTheme = user.preferences!.theme || "dark";
            (window as any).__theme_initialized = true;
          }
          return {
            theme: resolvedTheme as "dark" | "light" | "system",
            notifyOn: user.preferences!.notifyOn || prev.notifyOn,
            emailDigest: user.preferences!.emailDigest || "off",
            aiDifficulty: (user.preferences!.aiDifficulty as any) || "Intermediate",
            preferredLanguage: user.preferences!.preferredLanguage || "Python",
            resumePrivacy: user.preferences!.resumePrivacy || false,
            dailyGoalProblems: user.preferences!.dailyGoalProblems || 2,
            hiddenModules: user.preferences!.hiddenModules || [],
          };
        });
      }
    }
    setLoading(false);
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    const theme = preferences.theme;
    const root = document.documentElement;

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("c2c_theme", theme);
    }

    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
      root.classList.toggle("light", theme === "light");
    }
  }, [preferences.theme]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAvatarPreview(b64);
      setForm((f) => ({ ...f, avatar: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        targetRole: form.targetRole,
        githubUsername: form.githubUsername,
        profile: {
          targetRole: form.targetRole,
          githubUsername: form.githubUsername,
          bio: form.bio,
          location: form.location,
        },
      };

      if (
        form.avatar &&
        (form.avatar.startsWith("data:image/") ||
          form.avatar.startsWith("http://") ||
          form.avatar.startsWith("https://"))
      ) {
        payload.avatar = form.avatar;
      }

      await updateUser({ ...payload, preferences });
      toast.success("Settings saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await forgotPassword(user.email);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    }
  };

  const handleExportData = async () => {
    try {
      const blob = await exportUserData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campustocareer_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Data exported successfully!");
    } catch (e: any) {
      toast.error("Failed to export data");
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAllSessions();
      toast.success("Logged out of all other sessions");
    } catch (e: any) {
      toast.error("Failed to logout of other sessions");
    }
  };

  const handleGenerate2FA = async () => {
    try {
      const res: any = await generate2FA();
      setQrCode(res.data.qrCode);
      setIs2FAModalOpen(true);
    } catch (e: any) {
      toast.error("Failed to generate 2FA");
    }
  };

  const handleVerify2FA = async () => {
    try {
      await verify2FA(twoFactorCode);
      toast.success("2FA enabled successfully!");
      setIs2FAModalOpen(false);
      checkAuth();
    } catch (e: any) {
      toast.error(e.message || "Invalid code");
    }
  };

  const handleDisable2FA = async () => {
    try {
      await disable2FA();
      toast.success("2FA disabled");
      checkAuth();
    } catch (e: any) {
      toast.error("Failed to disable 2FA");
    }
  };

  const toggleVisibility = async (moduleKey: string) => {
    const isHidden = preferences.hiddenModules.includes(moduleKey);
    const updatedHidden = isHidden
      ? preferences.hiddenModules.filter((k) => k !== moduleKey)
      : [...preferences.hiddenModules, moduleKey];

    const updatedPrefs = { ...preferences, hiddenModules: updatedHidden };
    setPreferences(updatedPrefs);

    try {
      await updateUser({ preferences: updatedPrefs });
      toast.success(isHidden ? "Module shown in sidebar" : "Module hidden from sidebar");
    } catch (err: any) {
      console.error("Failed to update sidebar preference:", err);
      toast.error(err?.message || "Failed to update sidebar preference");
    }
  };

  if (loading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin text-muted-foreground border-2 border-slate-400/20 rounded-full border-t-[color:var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin border-2 border-white/20 border-t-white rounded-full" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Profile Section */}
          <GlassCard>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg text-black dark:text-white">
              <Monitor className="h-5 w-5 text-brand-400" /> Account Details
            </h3>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user?.avatar}
                    alt=""
                    className="h-16 w-16 rounded-full ring-2 ring-black/10 dark:ring-white/30 object-cover bg-black/5 dark:bg-black/50"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full ring-2 ring-black/10 dark:ring-white/30 bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-xl font-bold text-black dark:text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  type="button"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-brand-500 rounded-full text-white hover:bg-brand-600 transition shadow-sm"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileRef}
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="font-medium text-black dark:text-white">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Display Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-muted/50 dark:bg-black/30 border border-border dark:border-white/10 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Target Role</label>
                <input
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  className="w-full bg-muted/50 dark:bg-black/30 border border-border dark:border-white/10 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g. Frontend Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full bg-muted/50 dark:bg-black/30 border border-border dark:border-white/10 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[80px]"
                  placeholder="A short bio about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2 text-foreground">
                  <Github className="h-4 w-4" /> GitHub Username
                </label>
                <input
                  value={form.githubUsername}
                  onChange={(e) => setForm({ ...form, githubUsername: e.target.value })}
                  className="w-full bg-muted/50 dark:bg-black/30 border border-border dark:border-white/10 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="username"
                />
              </div>
            </div>
          </GlassCard>

          {/* Connected Coding Profiles */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg text-foreground">
                <LinkIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> Linked Accounts
              </h3>
              <Link
                to="/coding-platforms"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
              >
                Manage Profiles →
              </Link>
            </div>

            {linkedProfiles.length > 0 ? (
              <div className="space-y-3">
                {linkedProfiles.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border dark:border-white/10 bg-muted/40 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm capitalize text-foreground flex items-center gap-2">
                          {p.platform}
                          {p.cachedStats?.solved !== undefined && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                              {p.cachedStats.solved} solved
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">@{p.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No coding profiles linked yet.</p>
                <Link
                  to="/coding-platforms"
                  className="btn-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white inline-block"
                >
                  Connect Coding Profiles
                </Link>
              </div>
            )}
          </GlassCard>

          {/* Goals */}
          <GlassCard>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg text-foreground">
              <Target className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> Daily Goals
            </h3>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Target Problems per Day</label>
              <input
                type="number"
                min="1"
                max="50"
                value={preferences.dailyGoalProblems}
                onChange={(e) => setPreferences({ ...preferences, dailyGoalProblems: Number(e.target.value) })}
                className="w-full bg-muted/50 dark:bg-black/30 border border-border dark:border-white/10 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <p className="text-xs text-muted-foreground mt-2">Set a daily goal for problems solved across all platforms.</p>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          {/* AI Preferences */}
          <GlassCard>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg text-foreground">
              <SlidersHorizontal className="h-5 w-5 text-indigo-500 dark:text-fuchsia-400" /> AI Preferences
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">AI Recommendation Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setPreferences({ ...preferences, aiDifficulty: level as any })}
                      className={cn(
                        "py-2 rounded-lg text-sm transition-all border font-semibold",
                        preferences.aiDifficulty === level
                          ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-300"
                          : "bg-muted/40 dark:bg-black/20 border-border dark:border-white/5 hover:bg-muted dark:hover:bg-white/5 text-muted-foreground"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Preferred Language (Interviews & Tips)</label>
                <input
                  value={preferences.preferredLanguage}
                  onChange={(e) => setPreferences({ ...preferences, preferredLanguage: e.target.value })}
                  className="w-full bg-muted/50 dark:bg-black/30 border border-border dark:border-white/10 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g. Python, Java, C++"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border dark:border-white/5 bg-muted/40 dark:bg-black/20 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm flex items-center gap-2 text-foreground"><Lock className="w-3 h-3 text-indigo-500"/> Resume Privacy Mode</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Don't use my resume context for global AI suggestions.
                    </p>
                  </div>
                  <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={preferences.resumePrivacy}
                      onChange={(e) => setPreferences({ ...preferences, resumePrivacy: e.target.checked })}
                    />
                    <div className={cn("h-5 w-9 rounded-full transition-colors", preferences.resumePrivacy ? "bg-indigo-600" : "bg-black/20 dark:bg-white/10")}></div>
                    <div className={cn("absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white transition-transform", preferences.resumePrivacy ? "translate-x-4" : "")}></div>
                  </div>
                </label>
              </div>
            </div>
          </GlassCard>

          {/* Theme & Appearance */}
          <GlassCard>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg text-foreground">
              <Sun className="h-5 w-5 text-amber-500" /> Appearance
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "light", icon: Sun, label: "Light" },
                { id: "dark", icon: Moon, label: "Dark" },
                { id: "system", icon: Monitor, label: "System" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setPreferences({ ...preferences, theme: id as any })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    preferences.theme === id
                      ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "bg-muted/40 dark:bg-black/20 border-border dark:border-white/5 hover:bg-muted dark:hover:bg-white/5 text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Sidebar Modules */}
          <GlassCard>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg text-foreground">
              <EyeOff className="h-5 w-5 text-cyan-500 dark:text-cyan-400" /> Sidebar Visibility
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Toggle which modules appear in your sidebar navigation.</p>
            <div className="space-y-2">
              {MODULES.map((mod) => {
                const isVisible = !preferences.hiddenModules.includes(mod.key);
                return (
                  <label key={mod.key} className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-white/5 hover:bg-muted/50 dark:hover:bg-white/5 cursor-pointer transition">
                    <div className="flex items-center gap-3">
                      <mod.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{mod.label}</span>
                    </div>
                    <div className="relative inline-flex h-5 w-9 items-center justify-center rounded-full">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isVisible}
                        onChange={() => toggleVisibility(mod.key)}
                      />
                      <div className={cn("h-5 w-9 rounded-full transition-colors", isVisible ? "bg-brand-500" : "bg-black/20 dark:bg-white/10")}></div>
                      <div className={cn("absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white transition-transform", isVisible ? "translate-x-4" : "")}></div>
                    </div>
                  </label>
                );
              })}
            </div>
          </GlassCard>

          {/* Security & Data */}
          <GlassCard className="border-red-500/20 bg-red-500/5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
              <Shield className="h-5 w-5" /> Security & Data
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportData}
                  className="flex-1 flex items-center justify-center gap-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-black dark:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  <Download className="h-4 w-4" /> Export Data
                </button>
                <button
                  onClick={handleResetPassword}
                  className="flex-1 flex items-center justify-center gap-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-black dark:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  <Key className="h-4 w-4" /> Change Password
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLogoutAll}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-700 dark:text-red-200 px-4 py-2.5 rounded-xl text-sm font-medium transition border border-red-200 dark:border-red-500/30"
                >
                  <LogOut className="h-4 w-4" /> Logout All Devices
                </button>
                
                {user?.is2FAEnabled ? (
                  <button
                    onClick={handleDisable2FA}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-700 dark:text-red-200 px-4 py-2.5 rounded-xl text-sm font-medium transition border border-red-200 dark:border-red-500/30"
                  >
                    <Shield className="h-4 w-4" /> Disable 2FA
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate2FA}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-200 px-4 py-2.5 rounded-xl text-sm font-medium transition border border-emerald-200 dark:border-emerald-500/30"
                  >
                    <Shield className="h-4 w-4" /> Enable 2FA
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
      
      {/* 2FA Setup Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-strong bg-white dark:bg-transparent p-6 rounded-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-black dark:text-white">Setup 2FA</h3>
              <button onClick={() => setIs2FAModalOpen(false)} className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Scan the QR code below with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit code.
            </p>
            {qrCode && (
              <div className="flex justify-center mb-6 bg-white p-4 rounded-xl">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-center tracking-widest font-mono text-xl text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 mb-4"
              maxLength={6}
            />
            <button
              onClick={handleVerify2FA}
              disabled={twoFactorCode.length < 6}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 rounded-xl text-white font-medium transition disabled:opacity-50"
            >
              Verify & Enable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}