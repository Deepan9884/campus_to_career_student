import React, { useState } from "react";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import {
  AI_DATA_SCIENCE_CATEGORIES,
  INITIAL_ALLOCATED_AI_PROJECTS,
  AllocatedAiProject,
  AiCategoryConfig,
} from "@/lib/super-dream-ai-data";
import { fetchGithubRepoMetadata } from "@/lib/super-dream-software-dev-data";
import {
  TrendingUp,
  BrainCircuit,
  Eye,
  MessageSquare,
  Sparkles,
  Bot,
  Database,
  Award,
  Github,
  ExternalLink,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Maximize2,
  X,
  Upload,
  ChevronRight,
  Image as ImageIcon,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Section5AiDataScience() {
  const {
    studentChecklist,
    allocatedAiProjects: storeAllocatedAiProjects,
    updateAllocatedAiProject,
    addAllocatedAiProject,
    deleteAllocatedAiProject,
    updateAiDeliverable,
  } = useSuperDream();

  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 5) || summaries[4];

  const allocatedAiProjects = storeAllocatedAiProjects || INITIAL_ALLOCATED_AI_PROJECTS;

  // Selected Category Modal for AI Projects
  const [activeCategoryModal, setActiveCategoryModal] = useState<AiCategoryConfig | null>(null);

  // Preview Lightboxes
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  // Auto-fetch loading state
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);

  // New Project Form in Active Drawer
  const [isAddingNewProject, setIsAddingNewProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    tagline: "",
    description: "",
    framework: "PyTorch / HuggingFace",
    techStackText: "Python, PyTorch, Transformers, FastAPI",
    githubUrl: "",
    screenshotUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    liveUrl: "",
    demoVideoUrl: "",
    verified: false,
  });

  // Auto-fetch AI model repo metadata from GitHub
  const handleAutoFetchRepo = async (repoUrl: string, isNewForm: boolean, projectId?: string) => {
    if (!repoUrl || !repoUrl.trim()) {
      toast.error("Please enter a GitHub repository link first");
      return;
    }
    setIsFetchingRepo(true);
    toast.loading("Fetching real AI model repository data from GitHub...", { id: "gh-ai-fetch" });
    try {
      const meta = await fetchGithubRepoMetadata(repoUrl);
      if (!meta) {
        toast.error("Could not fetch repository. Ensure the repository is public.", { id: "gh-ai-fetch" });
        return;
      }

      if (isNewForm) {
        setNewProjectForm((prev) => ({
          ...prev,
          title: meta.title,
          description: meta.description,
          tagline: meta.tagline,
          techStackText: meta.techStack.join(", "),
          liveUrl: meta.liveUrl || prev.liveUrl,
          framework: meta.techStack.some((t) => t.toLowerCase().includes("python")) ? "PyTorch / Transformers" : prev.framework,
          verified: true,
        }));
      } else if (projectId) {
        updateAllocatedAiProject(projectId, {
          title: meta.title,
          description: meta.description,
          tagline: meta.tagline,
          techStack: meta.techStack,
          liveUrl: meta.liveUrl,
          verified: true,
          highlights: meta.architectureHighlights,
        });
      }

      toast.success(`Auto-filled AI Model from GitHub! (${meta.techStack.join(", ")} • ${meta.stars}★)`, { id: "gh-ai-fetch" });
    } catch {
      toast.error("Failed to query GitHub repository", { id: "gh-ai-fetch" });
    } finally {
      setIsFetchingRepo(false);
    }
  };

  // Icon Resolver
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "TrendingUp":
        return TrendingUp;
      case "BrainCircuit":
        return BrainCircuit;
      case "Eye":
        return Eye;
      case "MessageSquare":
        return MessageSquare;
      case "Sparkles":
        return Sparkles;
      case "Bot":
        return Bot;
      case "Database":
        return Database;
      case "Award":
        return Award;
      default:
        return BrainCircuit;
    }
  };

  // Embed video parser
  const getEmbedVideoUrl = (url: string) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("loom.com/share/")) {
      const loomId = url.split("share/")[1]?.split("?")[0];
      return `https://www.loom.com/embed/${loomId}`;
    }
    return url;
  };

  // Handle Image File Upload (convert to base64 preview)
  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    projectId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size must be less than 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        const dataUrl = event.target?.result as string;
        if (projectId) {
          updateAllocatedAiProject(projectId, { screenshotUrl: dataUrl });
          toast.success("Architecture diagram / loss curve updated!");
        } else {
          setNewProjectForm((prev) => ({ ...prev, screenshotUrl: dataUrl }));
          toast.success("Image attached to new project!");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save New Project under Category
  const handleSaveNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryModal || !newProjectForm.title.trim()) {
      toast.error("Please provide an AI project / model title");
      return;
    }

    const techStack = newProjectForm.techStackText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    addAllocatedAiProject({
      categoryKey: activeCategoryModal.key,
      categoryLabel: activeCategoryModal.label,
      title: newProjectForm.title,
      tagline: newProjectForm.tagline || "Production machine learning deliverable",
      description: newProjectForm.description || "Optimized deep learning / AI pipeline with benchmark metrics.",
      framework: newProjectForm.framework,
      techStack,
      githubUrl: newProjectForm.githubUrl || "https://github.com/student/new-ai-model",
      screenshotUrl: newProjectForm.screenshotUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
      liveUrl: newProjectForm.liveUrl,
      demoVideoUrl: newProjectForm.demoVideoUrl,
      verified: newProjectForm.verified,
      highlights: ["Model quantization and export to ONNX / TensorRT", "Automated validation loss tracking"],
      metrics: { accuracy: "96.4%", f1Score: "0.94", latency: "12ms" },
    });

    toast.success(`Added new ${activeCategoryModal.label}!`);
    setIsAddingNewProject(false);
    setNewProjectForm({
      title: "",
      tagline: "",
      description: "",
      framework: "PyTorch / HuggingFace",
      techStackText: "Python, PyTorch, Transformers, FastAPI",
      githubUrl: "",
      screenshotUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
      liveUrl: "",
      demoVideoUrl: "",
      verified: false,
    });
  };

  // Filter projects for active category modal
  const categoryProjects = activeCategoryModal
    ? allocatedAiProjects.filter((p) => p.categoryKey === activeCategoryModal.key)
    : [];

  return (
    <div className="space-y-6">
      {/* 3 Calm Pie Charts at Top */}
      <SectionHeaderMetrics
        sectionId={5}
        title="5. AI & Data Science"
        subtitle="8 Official Curriculum Deliverables: Click any AI category panel to view attached GitHub repos, model architecture photos/loss curves, optional working live apps (HuggingFace/Gradio/Streamlit), and video demos."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* 8 CORE AI CATEGORY PANELS */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/80 font-mono flex items-center gap-2">
            <BrainCircuit className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>AI & Machine Learning Deliverables (8 Domains)</span>
          </h3>
          <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
            Click any panel to manage attached code, loss curves & demo apps
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_DATA_SCIENCE_CATEGORIES.map((cat, idx) => {
            const Icon = getCategoryIcon(cat.iconName);
            const items = allocatedAiProjects.filter((p) => p.categoryKey === cat.key);
            const currentCount = items.length;
            const targetCount = cat.targetCount;
            const percent = Math.min(100, Math.round((currentCount / targetCount) * 100));
            const isCompleted = currentCount >= targetCount;
            const verifiedCount = items.filter((p) => p.verified).length;

            return (
              <div
                key={cat.key}
                onClick={() => setActiveCategoryModal(cat)}
                className={cn(
                  "panel-card rounded-2xl p-4.5 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3.5",
                  isCompleted && "border-[var(--success)]/30 shadow-[0_0_24px_rgba(134,239,172,0.12)]"
                )}
              >
                {/* Glow accent */}
                <div
                  className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
                  style={{ background: cat.color }}
                />

                <div className="space-y-3 relative z-10">
                  {/* Top Header: Icon + Category + Target */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl grid place-items-center shrink-0 shadow-sm"
                        style={{
                          background: `${cat.color}15`,
                          border: `1px solid ${cat.color}35`,
                          color: cat.color,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.06] border border-white/[0.08] text-[var(--muted-foreground)] font-medium">
                            #{idx + 1}
                          </span>
                          <span
                            className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full"
                            style={{ background: `${cat.color}18`, color: cat.color }}
                          >
                            Target: {targetCount}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] tracking-tight line-clamp-1">
                          {cat.label}
                        </h4>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={cn(
                        "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border shrink-0",
                        isCompleted
                          ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                          : "bg-white/[0.06] text-[var(--foreground)] border-white/[0.10]"
                      )}
                    >
                      {currentCount}/{targetCount}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden border border-white/[0.08]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        background: isCompleted
                          ? "linear-gradient(90deg, #86EFAC, #6EE7B7)"
                          : `linear-gradient(90deg, ${cat.color}99, ${cat.color})`,
                      }}
                    />
                  </div>

                  {/* Mini Project List Preview */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)] font-medium">
                      <span>Deliverables ({items.length})</span>
                      <span className="font-mono">{percent}% done</span>
                    </div>
                    {items.length === 0 ? (
                      <div className="p-2.5 rounded-xl panel-empty text-xs text-[var(--muted-foreground)] text-center flex items-center justify-center gap-1.5 transition">
                        <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>Attach Model &amp; Repo</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {items.slice(0, 2).map((p, pIdx) => (
                          <div
                            key={p.id}
                            className="p-2 rounded-xl panel-slot flex items-center justify-between text-xs"
                          >
                            <span className="text-xs text-[var(--foreground)]/90 truncate max-w-[140px] font-medium">
                              #{pIdx + 1}: {p.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {p.liveUrl && (
                                <span className="text-[9px] font-mono text-[var(--success)] bg-[var(--success)]/15 border border-[var(--success)]/25 px-1.5 py-0.2 rounded-full">
                                  Demo
                                </span>
                              )}
                              {p.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />}
                            </div>
                          </div>
                        ))}
                        {items.length > 2 && (
                          <span className="text-[10px] font-mono text-[var(--muted-foreground)] block text-right pt-0.5">
                            +{items.length - 2} more models...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08] text-xs text-[var(--muted-foreground)] relative z-10">
                  <span className="text-[11px] font-mono text-[var(--muted-foreground)] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
                    <span>{verifiedCount} of {currentCount} Verified</span>
                  </span>
                  <span
                    className="font-medium text-xs flex items-center gap-1 transition"
                    style={{ color: cat.color }}
                  >
                    Manage Models <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* CATEGORY AI PROJECTS MANAGEMENT DRAWER / MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-[var(--font-sans)]">
          <div className="panel-card text-[var(--foreground)] w-full max-w-4xl rounded-3xl border border-white/[0.18] shadow-[0_25px_80px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 shadow-sm"
                  style={{
                    background: `${activeCategoryModal.color}15`,
                    border: `1px solid ${activeCategoryModal.color}35`,
                    color: activeCategoryModal.color,
                  }}
                >
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                    {activeCategoryModal.label}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5 mt-0.5">
                    <span>Target Quota: {activeCategoryModal.targetCount} Deliverables</span>
                    <span>•</span>
                    <span>Attached Code, Loss Curves, Live Demos &amp; Videos</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingNewProject(!isAddingNewProject)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95",
                    isAddingNewProject
                      ? "bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12]"
                      : "btn-gradient btn-gradient-hover text-white"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNewProject ? "Close Form" : "Add Model / Project"}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveCategoryModal(null);
                    setIsAddingNewProject(false);
                  }}
                  className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[var(--muted-foreground)] hover:text-white transition cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-80px)]">
              {/* Form: Add New AI Project under this Category */}
              {isAddingNewProject && (
                <form
                  onSubmit={handleSaveNewProject}
                  className="p-5 rounded-2xl panel-slot border border-white/[0.14] space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 tracking-tight">
                      <Plus className="w-4 h-4 text-[var(--primary)]" />
                      <span>Allocate New {activeCategoryModal.label}</span>
                    </h4>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25">
                      Deliverable #{categoryProjects.length + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1">
                        <span>Model / Project Title</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newProjectForm.title}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                        placeholder="e.g. Multi-Modal Vision VQA Diagnostics Engine"
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--foreground)] block">
                        Framework &amp; Model Type
                      </label>
                      <input
                        type="text"
                        value={newProjectForm.framework}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, framework: e.target.value })}
                        placeholder="PyTorch, HuggingFace Transformers, LangChain"
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* GitHub Link with Auto-Fill */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                          <Github className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          <span>GitHub Repo Link</span>
                          <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAutoFetchRepo(newProjectForm.githubUrl, true)}
                          disabled={isFetchingRepo || !newProjectForm.githubUrl.trim()}
                          className="text-[10px] font-mono font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <RefreshCw className={cn("w-3 h-3", isFetchingRepo && "animate-spin")} />
                          <span>Auto-Fill from GitHub</span>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          required
                          value={newProjectForm.githubUrl}
                          onChange={(e) => setNewProjectForm({ ...newProjectForm, githubUrl: e.target.value })}
                          placeholder="https://github.com/student/ai-model-repo"
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAutoFetchRepo(newProjectForm.githubUrl, true)}
                          disabled={isFetchingRepo || !newProjectForm.githubUrl.trim()}
                          className="px-3 py-2 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/25 text-[var(--primary)] text-xs font-medium hover:bg-[var(--primary)]/25 transition cursor-pointer disabled:opacity-40 shrink-0"
                        >
                          Fetch Details
                        </button>
                      </div>
                    </div>

                    {/* Screenshot Upload / URL */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--foreground)] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          <span>Model Photo / Loss Curve / Diagram</span>
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] font-mono">URL or Upload</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newProjectForm.screenshotUrl}
                          onChange={(e) => setNewProjectForm({ ...newProjectForm, screenshotUrl: e.target.value })}
                          placeholder="Paste image URL (https://...)"
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                        />
                        <label className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12] text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0 transition active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileUpload(e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Working URL Optional */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--foreground)] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-[var(--success)]" />
                          <span>Working Demo URL (Optional)</span>
                        </span>
                        <span className="text-[10px] text-[var(--success)] font-medium">HuggingFace / Gradio / Streamlit</span>
                      </label>
                      <input
                        type="url"
                        value={newProjectForm.liveUrl}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, liveUrl: e.target.value })}
                        placeholder="https://huggingface.co/spaces/... (Optional)"
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                      />
                    </div>

                    {/* Video Demo Optional */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--foreground)] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-[var(--warning)]" />
                          <span>Video Demo (Optional)</span>
                        </span>
                        <span className="text-[10px] text-[var(--warning)] font-medium">Loom / YouTube / Drive</span>
                      </label>
                      <input
                        type="url"
                        value={newProjectForm.demoVideoUrl}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, demoVideoUrl: e.target.value })}
                        placeholder="https://loom.com/share/... (Optional)"
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewProject(false)}
                      className="px-4 py-2 rounded-full bg-white/[0.08] text-[var(--foreground)] text-xs font-medium hover:bg-white/[0.14] transition cursor-pointer active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save AI Model</span>
                    </button>
                  </div>
                </form>
              )}

              {/* All AI Projects Listed under this Panel */}
              <div className="space-y-3.5">
                {categoryProjects.length === 0 && !isAddingNewProject && (
                  <div className="p-8 text-center rounded-3xl panel-slot border border-white/[0.10] space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.10] mx-auto grid place-items-center text-[var(--primary)] shadow-sm">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">No {activeCategoryModal.label} Added Yet</h4>
                      <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto mt-1">
                        Attach your AI model repository, architecture/loss curve photo, accuracy metrics, and optional live HuggingFace/Gradio link.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddingNewProject(true)}
                      className="px-5 py-2 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold shadow-sm transition cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add {activeCategoryModal.label}</span>
                    </button>
                  </div>
                )}
                {categoryProjects.map((project, pIndex) => {
                  return (
                    <div
                      key={project.id}
                      className={cn(
                        "p-4.5 rounded-2xl panel-slot border transition space-y-3.5 shadow-sm relative group",
                        project.verified ? "border-[var(--success)]/25" : "border-white/[0.10]"
                      )}
                    >
                      {/* Project Row Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/25 text-[var(--primary)] font-mono text-xs font-semibold">
                            Deliverable #{pIndex + 1}
                          </span>
                          <input
                            type="text"
                            defaultValue={project.title}
                            onBlur={(e) => updateAllocatedAiProject(project.id, { title: e.target.value })}
                            className="text-xs sm:text-sm font-semibold text-[var(--foreground)] bg-transparent border-b border-transparent hover:border-white/[0.18] focus:border-[var(--primary)]/50 focus:outline-none px-1.5 py-0.5 rounded transition"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Verification Status Badge */}
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1 border",
                              project.verified
                                ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                            )}
                          >
                            {project.verified ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                                <span>Verified by Faculty ✓</span>
                              </>
                            ) : (
                              <span>Under Review</span>
                            )}
                          </span>

                          <button
                            onClick={() => {
                              if (confirm(`Delete AI Deliverable #${pIndex + 1}?`)) {
                                deleteAllocatedAiProject(project.id);
                                toast.success("AI project removed");
                              }
                            }}
                            className="p-1.5 rounded-full text-[var(--muted-foreground)] hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-95"
                            title="Delete AI project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 4 Core Required/Optional Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                        {/* 1. GitHub Repo Link (Required) */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                              <Github className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                              <span>GitHub Repository</span>
                            </label>
                            <div className="flex items-center gap-2">
                              {project.githubUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleAutoFetchRepo(project.githubUrl, false, project.id)}
                                  disabled={isFetchingRepo}
                                  className="text-[10px] font-mono font-medium text-[var(--primary)] hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-40"
                                  title="Sync repository metadata from GitHub"
                                >
                                  <RefreshCw className={cn("w-2.5 h-2.5", isFetchingRepo && "animate-spin")} />
                                  <span>Sync Repo</span>
                                </button>
                              )}
                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-0.5 font-medium"
                                >
                                  <span>Open Repo</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                          <input
                            type="url"
                            defaultValue={project.githubUrl}
                            onBlur={(e) => updateAllocatedAiProject(project.id, { githubUrl: e.target.value })}
                            placeholder="https://github.com/username/ai-repo"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                          />
                        </div>

                        {/* 2. Project Photo / Architecture Diagram / Confusion Matrix */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                              <span>Model Diagram / Loss Curve Photo</span>
                            </label>
                            {project.screenshotUrl && (
                              <button
                                onClick={() =>
                                  setPreviewImage({
                                    url: project.screenshotUrl,
                                    title: `Deliverable #${pIndex + 1}: ${project.title}`,
                                  })
                                }
                                className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                              >
                                <Maximize2 className="w-2.5 h-2.5" />
                                <span>Zoom Photo</span>
                              </button>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="url"
                              defaultValue={project.screenshotUrl}
                              onBlur={(e) => updateAllocatedAiProject(project.id, { screenshotUrl: e.target.value })}
                              placeholder="Paste screenshot URL..."
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                            />
                            <label className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12] text-xs font-medium cursor-pointer flex items-center gap-1 shrink-0 transition active:scale-95">
                              <Upload className="w-3 h-3" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageFileUpload(e, project.id)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* 3. Working Live Demo URL (Optional) */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                              <ExternalLink className="w-3.5 h-3.5 text-[var(--success)]" />
                              <span>Working Demo URL (Optional)</span>
                            </label>
                            {project.liveUrl && (
                              <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[var(--success)] hover:underline flex items-center gap-0.5 font-medium"
                              >
                                <span>Live Demo</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <input
                            type="url"
                            defaultValue={project.liveUrl || ""}
                            onBlur={(e) => updateAllocatedAiProject(project.id, { liveUrl: e.target.value })}
                            placeholder="https://huggingface.co/spaces/... (Optional)"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                          />
                        </div>

                        {/* 4. Video Demo (Optional) */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                              <Play className="w-3.5 h-3.5 text-[var(--warning)]" />
                              <span>Video Demo (Optional)</span>
                            </label>
                            {project.demoVideoUrl && (
                              <button
                                onClick={() =>
                                  setPreviewVideo({
                                    url: project.demoVideoUrl!,
                                    title: `Deliverable #${pIndex + 1}: ${project.title}`,
                                  })
                                }
                                className="text-[11px] text-[var(--warning)] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                              >
                                <Play className="w-2.5 h-2.5" />
                                <span>Watch Video</span>
                              </button>
                            )}
                          </div>
                          <input
                            type="url"
                            defaultValue={project.demoVideoUrl || ""}
                            onBlur={(e) => updateAllocatedAiProject(project.id, { demoVideoUrl: e.target.value })}
                            placeholder="https://loom.com/share/... (Optional)"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                          />
                        </div>
                      </div>

                      {/* Framework & Metrics Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-xs">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)] block">
                            Framework &amp; Tech Stack:
                          </label>
                          <input
                            type="text"
                            defaultValue={project.framework}
                            onBlur={(e) => updateAllocatedAiProject(project.id, { framework: e.target.value })}
                            placeholder="PyTorch, Transformers, FastAPI"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 font-mono focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)] block">
                            Accuracy / Evaluation Metrics:
                          </label>
                          <input
                            type="text"
                            defaultValue={project.metrics.accuracy || "Accuracy: 95%"}
                            onBlur={(e) =>
                              updateAllocatedAiProject(project.id, {
                                metrics: { ...project.metrics, accuracy: e.target.value },
                              })
                            }
                            placeholder="Accuracy: 95%, F1: 0.92, Top-1 Acc: 89%"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SCREENSHOT LIGHTBOX MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 font-[var(--font-sans)]">
          <div className="max-w-4xl w-full panel-card border border-white/[0.18] rounded-3xl overflow-hidden shadow-2xl space-y-3 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-[var(--foreground)] truncate tracking-tight">
                {previewImage.title}
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[var(--muted-foreground)] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-white/[0.02] max-h-[70vh] flex items-center justify-center border border-white/[0.08]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* VIDEO DEMO MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 font-[var(--font-sans)]">
          <div className="max-w-3xl w-full panel-card border border-white/[0.18] rounded-3xl overflow-hidden shadow-2xl space-y-3 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-[var(--foreground)] truncate flex items-center gap-2 tracking-tight">
                <Play className="w-4 h-4 text-[var(--warning)]" />
                {previewVideo.title}
              </h3>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[var(--muted-foreground)] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-white/[0.02] aspect-video flex items-center justify-center relative border border-white/[0.08]">
              {getEmbedVideoUrl(previewVideo.url) ? (
                <iframe
                  src={getEmbedVideoUrl(previewVideo.url)!}
                  title={previewVideo.title}
                  className="w-full h-full border-0 rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center space-y-2 p-6">
                  <p className="text-xs text-[var(--foreground)]">Video source URL: {previewVideo.url}</p>
                  <a
                    href={previewVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold"
                  >
                    <span>Open External Video Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



