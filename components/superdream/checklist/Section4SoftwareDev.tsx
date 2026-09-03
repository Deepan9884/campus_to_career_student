import React, { useState } from "react";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { SectionViewModeSwitcher } from "./SectionViewModeSwitcher";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import {
  SOFTWARE_DEV_CATEGORIES,
  INITIAL_ALLOCATED_PROJECTS,
  INITIAL_DEVOPS_DELIVERABLES,
  AllocatedProject,
  SoftwareDevCategoryConfig,
  DevOpsMetricDeliverable,
  fetchGithubRepoMetadata,
} from "@/lib/super-dream-software-dev-data";
import {
  Layers,
  Server,
  Layout,
  Smartphone,
  Cloud,
  Users,
  Globe,
  Cpu,
  Github,
  ExternalLink,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Maximize2,
  X,
  Code2,
  Upload,
  Sparkles,
  GitBranch,
  Box,
  ChevronRight,
  ArrowRight,
  Image as ImageIcon,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Section4SoftwareDev() {
  const {
    studentChecklist,
    allocatedProjects: storeAllocatedProjects,
    updateAllocatedProject,
    addAllocatedProject,
    deleteAllocatedProject,
    updateDevDeliverable,
  } = useSuperDream();

  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 4) || summaries[3];

  const allocatedProjects = storeAllocatedProjects || INITIAL_ALLOCATED_PROJECTS;

  // View Mode: 'focus' (single item with dropdown) vs 'overall' (grid)
  const [viewMode, setViewMode] = useState<"overall" | "focus">("focus");
  const [focusedCategoryKey, setFocusedCategoryKey] = useState<string>(SOFTWARE_DEV_CATEGORIES[0].key);

  // Selected Category Modal for Project Management
  const [activeCategoryModal, setActiveCategoryModal] = useState<SoftwareDevCategoryConfig | null>(null);

  // Selected DevOps Deliverable Modal
  const [activeDevOpsModal, setActiveDevOpsModal] = useState<DevOpsMetricDeliverable | null>(null);

  // Preview Lightboxes
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  // Auto-fetch loading state
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);

  // New Project Form in Active Category Drawer
  const [isAddingNewProject, setIsAddingNewProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    tagline: "",
    description: "",
    techStackText: "React, TypeScript, Node.js",
    githubUrl: "",
    screenshotUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    liveUrl: "",
    demoVideoUrl: "",
    verified: false,
  });

  // Auto-fetch repo metadata from GitHub
  const handleAutoFetchRepo = async (repoUrl: string, isNewForm: boolean, projectId?: string) => {
    if (!repoUrl || !repoUrl.trim()) {
      toast.error("Please enter a GitHub repository link first");
      return;
    }
    setIsFetchingRepo(true);
    toast.loading("Fetching real repository data from GitHub...", { id: "gh-repo-fetch" });
    try {
      const meta = await fetchGithubRepoMetadata(repoUrl);
      if (!meta) {
        toast.error("Could not fetch repository. Ensure the repository is public (e.g. https://github.com/user/repo).", { id: "gh-repo-fetch" });
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
          verified: true,
        }));
      } else if (projectId) {
        updateAllocatedProject(projectId, {
          title: meta.title,
          description: meta.description,
          tagline: meta.tagline,
          techStack: meta.techStack,
          liveUrl: meta.liveUrl,
          verified: true,
          metrics: meta.metrics,
          architectureHighlights: meta.architectureHighlights,
        });
      }

      toast.success(`Auto-filled from GitHub! (${meta.techStack.join(", ")} • ${meta.stars}★)`, { id: "gh-repo-fetch" });
    } catch {
      toast.error("Failed to query GitHub repository", { id: "gh-repo-fetch" });
    } finally {
      setIsFetchingRepo(false);
    }
  };

  // Icon Resolver
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Layers":
        return Layers;
      case "Server":
        return Server;
      case "Layout":
        return Layout;
      case "Smartphone":
        return Smartphone;
      case "Cloud":
        return Cloud;
      case "Users":
        return Users;
      case "Globe":
        return Globe;
      default:
        return Code2;
    }
  };

  const getDevOpsIcon = (iconName: string) => {
    switch (iconName) {
      case "Code2":
        return Code2;
      case "Server":
        return Server;
      case "GitBranch":
        return GitBranch;
      case "Box":
        return Box;
      case "Cpu":
        return Cpu;
      default:
        return Cpu;
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
          updateAllocatedProject(projectId, { screenshotUrl: dataUrl });
          toast.success("Project screenshot updated!");
        } else {
          setNewProjectForm((prev) => ({ ...prev, screenshotUrl: dataUrl }));
          toast.success("Screenshot attached to new project!");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save New Project under Category
  const handleSaveNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryModal || !newProjectForm.title.trim()) {
      toast.error("Please provide a project title");
      return;
    }

    const techStack = newProjectForm.techStackText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    addAllocatedProject({
      categoryKey: activeCategoryModal.key,
      categoryLabel: activeCategoryModal.label,
      title: newProjectForm.title,
      tagline: newProjectForm.tagline || "Production engineering project deliverable",
      description: newProjectForm.description || "Production-grade software system with verified code repository.",
      techStack,
      githubUrl: newProjectForm.githubUrl || "https://github.com/student/new-project",
      screenshotUrl: newProjectForm.screenshotUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
      liveUrl: newProjectForm.liveUrl,
      demoVideoUrl: newProjectForm.demoVideoUrl,
      verified: newProjectForm.verified,
      architectureHighlights: ["Modular service architecture", "Automated unit and integration test coverage"],
      metrics: { commits: 45, stars: 10, latency: "25ms", testCoverage: "90%" },
    });

    toast.success(`Added new ${activeCategoryModal.label}!`);
    setIsAddingNewProject(false);
    setNewProjectForm({
      title: "",
      tagline: "",
      description: "",
      techStackText: "React, TypeScript, Node.js",
      githubUrl: "",
      screenshotUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
      liveUrl: "",
      demoVideoUrl: "",
      verified: false,
    });
  };

  // Filter projects for active category modal
  const categoryProjects = activeCategoryModal
    ? allocatedProjects.filter((p) => p.categoryKey === activeCategoryModal.key)
    : [];

  return (
    <div className="space-y-6">
      {/* 3 Calm Pie Charts at Top */}
      <SectionHeaderMetrics
        sectionId={4}
        title="4. Software Development"
        subtitle="12 Official Placement Deliverables: Click any project panel to view attached GitHub repos, project photos, optional working URLs, and video demos."
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
      {/* 12 CORE PANELS MATCHING THE SYLLABUS TABLE DIRECTLY */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="space-y-4">
        {/* Section A: 7 Core Project Quota Panels */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/80 font-mono flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Project Deliverable Categories (7 Categories)</span>
            </h3>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
              Click any panel to manage attached GitHub repos & media
            </span>
          </div>
 
          {/* View Mode Switcher: Overall Grid vs Single Focus */}
          <SectionViewModeSwitcher
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            options={SOFTWARE_DEV_CATEGORIES.map((cat) => ({
              id: cat.key,
              label: cat.title,
              badge: `${cat.targetCount} Target`,
            }))}
            selectedId={focusedCategoryKey}
            onSelectId={setFocusedCategoryKey}
            label="Category"
          />

          <div
            className={cn(
              "gap-4",
              viewMode === "focus"
                ? "w-full space-y-4"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {(viewMode === "focus"
              ? SOFTWARE_DEV_CATEGORIES.filter((c) => c.key === focusedCategoryKey)
              : SOFTWARE_DEV_CATEGORIES
            ).map((cat, idx) => {
              const Icon = getCategoryIcon(cat.iconName);
              const items = allocatedProjects.filter((p) => p.categoryKey === cat.key);
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
                          <h4 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
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
                        <span>Allocated Projects ({items.length})</span>
                        <span className="font-mono">{percent}% done</span>
                      </div>
                      {items.length === 0 ? (
                        <div className="p-2.5 rounded-xl panel-empty text-xs text-[var(--muted-foreground)] text-center flex items-center justify-center gap-1.5 transition">
                          <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>Link GitHub Repo & Demo</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {items.slice(0, 3).map((p, pIdx) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-xl panel-slot flex items-center justify-between text-xs"
                            >
                              <span className="text-xs text-[var(--foreground)]/90 truncate max-w-[170px] font-medium">
                                #{pIdx + 1}: {p.title}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {p.liveUrl && (
                                  <span className="text-[9px] font-mono text-[var(--success)] bg-[var(--success)]/15 border border-[var(--success)]/25 px-1.5 py-0.2 rounded-full">
                                    Live
                                  </span>
                                )}
                                {p.demoVideoUrl && (
                                  <span className="text-[9px] font-mono text-[var(--warning)] bg-[var(--warning)]/15 border border-[var(--warning)]/25 px-1.5 py-0.2 rounded-full">
                                    Video
                                  </span>
                                )}
                                {p.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />}
                              </div>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)] block text-right pt-0.5">
                              +{items.length - 3} more projects...
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
                      Manage Projects <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section B: 5 Core Engineering & DevOps Quotas */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/80 font-mono flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Engineering & DevOps Infrastructure Metrics (5 Categories)</span>
            </h3>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
              Click any panel to inspect live endpoints & workloads
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {INITIAL_DEVOPS_DELIVERABLES.map((item, idx) => {
              const matchingChecklistItem = studentChecklist.section4SoftwareDev.find((d) => d.id === item.id);
              const currentVal = matchingChecklistItem ? matchingChecklistItem.current : item.current;
              const percent = Math.min(100, Math.round((currentVal / item.target) * 100));
              const isCompleted = currentVal >= item.target;
              const Icon = getDevOpsIcon(item.iconName);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveDevOpsModal(item)}
                  className={cn(
                    "panel-card rounded-2xl p-3.5 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3",
                    isCompleted && "border-[var(--success)]/30 shadow-[0_0_20px_rgba(134,239,172,0.10)]"
                  )}
                >
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-start justify-between gap-1">
                      <div
                        className="w-8 h-8 rounded-xl grid place-items-center shrink-0 shadow-sm"
                        style={{ background: `${item.color}15`, border: `1px solid ${item.color}30`, color: item.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                          isCompleted
                            ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                            : "bg-white/[0.06] text-[var(--foreground)] border-white/[0.10]"
                        )}
                      >
                        {currentVal}/{item.target}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)] block">#{idx + 8}</span>
                      <h4 className="text-xs font-semibold text-[var(--foreground)] line-clamp-1 tracking-tight">
                        {item.title}
                      </h4>
                    </div>

                    <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden border border-white/[0.08]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          background: isCompleted
                            ? "linear-gradient(90deg, #86EFAC, #6EE7B7)"
                            : `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-white/[0.08] text-[10px] font-medium flex items-center justify-between relative z-10" style={{ color: item.color }}>
                    <span>{percent}% Complete</span>
                    <span className="flex items-center gap-0.5">Details →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* CATEGORY PROJECTS MANAGEMENT DRAWER / MODAL */}
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
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                    {activeCategoryModal.label}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5 mt-0.5">
                    <span>Target Quota: {activeCategoryModal.targetCount} Projects</span>
                    <span>•</span>
                    <span>Attached Code, Screenshots, Live URLs & Videos</span>
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
                  <span>{isAddingNewProject ? "Close Form" : "Add Project"}</span>
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
              {/* Form: Add New Project under this Category */}
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
                      Project #{categoryProjects.length + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1">
                        <span>Project Title</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newProjectForm.title}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                        placeholder="e.g. Distributed Key-Value Storage Engine"
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--foreground)] block">
                        Tech Stack (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={newProjectForm.techStackText}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, techStackText: e.target.value })}
                        placeholder="React, TypeScript, Go, Docker, PostgreSQL"
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
                          placeholder="https://github.com/username/project-repo"
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
                          <span>Project Photo / Screenshot</span>
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
                        <label className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12] text-xs font-medium cursor-pointer flex items-center gap-1 shrink-0 transition active:scale-95">
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
                          <Globe className="w-3.5 h-3.5 text-[var(--success)]" />
                          <span>Working URL (Optional)</span>
                        </span>
                        <span className="text-[10px] text-[var(--success)] font-medium">Live Demo</span>
                      </label>
                      <input
                        type="url"
                        value={newProjectForm.liveUrl}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, liveUrl: e.target.value })}
                        placeholder="https://my-app.vercel.app (Optional)"
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
                      <span>Save Project</span>
                    </button>
                  </div>
                </form>
              )}

              {/* All Projects Listed under this Panel */}
              <div className="space-y-3.5">
                {categoryProjects.length === 0 && !isAddingNewProject && (
                  <div className="p-8 text-center rounded-3xl panel-slot border border-white/[0.10] space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.10] mx-auto grid place-items-center text-[var(--muted-foreground)] shadow-sm">
                      <Github className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">No {activeCategoryModal.label} Added Yet</h4>
                      <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto mt-1">
                        Add your actual GitHub repository URL, screenshots, and optional live app or demo video links to track this deliverable.
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
                      {/* Project Row Header: Number, Title, Verification */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/25 text-[var(--primary)] font-mono text-xs font-semibold">
                            Project #{pIndex + 1}
                          </span>
                          <input
                            type="text"
                            defaultValue={project.title}
                            onBlur={(e) => updateAllocatedProject(project.id, { title: e.target.value })}
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
                              if (confirm(`Delete Project #${pIndex + 1}?`)) {
                                deleteAllocatedProject(project.id);
                                toast.success("Project removed");
                              }
                            }}
                            className="p-1.5 rounded-full text-[var(--muted-foreground)] hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-95"
                            title="Delete project"
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
                            onBlur={(e) => updateAllocatedProject(project.id, { githubUrl: e.target.value })}
                            placeholder="https://github.com/username/project-repo"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                          />
                        </div>

                        {/* 2. Project Photo / Screenshot */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                              <span>Project Photo / Screenshot</span>
                            </label>
                            {project.screenshotUrl && (
                              <button
                                onClick={() =>
                                  setPreviewImage({
                                    url: project.screenshotUrl,
                                    title: `Project #${pIndex + 1}: ${project.title}`,
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
                              onBlur={(e) => updateAllocatedProject(project.id, { screenshotUrl: e.target.value })}
                              placeholder="Paste screenshot URL..."
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                            />
                            <label className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12] text-xs font-medium cursor-pointer flex items-center gap-1 shrink-0 transition active:scale-95">
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

                        {/* 3. Project Working URL (Optional) */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-[var(--success)]" />
                              <span>Working URL (Optional)</span>
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
                            onBlur={(e) => updateAllocatedProject(project.id, { liveUrl: e.target.value })}
                            placeholder="https://my-app.vercel.app (Optional)"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                          />
                        </div>

                        {/* 4. Project Video Demo (Optional) */}
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
                                    title: `Project #${pIndex + 1}: ${project.title}`,
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
                            onBlur={(e) => updateAllocatedProject(project.id, { demoVideoUrl: e.target.value })}
                            placeholder="https://loom.com/share/... (Optional)"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                          />
                        </div>
                      </div>

                      {/* Tech Stack & Description Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-xs">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)] block">
                            Tech Stack Badges:
                          </label>
                          <input
                            type="text"
                            defaultValue={project.techStack.join(", ")}
                            onBlur={(e) =>
                              updateAllocatedProject(project.id, {
                                techStack: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="React, TypeScript, Go, Docker"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.07] transition font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)] block">
                            Architectural Summary:
                          </label>
                          <input
                            type="text"
                            defaultValue={project.description}
                            onBlur={(e) => updateAllocatedProject(project.id, { description: e.target.value })}
                            placeholder="Brief architectural summary..."
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
      {/* DEVOPS DELIVERABLES DRAWER / MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeDevOpsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-[var(--font-sans)]">
          <div className="panel-card text-[var(--foreground)] w-full max-w-2xl rounded-3xl border border-white/[0.18] shadow-[0_25px_80px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25 grid place-items-center shadow-sm">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">{activeDevOpsModal.title}</h3>
                  <span className="text-xs text-[var(--muted-foreground)] font-medium">
                    Official Target: {activeDevOpsModal.target} {activeDevOpsModal.unit}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveDevOpsModal(null)}
                className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[var(--muted-foreground)] hover:text-white transition cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{activeDevOpsModal.description}</p>

              {/* Live Catalog List */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-[var(--foreground)] block tracking-tight">
                  Catalog & Verification Telemetry
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeDevOpsModal.catalog.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl panel-slot flex items-center justify-between text-xs border border-white/[0.08]"
                    >
                      <div>
                        <p className="font-semibold text-xs text-[var(--foreground)]">{entry.name}</p>
                        <span className="text-[11px] text-[var(--muted-foreground)]">{entry.sublabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-[var(--foreground)] font-medium">
                          {entry.tag}
                        </span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25 font-semibold">
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter Controller */}
              <div className="p-4 rounded-2xl panel-slot flex items-center justify-between text-xs border border-white/[0.10]">
                <span className="text-[var(--foreground)] font-medium">Deliverable Counter</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const item = studentChecklist.section4SoftwareDev.find((d) => d.id === activeDevOpsModal.id);
                      const current = item ? item.current : activeDevOpsModal.current;
                      updateDevDeliverable(activeDevOpsModal.id, Math.max(0, current - 1));
                    }}
                    className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12] transition grid place-items-center font-bold active:scale-95 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-base text-[var(--foreground)] px-2">
                    {studentChecklist.section4SoftwareDev.find((d) => d.id === activeDevOpsModal.id)?.current ?? activeDevOpsModal.current}
                  </span>
                  <button
                    onClick={() => {
                      const item = studentChecklist.section4SoftwareDev.find((d) => d.id === activeDevOpsModal.id);
                      const current = item ? item.current : activeDevOpsModal.current;
                      updateDevDeliverable(activeDevOpsModal.id, current + 1);
                    }}
                    className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12] transition grid place-items-center font-bold active:scale-95 cursor-pointer"
                  >
                    +
                  </button>
                </div>
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



