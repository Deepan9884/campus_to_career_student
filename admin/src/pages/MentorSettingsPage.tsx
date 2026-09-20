import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "../components/GlassCard";
import {
  User as UserIcon,
  Lock,
  Mail,
  ShieldCheck,
  Key,
  Save,
  Loader2,
  CheckCircle2,
  Github,
  Linkedin,
  Bell,
  Check,
  Eye,
  EyeOff,
  Briefcase,
  Sun,
  Moon,
  Laptop,
  Palette,
  LayoutGrid,
  FileSpreadsheet,
  BarChart2,
  AlertTriangle,
  Send,
  Volume2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme, Theme, AccentColor, LayoutDensity } from "../lib/theme-context";
import {
  getMentorProfile,
  updateMentorProfile,
  changeMentorPassword,
} from "../lib/admin-api";

export function MentorSettingsPage() {
  const queryClient = useQueryClient();
  const {
    theme,
    resolvedTheme,
    setTheme,
    accentColor,
    setAccentColor,
    density,
    setDensity,
    mentorPreferences,
    updatePreferences,
  } = useTheme();

  // Settings Active Tab
  const [activeTab, setActiveTab] = useState<
    "appearance" | "notifications" | "data" | "profile" | "security"
  >("appearance");

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [bio, setBio] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Fetch Mentor Profile
  const { data: mentor, isLoading } = useQuery({
    queryKey: ["adminMentorProfile"],
    queryFn: getMentorProfile,
    retry: 1,
    staleTime: 60000,
  });

  useEffect(() => {
    if (mentor) {
      setName(mentor.name || "");
      setEmail(mentor.email || "");
      setTargetRole(mentor.targetRole || "Lead Placement Mentor");
      setBio(mentor.bio || "");
      setGithubUsername(mentor.githubUsername || "");
      setLinkedinUrl(mentor.linkedinUrl || "");
    }
  }, [mentor]);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (payload: any) => updateMentorProfile(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Profile credentials updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminMentorProfile"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update profile credentials");
    },
  });

  // Password Update Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => changeMentorPassword(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update password");
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required");
      return;
    }
    updateProfileMutation.mutate({
      name,
      email,
      targetRole,
      bio,
      githubUsername,
      linkedinUrl,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please enter both current and new passwords");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const tabs = [
    { id: "appearance", label: "Appearance & Theme", icon: Palette },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell },
    { id: "data", label: "Data & Export", icon: FileSpreadsheet },
    { id: "profile", label: "Identity Profile", icon: UserIcon },
    { id: "security", label: "Security & Passcode", icon: Key },
  ] as const;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="elite-panel hero-card-shimmer relative rounded-3xl p-5 sm:p-6 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-72 h-32 pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.12), transparent 70%)" }}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[rgb(var(--primary-rgb)/15%)] text-[var(--primary)] border border-[rgb(var(--primary-rgb)/25%)] flex items-center gap-1 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Mentor Settings Center
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="h-6 w-6 text-[var(--primary)]" />
              <span className="gradient-text-warm">Mentor Preferences</span>{" "}
              <span className="text-[var(--foreground)]">& Control Hub</span>
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 pl-8">
              Manage your account preferences, notifications, and theme settings.
            </p>
          </div>

          {/* Current Active Mode Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[rgba(0,0,0,0.25)] border border-slate-200 dark:border-[var(--border)] shrink-0 self-start md:self-auto">
            <span className="text-xs text-slate-500 dark:text-[var(--muted-foreground)] font-semibold">Active Theme:</span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-[rgb(var(--primary-rgb)/20%)] dark:text-[var(--primary)] dark:border-[rgb(var(--primary-rgb)/30%)] flex items-center gap-1">
              {resolvedTheme === "light" ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-300" />}
              {theme === "system" ? `System (${resolvedTheme})` : resolvedTheme}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-slate-200 dark:border-[var(--border)] no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-[var(--foreground)] hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.06)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Container */}
      <div className="space-y-6">
        {/* TAB 1: APPEARANCE & THEME SETTINGS */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            {/* Theme Selection Section */}
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
                <Palette className="h-5 w-5 text-indigo-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Theme & Color Mode</h3>
                </div>
              </div>

              {/* 3-Way Mode Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Light Card */}
                <div
                  onClick={() => {
                    setTheme("light");
                    toast.success("Switched to Light Mode");
                  }}
                  className={`p-4 rounded-2xl cursor-pointer border-2 transition relative ${
                    theme === "light"
                      ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                      : "border-slate-300 dark:border-white/10 hover:border-indigo-500/50 bg-slate-100 dark:bg-slate-900/60"
                  }`}
                >
                  {theme === "light" && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-500 text-white grid place-items-center text-xs font-bold">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 grid place-items-center mb-3">
                    <Sun className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Light</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Light mode
                  </p>
                </div>

                {/* Dark Card */}
                <div
                  onClick={() => {
                    setTheme("dark");
                    toast.success("Switched to Dark Mode");
                  }}
                  className={`p-4 rounded-2xl cursor-pointer border-2 transition relative ${
                    theme === "dark"
                      ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                      : "border-slate-300 dark:border-white/10 hover:border-indigo-500/50 bg-slate-100 dark:bg-slate-900/60"
                  }`}
                >
                  {theme === "dark" && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-500 text-white grid place-items-center text-xs font-bold">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 grid place-items-center mb-3">
                    <Moon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dark</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Dark mode
                  </p>
                </div>

                {/* System Card */}
                <div
                  onClick={() => {
                    setTheme("system");
                    toast.success("Theme synced to System Preference");
                  }}
                  className={`p-4 rounded-2xl cursor-pointer border-2 transition relative ${
                    theme === "system"
                      ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                      : "border-slate-300 dark:border-white/10 hover:border-indigo-500/50 bg-slate-100 dark:bg-slate-900/60"
                  }`}
                >
                  {theme === "system" && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-500 text-white grid place-items-center text-xs font-bold">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 grid place-items-center mb-3">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">System</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Follow OS settings
                  </p>
                </div>
              </div>

              {/* Accent Color Scheme */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Accent Theme Swatch
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "indigo", label: "Indigo Electric", color: "bg-indigo-600", active: "border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/30" },
                    { id: "purple", label: "Royal Purple", color: "bg-purple-600", active: "border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30" },
                    { id: "emerald", label: "Emerald Growth", color: "bg-emerald-600", active: "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/30" },
                    { id: "amber", label: "Amber Glow", color: "bg-amber-500", active: "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-2 ring-amber-500/30" },
                    { id: "cyan", label: "Ocean Cyan", color: "bg-cyan-500", active: "border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 ring-2 ring-cyan-500/30" },
                  ].map((swatch) => (
                    <button
                      key={swatch.id}
                      onClick={() => {
                        setAccentColor(swatch.id as AccentColor);
                        toast.success(`Accent color set to ${swatch.label}`);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                        accentColor === swatch.id
                          ? swatch.active
                          : "border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${swatch.color} shadow-sm`} />
                      {swatch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Density & Background Controls */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Data Table Density
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDensity("comfortable");
                        toast.success("Comfortable layout density active");
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        density === "comfortable"
                          ? "btn-gradient text-white"
                          : "border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Comfortable Spacing
                    </button>
                    <button
                      onClick={() => {
                        setDensity("compact");
                        toast.success("Compact layout density active");
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        density === "compact"
                          ? "btn-gradient text-white"
                          : "border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Compact High-Density
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-slate-900/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Ambient Glow Background</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Show dynamic blurred background color spheres
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={mentorPreferences.showAmbientGlow}
                    onChange={(e) => {
                      updatePreferences({ showAmbientGlow: e.target.checked });
                      toast.success(
                        e.target.checked ? "Ambient glow enabled" : "Ambient glow disabled"
                      );
                    }}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        )}


        {/* TAB 3: NOTIFICATIONS & ALERTS */}
        {activeTab === "notifications" && (
          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              <Bell className="h-5 w-5 text-indigo-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Email Digest & Alerts</h3>
              </div>
            </div>

            {/* Email Digest Frequency */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Digest Schedule
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { id: "daily", label: "Daily Summary", desc: "Every morning at 8 AM" },
                  { id: "weekly", label: "Weekly Digest", desc: "Every Monday morning" },
                  { id: "off", label: "Disabled", desc: "No scheduled emails" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      updatePreferences({ emailDigest: opt.id as any });
                      toast.success(`Email digest set to: ${opt.label}`);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      mentorPreferences.emailDigest === opt.id
                        ? "border-indigo-500 bg-indigo-500/10 text-slate-900 dark:text-white ring-2 ring-indigo-500/30"
                        : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {mentorPreferences.emailDigest === opt.id && <Check className="h-3.5 w-3.5 text-indigo-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Checkboxes */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Intervention Alerts
              </label>
              <div className="space-y-2">
                {[
                  {
                    key: "notifyOnLowMockScore",
                    label: "Alert when mock interview score is below 60%",
                  },
                  {
                    key: "notifyOnLowResumeScore",
                    label: "Alert when resume score is below 55%",
                  },
                  {
                    key: "notifyOnInactivity",
                    label: "Alert after 5 consecutive days of inactivity",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-white/5 transition"
                  >
                    <input
                      type="checkbox"
                      checked={(mentorPreferences as any)[item.key]}
                      onChange={(e) => {
                        updatePreferences({ [item.key]: e.target.checked });
                        toast.success("Notification preference updated");
                      }}
                      className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {/* TAB 4: DATA & EXPORT DEFAULTS */}
        {activeTab === "data" && (
          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Data Export & Analytics Defaults</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set default report formats and initial roster sorting criteria.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Export Format
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "csv", label: "CSV Spreadsheet" },
                    { id: "pdf", label: "PDF Brief" },
                    { id: "json", label: "JSON Telemetry" },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => {
                        updatePreferences({ defaultExportFormat: fmt.id as any });
                        toast.success(`Default export format set to ${fmt.label}`);
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        mentorPreferences.defaultExportFormat === fmt.id
                          ? "btn-gradient text-white"
                          : "border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Roster View Filter
                </label>
                <select
                  value={mentorPreferences.defaultCohortFilter}
                  onChange={(e) => {
                    updatePreferences({ defaultCohortFilter: e.target.value });
                    toast.success("Default cohort filter saved");
                  }}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="my-mentees">My Assigned Mentees Only</option>
                  <option value="all">All Registered Students</option>
                  <option value="at-risk">At-Risk Intervention Students</option>
                  <option value="top-performer">Top Performers</option>
                </select>
              </div>
            </div>
          </GlassCard>
        )}

        {/* TAB 5: IDENTITY PROFILE CREDENTIALS */}
        {activeTab === "profile" && (
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              <UserIcon className="h-5 w-5 text-indigo-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Identity & Contact Credentials</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your mentor public profile & contact information</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Mentor Name"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mentor Account Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mentor@campustocareer.ai"
                      className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mentor Title / Specialization
                  </label>
                  <div className="relative">
                    <Briefcase className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="Lead Placement Mentor / Full Stack Specialist"
                      className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    GitHub Username
                  </label>
                  <div className="relative">
                    <Github className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="mentor-github"
                      className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Professional Bio / Mentorship Statement
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your technical background, office hours, and placement guidance focus..."
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Profile Credentials
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* TAB 6: SECURITY & PASSCODE */}
        {activeTab === "security" && (
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              <Key className="h-5 w-5 text-purple-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Passcode & Security Credentials</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your mentor workspace sign-in password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input rounded-xl pl-9 pr-10 py-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters..."
                      className="w-full glass-input rounded-xl pl-9 pr-10 py-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password..."
                      className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-purple-500/25 transition disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  Update Password Credentials
                </button>
              </div>
            </form>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
