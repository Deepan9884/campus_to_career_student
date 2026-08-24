import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import {
  Linkedin,
  Loader2,
  Copy,
  Share2,
  Github,
  Trophy,
  Zap,
  PenTool,
  Award,
  Calendar,
  Upload,
  Trash2,
  Edit3,
  Bookmark,
  Tag,
  Download,
  Flame,
  CheckCircle2,
  Bold,
  List,
  Smile,
  Globe,
  Code,
  Lightbulb,
  Rocket,
  Users,
  UserPlus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAnalysisHistory,
  getAnalysisById,
  generateLinkedInPost,
  type LinkedInPostResult,
  type LinkedInPostVariation,
} from "@/lib/github-api";
import { getUserEvents, getCertificateUrl } from "@/lib/events-api";
import { useAuth } from "@/stores";
import type { AnalysisHistoryItem } from "@/types/github";
import type { Event as UserEvent } from "@/types/event";

export const Route = createFileRoute("/_authenticated/linkedin-posts")({
  head: () => ({ meta: [{ title: "LinkedIn Post Creator — Campus to Career AI" }] }),
  component: LinkedInPostsPage,
});

type SourceType = "event" | "github";
type ToneType = "exhaustive" | "technical" | "storytelling" | "executive" | "celebratory";
type LengthType = "exhaustive" | "standard" | "punchy";

interface SavedDraft {
  id: string;
  sourceType: SourceType;
  title: string;
  headline: string;
  draft: string;
  achievementParagraph: string;
  variations: LinkedInPostVariation[];
  suggestedHashtags: string[];
  suggestedMentions: string[];
  attachedImagePreview?: string | null;
  createdAt: string;
}

function toUnicodeBold(text: string): string {
  const diffUpper = 0x1d400 - 0x41;
  const diffLower = 0x1d41a - 0x61;
  const diffDigits = 0x1d7ce - 0x30;
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0x41 && code <= 0x5a) return String.fromCodePoint(code + diffUpper);
      if (code >= 0x61 && code <= 0x7a) return String.fromCodePoint(code + diffLower);
      if (code >= 0x30 && code <= 0x39) return String.fromCodePoint(code + diffDigits);
      return char;
    })
    .join("");
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  minRows = 3,
  id,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  id?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollH = textareaRef.current.scrollHeight;
      const minH = minRows * 26;
      textareaRef.current.style.height = `${Math.max(scrollH, minH)}px`;
    }
  }, [value, minRows]);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      onChange={(e) => {
        onChange(e);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          const scrollH = textareaRef.current.scrollHeight;
          const minH = minRows * 26;
          textareaRef.current.style.height = `${Math.max(scrollH, minH)}px`;
        }
      }}
      placeholder={placeholder}
      className={`w-full glass-input rounded-2xl p-4 text-sm outline-none resize-none leading-relaxed overflow-hidden transition-[height] duration-100 ${className}`}
      rows={minRows}
    />
  );
}

function LinkedInPostsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"create" | "drafts">("create");

  // Only two primary source options: "event" or "github"
  const [sourceType, setSourceType] = useState<SourceType>("event");

  // Data lists
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [githubHistory, setGithubHistory] = useState<AnalysisHistoryItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");

  // Event Inputs
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("hackathon");
  const [eventOrganizer, setEventOrganizer] = useState("");
  const [eventRole, setEventRole] = useState("Lead Developer");
  const [eventTeamName, setEventTeamName] = useState("");
  const [eventTeamSize, setEventTeamSize] = useState<number>(3);
  const [teammateNames, setTeammateNames] = useState<string[]>(["", "", ""]);
  const [eventProjectTitle, setEventProjectTitle] = useState("");
  const [eventProblem, setEventProblem] = useState("");
  const [eventTechStack, setEventTechStack] = useState("React, TypeScript, Node.js, MongoDB, Gemini AI");
  const [eventWhatBuilt, setEventWhatBuilt] = useState("");
  const [eventWhatLearned, setEventWhatLearned] = useState("");
  const [eventChallenges, setEventChallenges] = useState("");
  const [eventResult, setEventResult] = useState("winner");
  const [eventPrize, setEventPrize] = useState("1st Place Winner & Best UI/UX");
  const [eventCertificateUrl, setEventCertificateUrl] = useState("");

  const handleTeamSizeChange = (newSize: number) => {
    const size = Math.max(0, Math.min(10, newSize));
    setEventTeamSize(size);
    setTeammateNames((prev) => {
      const next = [...prev];
      if (size > next.length) {
        while (next.length < size) next.push("");
      } else {
        return next.slice(0, size);
      }
      return next;
    });
  };

  const handleTeammateNameChange = (index: number, name: string) => {
    setTeammateNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  };

  const addTeammate = () => {
    setEventTeamSize((prev) => prev + 1);
    setTeammateNames((prev) => [...prev, ""]);
  };

  const removeTeammate = (index: number) => {
    setTeammateNames((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setEventTeamSize(next.length);
      return next;
    });
  };

  // GitHub Inputs
  const [repoFullName, setRepoFullName] = useState("");
  const [repoOverview, setRepoOverview] = useState("");
  const [repoQuality, setRepoQuality] = useState("");
  const [repoResumeImpact, setRepoResumeImpact] = useState("");
  const [repoTechStack, setRepoTechStack] = useState("React, TypeScript, Express, MongoDB");
  const [repoUrl, setRepoUrl] = useState("");

  // Tone & Output Settings
  const [tone, setTone] = useState<ToneType>("exhaustive");
  const [length, setLength] = useState<LengthType>("exhaustive");
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [customHighlights, setCustomHighlights] = useState("");
  const [mentions, setMentions] = useState("");

  // Media & Attachments
  const [attachedImageFile, setAttachedImageFile] = useState<File | null>(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState<string | null>(null);
  const [useCertificateAsAttachment, setUseCertificateAsAttachment] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // Generation Output States
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<LinkedInPostResult | null>(null);
  const [activeDraftText, setActiveDraftText] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<"all" | "para" | "tags" | null>(null);

  // Saved Drafts (Local persistence)
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>(() => {
    try {
      const stored = localStorage.getItem("c2c_linkedin_saved_drafts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [eventsRes, githubRes] = await Promise.allSettled([
          getUserEvents(1, 30),
          getAnalysisHistory(1, 30),
        ]);

        if (eventsRes.status === "fulfilled") {
          const evs = eventsRes.value.events || [];
          setEvents(evs);
          if (evs.length > 0) {
            populateFromEvent(evs[0]);
          }
        }

        if (githubRes.status === "fulfilled") {
          const ghList = githubRes.value.analyses || [];
          setGithubHistory(ghList);
        }
      } catch (err) {
        console.error("Failed to load initial events / repos", err);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("c2c_linkedin_saved_drafts", JSON.stringify(savedDrafts));
    } catch (e) {
      console.error("Could not persist drafts", e);
    }
  }, [savedDrafts]);

  const populateFromEvent = (ev: UserEvent) => {
    setSelectedEventId(ev._id);
    setEventName(ev.eventName || "");
    setEventType(ev.eventType || "hackathon");
    setEventOrganizer(ev.organizer || "");
    setEventRole(ev.role || "Lead Developer");
    setEventTeamName(ev.teamName || "");

    if (Array.isArray(ev.teamMembers) && ev.teamMembers.length > 0) {
      setTeammateNames(ev.teamMembers);
      setEventTeamSize(ev.teamMembers.length);
    } else if (ev.teamSize && ev.teamSize > 1) {
      const count = ev.teamSize - 1;
      setEventTeamSize(count);
      setTeammateNames(Array.from({ length: count }, () => ""));
    } else {
      setEventTeamSize(0);
      setTeammateNames([]);
    }

    setEventProjectTitle(ev.projectTitle || ev.eventName || "");
    setEventProblem(ev.problemStatement || "");
    setEventTechStack(Array.isArray(ev.techStack) ? ev.techStack.join(", ") : "");
    setEventWhatBuilt(ev.reflection?.whatDidYouBuild || ev.description || "");
    setEventWhatLearned(ev.reflection?.whatDidYouLearn || "");
    setEventChallenges(ev.reflection?.challengesFaced || "");
    setEventResult(ev.result || "participated");
    setEventPrize(ev.prize || "");
    if (ev.certificateUrl) {
      const fullCertUrl = getCertificateUrl(ev.certificateUrl);
      setEventCertificateUrl(fullCertUrl);
      setAttachedImagePreview(fullCertUrl);
      setUseCertificateAsAttachment(true);
    } else {
      setEventCertificateUrl("");
      setUseCertificateAsAttachment(false);
    }
  };

  const populateFromGitHub = async (analysis: AnalysisHistoryItem) => {
    setSelectedRepoId(analysis._id);
    setRepoFullName(analysis.repoFullName);
    try {
      const detail = await getAnalysisById(analysis._id);
      setRepoOverview(detail.overview || "");
      setRepoQuality(detail.quality || "");
      if (Array.isArray(detail.resumeImpact) && detail.resumeImpact.length > 0) {
        const formatted = detail.resumeImpact
          .map((item) => (item.trim().startsWith("•") ? item.trim() : `• ${item.trim()}`))
          .join("\n");
        setRepoResumeImpact(formatted);
      } else {
        setRepoResumeImpact(typeof detail.resumeImpact === "string" ? detail.resumeImpact : "");
      }
      setRepoUrl(detail.repoUrl || `https://github.com/${detail.repoFullName}`);
      if (detail.filesAnalyzed && detail.filesAnalyzed.length > 0) {
        setRepoTechStack(detail.filesAnalyzed.slice(0, 6).join(", "));
      }
    } catch {
      toast.error("Failed to load repo details");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file should be under 5MB");
      return;
    }

    setAttachedImageFile(file);
    const reader = new FileReader();
    reader.onload = (loadEv) => {
      setAttachedImagePreview(loadEv.target?.result as string);
      setUseCertificateAsAttachment(false);
      toast.success("Photo attached to LinkedIn post");
    };
    reader.readAsDataURL(file);
  };

  const generateSocialCard = () => {
    setIsGeneratingCard(true);
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsGeneratingCard(false);
      return;
    }

    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, "#090d16");
    bgGradient.addColorStop(0.5, "#0d1527");
    bgGradient.addColorStop(1, "#08101e");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    const orb1 = ctx.createRadialGradient(250, 150, 10, 250, 150, 400);
    orb1.addColorStop(0, "rgba(59, 130, 246, 0.35)");
    orb1.addColorStop(1, "transparent");
    ctx.fillStyle = orb1;
    ctx.fillRect(0, 0, 1200, 630);

    const orb2 = ctx.createRadialGradient(950, 480, 10, 950, 480, 450);
    orb2.addColorStop(0, "rgba(168, 85, 247, 0.3)");
    orb2.addColorStop(1, "transparent");
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 570);

    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.strokeStyle = "rgba(96, 165, 250, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(70, 70, 420, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 16px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#93c5fd";
    ctx.fillText("CAMPUS TO CAREER AI • VERIFIED", 90, 98);

    const resultText =
      sourceType === "event"
        ? eventResult === "winner"
          ? "1ST PLACE WINNER"
          : eventResult === "runner-up"
          ? "RUNNER-UP"
          : "HACKATHON SHOWCASE"
        : "GITHUB PROJECT SHOWCASE";

    ctx.fillStyle = "rgba(234, 179, 8, 0.2)";
    ctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(810, 70, 320, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 16px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#fde047";
    ctx.fillText(resultText, 830, 98);

    const mainTitle =
      sourceType === "event"
        ? eventProjectTitle || eventName || "Hackathon Project"
        : repoFullName || "GitHub Open-Source Project";

    ctx.font = "bold 46px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    const truncatedTitle = mainTitle.length > 40 ? mainTitle.slice(0, 38) + "..." : mainTitle;
    ctx.fillText(truncatedTitle, 70, 220);

    const subtitle =
      sourceType === "event"
        ? `Organized by: ${eventOrganizer || "Tech Symposium"} • Role: ${eventRole || "Lead Developer"}`
        : `Repository: ${repoFullName} • Production Full-Stack Application`;

    ctx.font = "500 24px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(subtitle, 70, 270);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(70, 310, 1060, 150, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 18px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("KEY ACCOMPLISHMENT & TECHNICAL HIGHLIGHTS", 95, 345);

    const highlightQuote =
      customHighlights ||
      (sourceType === "event" ? eventPrize || eventWhatBuilt : repoOverview) ||
      "Engineered a scalable, resilient system with modern architectural patterns, overcoming strict constraints and delivering high-impact results.";
    ctx.font = "italic 20px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#e2e8f0";
    const truncatedQuote = highlightQuote.length > 180 ? highlightQuote.slice(0, 175) + "..." : highlightQuote;
    ctx.fillText(`"${truncatedQuote}"`, 95, 390);

    const techItems = (sourceType === "event" ? eventTechStack : repoTechStack || repoQuality)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);

    let startX = 70;
    techItems.forEach((tech) => {
      ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
      ctx.strokeStyle = "rgba(129, 140, 248, 0.35)";
      ctx.lineWidth = 1;
      const pillWidth = Math.max(100, tech.length * 12 + 30);
      ctx.beginPath();
      ctx.roundRect(startX, 490, pillWidth, 38, 19);
      ctx.fill();
      ctx.stroke();

      ctx.font = "600 15px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#c7d2fe";
      ctx.fillText(tech, startX + 16, 514);
      startX += pillWidth + 14;
    });

    ctx.font = "bold 20px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    const authorName = user?.name || "Software Developer";
    ctx.fillText(authorName, 880, 545);

    ctx.font = "15px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(user?.targetRole || "Campus to Career AI Member", 880, 570);

    const dataUrl = canvas.toDataURL("image/png");
    setAttachedImagePreview(dataUrl);
    setUseCertificateAsAttachment(false);
    setIsGeneratingCard(false);
    toast.success("Dynamic LinkedIn Achievement Card generated!");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedResult(null);

    try {
      const payload = {
        postType: sourceType,
        tone,
        length,
        includeEmoji,
        includeHashtags,
        customHighlights,
        mentions,
        // Event data
        eventId: sourceType === "event" ? selectedEventId : undefined,
        eventName: sourceType === "event" ? eventName : undefined,
        eventType: sourceType === "event" ? eventType : undefined,
        organizer: sourceType === "event" ? eventOrganizer : undefined,
        role: sourceType === "event" ? eventRole : undefined,
        teamName: sourceType === "event" ? eventTeamName : undefined,
        teamSize: sourceType === "event" ? eventTeamSize + 1 : undefined,
        teamMembers:
          sourceType === "event" ? teammateNames.filter((t) => t.trim().length > 0) : undefined,
        teammates:
          sourceType === "event" ? teammateNames.filter((t) => t.trim().length > 0) : undefined,
        projectTitle: sourceType === "event" ? eventProjectTitle : undefined,
        problemStatement: sourceType === "event" ? eventProblem : undefined,
        techStack:
          sourceType === "event"
            ? eventTechStack.split(",").map((s) => s.trim())
            : repoTechStack.split(",").map((s) => s.trim()),
        whatDidYouBuild: sourceType === "event" ? eventWhatBuilt : undefined,
        whatDidYouLearn: sourceType === "event" ? eventWhatLearned : undefined,
        challengesFaced: sourceType === "event" ? eventChallenges : undefined,
        result: sourceType === "event" ? eventResult : undefined,
        prize: sourceType === "event" ? eventPrize : undefined,
        // GitHub data
        repoFullName: sourceType === "github" ? repoFullName : undefined,
        overview: sourceType === "github" ? repoOverview : undefined,
        quality: sourceType === "github" ? repoQuality : undefined,
        resumeImpact:
          sourceType === "github" && repoResumeImpact
            ? repoResumeImpact.split("\n").map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
            : undefined,
        repoUrl: sourceType === "github" ? repoUrl : undefined,
      };

      const result = await generateLinkedInPost(payload);
      setGeneratedResult(result);
      setActiveDraftText(result.draft);
      toast.success("High-converting LinkedIn content generated!");
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      toast.error(apiErr.message || "Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (type: "all" | "para" | "tags") => {
    try {
      let textToCopy = "";
      if (type === "all") {
        textToCopy = activeDraftText;
      } else if (type === "para") {
        textToCopy = generatedResult?.achievementParagraph || activeDraftText;
      } else if (type === "tags") {
        textToCopy = (generatedResult?.suggestedHashtags || []).join(" ");
      }

      if (!textToCopy) return;
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2500);
      toast.success(
        type === "para"
          ? "Exhaustive Achievement Paragraph copied!"
          : type === "tags"
          ? "Hashtags copied!"
          : "Full LinkedIn Post copied to clipboard!",
      );
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSaveDraft = () => {
    if (!activeDraftText) return;
    const title =
      sourceType === "event"
        ? eventProjectTitle || eventName || "Event Post"
        : repoFullName || "GitHub Project";

    const newDraft: SavedDraft = {
      id: Date.now().toString(),
      sourceType,
      title,
      headline: generatedResult?.headline || "Project Showcase",
      draft: activeDraftText,
      achievementParagraph: generatedResult?.achievementParagraph || "",
      variations: generatedResult?.variations || [],
      suggestedHashtags: generatedResult?.suggestedHashtags || [],
      suggestedMentions: generatedResult?.suggestedMentions || [],
      attachedImagePreview,
      createdAt: new Date().toISOString(),
    };

    setSavedDrafts((prev) => [newDraft, ...prev]);
    toast.success("Draft saved to your collection!");
  };

  const handleDeleteDraft = (id: string) => {
    setSavedDrafts((prev) => prev.filter((d) => d.id !== id));
    toast.success("Draft removed");
  };

  const handleShareOnLinkedIn = () => {
    const targetUrl =
      sourceType === "github"
        ? repoUrl || "https://github.com"
        : "https://www.linkedin.com/feed/";

    navigator.clipboard.writeText(activeDraftText);
    toast.info("Post copied! Opening LinkedIn sharing dialog...");

    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleInsertBold = () => {
    const textarea = document.getElementById("linkedin-draft-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = activeDraftText.slice(start, end);
    if (!selectedText) {
      toast.info("Select text in the editor first to make it bold");
      return;
    }
    const bolded = toUnicodeBold(selectedText);
    const updated = activeDraftText.slice(0, start) + bolded + activeDraftText.slice(end);
    setActiveDraftText(updated);
    toast.success("Converted selection to Bold Unicode");
  };

  const handleInsertBullet = () => {
    setActiveDraftText((prev) => prev + "\n• ");
  };

  const handleInsertEmoji = (emoji: string) => {
    setActiveDraftText((prev) => prev + ` ${emoji} `);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div
        data-tour="linkedin-generator-card"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/20 p-6 md:p-8 backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Linkedin className="h-3.5 w-3.5" />
              Recruiter-Ready Super Content Engine
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              LinkedIn Post Creator
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              Select between your <strong className="text-foreground font-semibold">Registered Events &amp; Hackathons</strong> or <strong className="text-foreground font-semibold">GitHub Repositories</strong> to craft high-converting, exhaustive LinkedIn achievement posts with photos.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="glass p-3.5 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-indigo-400" />
                Events
              </p>
              <p className="text-xl font-bold text-indigo-400 mt-0.5">{events.length}</p>
            </div>
            <div className="glass p-3.5 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Github className="h-3.5 w-3.5 text-blue-400" />
                GitHub Repos
              </p>
              <p className="text-xl font-bold text-blue-400 mt-0.5">{githubHistory.length}</p>
            </div>
          </div>
        </div>

        {/* Top Two Options Switcher */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex p-1.5 rounded-2xl glass border border-white/15 max-w-md w-full">
            <button
              type="button"
              onClick={() => {
                setSourceType("event");
                setActiveTab("create");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                sourceType === "event" && activeTab === "create"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Trophy className="h-4 w-4 text-indigo-300" />
              1. Events & Hackathons ({events.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType("github");
                setActiveTab("create");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                sourceType === "github" && activeTab === "create"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Github className="h-4 w-4 text-blue-300" />
              2. GitHub Repositories ({githubHistory.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "drafts" ? "create" : "drafts")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition self-start sm:self-auto ${
              activeTab === "drafts"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "glass hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Saved Drafts ({savedDrafts.length})
          </button>
        </div>
      </div>

      {/* CREATE TAB */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Post Form & Options (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* OPTION 1: EVENTS & HACKATHONS FORM */}
            {sourceType === "event" && (
              <GlassCard className="p-6 space-y-4 border-indigo-500/20">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Event & Hackathon Achievement</h2>
                      <p className="text-xs text-muted-foreground">Auto-populate from your logged events or enter details</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Option 1 of 2
                  </span>
                </div>

                {/* Event Selector */}
                {events.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                      Grab data from your logged event:
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => {
                        const found = events.find((ev) => ev._id === e.target.value);
                        if (found) populateFromEvent(found);
                      }}
                      className="w-full glass-input rounded-xl p-3 text-sm outline-none bg-card text-foreground border border-indigo-500/30 focus:border-indigo-500"
                    >
                      <option value="">-- Select from your verified events --</option>
                      {events.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                          {ev.eventName} ({ev.eventType} • {ev.result})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Event / Hackathon Name</label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g. Smart India Hackathon 2026"
                      className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Organizer / College</label>
                    <input
                      type="text"
                      value={eventOrganizer}
                      onChange={(e) => setEventOrganizer(e.target.value)}
                      placeholder="e.g. IIT Madras / IEEE"
                      className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Result / Placement</label>
                    <select
                      value={eventResult}
                      onChange={(e) => setEventResult(e.target.value)}
                      className="w-full glass-input rounded-xl p-2.5 text-sm outline-none bg-card text-foreground"
                    >
                      <option value="winner">Winner (1st Place)</option>
                      <option value="runner-up">Runner-up (2nd/3rd Place)</option>
                      <option value="finalist">Finalist</option>
                      <option value="participated">Participated / Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Prize / Recognition</label>
                    <input
                      type="text"
                      value={eventPrize}
                      onChange={(e) => setEventPrize(e.target.value)}
                      placeholder="e.g. 1st Place Trophy & $1000"
                      className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Team & Teammates Section */}
                <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-950/25 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Users className="h-4 w-4 text-indigo-500" />
                      Team &amp; Teammates Information
                    </label>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/25">
                      {eventTeamSize === 0
                        ? "Solo Project"
                        : `${eventTeamSize} Teammate${eventTeamSize > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                        My Role in Team
                      </label>
                      <input
                        type="text"
                        value={eventRole}
                        onChange={(e) => setEventRole(e.target.value)}
                        placeholder="e.g. Lead Full-Stack Dev"
                        className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                        Team Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={eventTeamName}
                        onChange={(e) => setEventTeamName(e.target.value)}
                        placeholder="e.g. NeuralShift"
                        className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                        No. of Teammates
                      </label>
                      <select
                        value={eventTeamSize}
                        onChange={(e) => handleTeamSizeChange(Number(e.target.value))}
                        className="w-full glass-input rounded-xl p-2.5 text-sm outline-none bg-card text-foreground"
                      >
                        <option value={0}>0 (Solo / Individual)</option>
                        <option value={1}>1 Teammate</option>
                        <option value={2}>2 Teammates</option>
                        <option value={3}>3 Teammates</option>
                        <option value={4}>4 Teammates</option>
                        <option value={5}>5 Teammates</option>
                        <option value={6}>6+ Teammates</option>
                      </select>
                    </div>
                  </div>

                  {/* Teammate Names Dynamic Inputs */}
                  {eventTeamSize > 0 && (
                    <div className="space-y-2.5 pt-3 border-t border-indigo-500/15">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block text-[11px] text-indigo-300 font-semibold">
                            Teammate Names
                          </label>
                          <span className="text-[10px] text-muted-foreground">
                            AI will mention and tag each teammate in your post
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={addTeammate}
                          title="Add another teammate"
                          className="px-2.5 py-1 rounded-lg glass bg-indigo-500/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/30 transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Teammate
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {teammateNames.map((name, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-400 font-mono">
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => handleTeammateNameChange(idx, e.target.value)}
                                placeholder={`Teammate ${idx + 1} Name (e.g. Alex Chen)`}
                                className="w-full glass-input rounded-xl py-2 pl-8 pr-3 text-xs outline-none focus:border-indigo-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTeammate(idx)}
                              title="Remove teammate"
                              className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Project Title & Problem Statement</label>
                  <input
                    type="text"
                    value={eventProjectTitle}
                    onChange={(e) => setEventProjectTitle(e.target.value)}
                    placeholder="e.g. MedVigil — Real-time AI Patient Telemetry"
                    className="w-full glass-input rounded-xl p-2.5 text-sm outline-none mb-2"
                  />
                  <AutoResizeTextarea
                    value={eventProblem}
                    onChange={(e) => setEventProblem(e.target.value)}
                    placeholder="What real-world problem did your team solve during the event?"
                    minRows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Tech Stack & Tools</label>
                  <input
                    type="text"
                    value={eventTechStack}
                    onChange={(e) => setEventTechStack(e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js, Gemini AI, Docker"
                    className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    What did you build & what were the sleepless-night hurdles?
                  </label>
                  <AutoResizeTextarea
                    value={eventWhatBuilt}
                    onChange={(e) => setEventWhatBuilt(e.target.value)}
                    placeholder="e.g. In 36 hours we designed the architecture and live dashboard. At 3 AM our WebSocket pipeline threw race conditions, which we solved by..."
                    minRows={3}
                  />
                </div>
              </GlassCard>
            )}

            {/* OPTION 2: GITHUB REPOSITORIES FORM */}
            {sourceType === "github" && (
              <GlassCard className="p-6 space-y-4 border-blue-500/20">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Github className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">GitHub Project & Codebase Showcase</h2>
                      <p className="text-xs text-muted-foreground">Auto-populate from analyzed repositories</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    Option 2 of 2
                  </span>
                </div>

                {/* Repo Selector */}
                {githubHistory.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                      Pick from analyzed repositories:
                    </label>
                    <select
                      value={selectedRepoId}
                      onChange={(e) => {
                        const found = githubHistory.find((a) => a._id === e.target.value);
                        if (found) populateFromGitHub(found);
                      }}
                      className="w-full glass-input rounded-xl p-3 text-sm outline-none bg-card text-foreground border border-blue-500/30 focus:border-blue-500"
                    >
                      <option value="">-- Choose an analyzed repository --</option>
                      {githubHistory.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.repoFullName} ({a.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Repository Name (owner/repo)</label>
                    <input
                      type="text"
                      value={repoFullName}
                      onChange={(e) => setRepoFullName(e.target.value)}
                      placeholder="e.g. username/distributed-cache"
                      className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Repository URL</label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Tech Stack & Frameworks</label>
                  <input
                    type="text"
                    value={repoTechStack}
                    onChange={(e) => setRepoTechStack(e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js, Redis, MongoDB, Docker"
                    className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Project Overview & Architecture</label>
                  <AutoResizeTextarea
                    value={repoOverview}
                    onChange={(e) => setRepoOverview(e.target.value)}
                    placeholder="What does this repository accomplish? How is it architected?"
                    minRows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Resume Highlights & Performance Impact</label>
                  <AutoResizeTextarea
                    value={repoResumeImpact}
                    onChange={(e) => setRepoResumeImpact(e.target.value)}
                    placeholder="• Implemented in-memory caching reducing API latency by 45%&#10;• Designed modular REST APIs handling 5,000 requests/sec"
                    minRows={3}
                  />
                </div>
              </GlassCard>
            )}

            {/* TONE, DETAIL & HIGHLIGHTS */}
            <GlassCard className="p-6 space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <PenTool className="h-4 w-4 text-blue-400" />
                Writing Tone & Customization
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Post Tone:
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ToneType)}
                    className="w-full glass-input rounded-xl p-2.5 text-sm outline-none bg-card text-foreground"
                  >
                    <option value="exhaustive">Exhaustive Achievement Story (Story + Tech + Win)</option>
                    <option value="technical">Deep Technical & Architecture Breakdown</option>
                    <option value="storytelling">Engaging Narrative & Personal Journey</option>
                    <option value="executive">Executive Impact & Metrics</option>
                    <option value="celebratory">Celebratory & Grateful</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Detail Level:
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as LengthType)}
                    className="w-full glass-input rounded-xl p-2.5 text-sm outline-none bg-card text-foreground"
                  >
                    <option value="exhaustive">Exhaustive Deep-Dive (Multi-paragraph)</option>
                    <option value="standard">Standard Structured (Hook + Bullets)</option>
                    <option value="punchy">Quick & Punchy Update</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    Extra Highlights to Emphasize (Optional)
                  </label>
                  <input
                    type="text"
                    value={customHighlights}
                    onChange={(e) => setCustomHighlights(e.target.value)}
                    placeholder="e.g. Beat 120 teams, trained on 50k samples"
                    className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    People to Tag (Teammates / Mentors)
                  </label>
                  <input
                    type="text"
                    value={mentions}
                    onChange={(e) => setMentions(e.target.value)}
                    placeholder="e.g. @TeammateName, @Organizer"
                    className="w-full glass-input rounded-xl p-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={includeEmoji}
                    onChange={(e) => setIncludeEmoji(e.target.checked)}
                    className="rounded border-white/20 accent-blue-600"
                  />
                  Include Emojis
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="rounded border-white/20 accent-blue-600"
                  />
                  Trending Hashtags
                </label>
              </div>
            </GlassCard>

            {/* ATTACHMENTS & VISUALS */}
            <GlassCard className="p-6 space-y-4">
              <h2 className="text-base font-bold flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-400" />
                  Attach Photos & Social Share Cards
                </span>
                <span className="text-xs text-muted-foreground font-normal">Boosts impressions by 2.3x</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Custom Photo */}
                <div className="border-2 border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-blue-500/50 transition">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-semibold text-white">Upload Podium Photo / Screenshot</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, WebP up to 5MB</p>
                  <label className="mt-3 inline-block cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition">
                    Browse File
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {/* Generate AI Social Card */}
                <div className="border border-white/10 glass rounded-2xl p-4 text-center flex flex-col justify-between items-center">
                  <div>
                    <Award className="h-6 w-6 mx-auto text-indigo-400 mb-2" />
                    <p className="text-xs font-semibold text-white">Dynamic LinkedIn Graphic Card</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Auto-generate a 1200x630 branded achievement graphic
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateSocialCard}
                    disabled={isGeneratingCard}
                    className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-300 hover:from-indigo-500/30 hover:to-blue-500/30 border border-indigo-500/30 transition flex items-center gap-1.5"
                  >
                    {isGeneratingCard ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                    <span>Generate Share Card</span>
                  </button>
                </div>
              </div>

              {/* Event Certificate Auto-Attach button if available */}
              {sourceType === "event" && eventCertificateUrl && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-emerald-300">Verified Event Certificate Proof Found</p>
                      <p className="text-[11px] text-muted-foreground">Ready to attach as proof on your post</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedImagePreview(eventCertificateUrl);
                      setUseCertificateAsAttachment(true);
                      toast.success("Certificate attached to post preview!");
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition"
                  >
                    Attach Certificate
                  </button>
                </div>
              )}

              {/* Active Image Preview */}
              {attachedImagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-slate-950 p-2">
                  <img
                    src={attachedImagePreview}
                    alt="Attached post visual"
                    className="w-full max-h-56 object-cover rounded-xl"
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedImagePreview(null);
                        setAttachedImageFile(null);
                        setUseCertificateAsAttachment(false);
                      }}
                      className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-700 transition text-xs shadow-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between px-2 text-xs text-muted-foreground">
                    <span>
                      {useCertificateAsAttachment
                        ? "Verified Event Certificate"
                        : attachedImageFile
                        ? `Uploaded: ${attachedImageFile.name}`
                        : "AI Branded Achievement Card"}
                    </span>
                    <a
                      href={attachedImagePreview}
                      download="linkedin-achievement-card.png"
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Download image
                    </a>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full btn-gradient btn-gradient-hover rounded-2xl py-4 text-base font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Super Content & Variations...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Generate LinkedIn Super Content
                </>
              )}
            </button>
          </div>

          {/* Right Column: Live LinkedIn Mockup & Editor (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Dedicated Exhaustive Achievement Paragraph Callout */}
            {generatedResult?.achievementParagraph && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/30 via-blue-900/20 to-purple-900/30 border border-indigo-500/30 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Trophy className="h-4 w-4" />
                    Exhaustive Achievement Highlight
                  </div>
                  <button
                    onClick={() => handleCopy("para")}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    {copySuccess === "para" ? "Copied!" : "Copy Paragraph"}
                  </button>
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed italic">
                  "{generatedResult.achievementParagraph}"
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Tip: Perfect to include in resumes, portfolio pages, or LinkedIn featured posts.
                </p>
              </div>
            )}

            {/* Realistic LinkedIn Feed Mockup Card */}
            <div className="rounded-3xl border border-border/50 bg-card/95 dark:bg-[#0b1120]/90 p-5 shadow-2xl space-y-4 backdrop-blur-2xl text-foreground">
              {/* LinkedIn Post Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "ME"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-foreground hover:underline cursor-pointer">
                        {user?.name || "Student Developer"}
                      </p>
                      <span className="text-muted-foreground text-xs">• 1st</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight truncate max-w-[220px]">
                      {user?.targetRole || "Software Engineering Enthusiast"} | Campus to Career AI
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span>Just now</span>
                      <span>•</span>
                      <Globe className="h-3 w-3 text-muted-foreground" />
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Linkedin className="h-5 w-5 text-blue-500" />
                </div>
              </div>

              {/* Live Editor & Post Content */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-1 border-b border-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground tracking-wide">Live Post Editor</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/25">
                      Editable
                    </span>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/80 dark:bg-slate-900/90 border border-border/40 shadow-inner">
                    {/* Bold Button */}
                    <button
                      type="button"
                      onClick={handleInsertBold}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-background hover:bg-muted text-foreground transition shadow-sm border border-border/50"
                      title="Convert selected text to Bold Unicode (𝗕)"
                    >
                      <Bold className="h-3.5 w-3.5 text-blue-500" />
                      <span>Bold</span>
                    </button>

                    {/* Bullet List Button */}
                    <button
                      type="button"
                      onClick={handleInsertBullet}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-background hover:bg-muted text-foreground transition shadow-sm border border-border/50"
                      title="Add bullet list point"
                    >
                      <List className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Bullet</span>
                    </button>

                    <div className="h-4 w-px bg-border mx-0.5" />

                    {/* Quick Symbols Toolbar */}
                    <div className="flex items-center gap-1">
                      {[
                        { char: "• ", label: "Bullet" },
                        { char: "-> ", label: "Arrow" },
                        { char: "#", label: "Hashtag" },
                      ].map((item) => (
                        <button
                          key={item.char}
                          type="button"
                          onClick={() => handleInsertEmoji(item.char)}
                          className="h-7 px-2 rounded-lg bg-background hover:bg-muted text-xs font-mono text-foreground flex items-center justify-center transition border border-border/40"
                          title={`Insert ${item.label}`}
                        >
                          {item.char}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <AutoResizeTextarea
                  id="linkedin-draft-textarea"
                  value={activeDraftText}
                  onChange={(e) => setActiveDraftText(e.target.value)}
                  minRows={8}
                  placeholder={
                    generating
                      ? "Generating super content with AI..."
                      : "Your LinkedIn post draft will appear here. You can freely edit before copying or sharing!"
                  }
                  className="bg-transparent border border-border/30 text-xs md:text-sm text-foreground placeholder:text-muted-foreground p-3"
                />

                {/* Character & Readability counter */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/30">
                  <span>
                    {activeDraftText.length} characters • {activeDraftText.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Optimal LinkedIn Length</span>
                </div>
              </div>

              {/* Attached Photo in LinkedIn Feed */}
              {attachedImagePreview && (
                <div className="rounded-2xl overflow-hidden border border-border/40 bg-muted/40">
                  <img
                    src={attachedImagePreview}
                    alt="Attached preview"
                    className="w-full max-h-60 object-cover"
                  />
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy("all")}
                  disabled={!activeDraftText}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    copySuccess === "all"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-muted hover:bg-muted/80 text-foreground border border-border/60"
                  }`}
                >
                  <Copy className="h-4 w-4" />
                  {copySuccess === "all" ? "Copied Post!" : "Copy Post Text"}
                </button>

                <button
                  type="button"
                  onClick={handleShareOnLinkedIn}
                  disabled={!activeDraftText}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-[#0a66c2] hover:bg-[#084e96] text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share on LinkedIn
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!activeDraftText}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground hover:text-primary transition flex items-center justify-center gap-1.5 col-span-2 border border-border/40"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Save to My Drafts
                </button>
              </div>
            </div>

            {/* Suggested Hashtags */}
            {generatedResult?.suggestedHashtags && generatedResult.suggestedHashtags.length > 0 && (
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-blue-400" />
                    Recommended Viral Hashtags
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy("tags")}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Copy All Tags
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {generatedResult.suggestedHashtags.map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveDraftText((prev) => prev + ` ${tag}`)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* DRAFTS TAB */}
      {activeTab === "drafts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-blue-400" />
                Saved LinkedIn Post Drafts ({savedDrafts.length})
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Your past generated posts, variations, and exhaustive paragraphs saved locally.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("create")}
              className="btn-gradient btn-gradient-hover rounded-xl px-4 py-2 text-xs font-semibold"
            >
              + Create New Post
            </button>
          </div>

          {savedDrafts.length === 0 ? (
            <GlassCard className="text-center py-16">
              <Bookmark className="h-12 w-12 mx-auto text-slate-600" />
              <p className="text-sm text-muted-foreground mt-3">No saved drafts yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Generate a post and click "Save to My Drafts".
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedDrafts.map((d) => (
                <GlassCard key={d.id} className="p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          d.sourceType === "event"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {d.sourceType === "event" ? "Event" : "GitHub Repo"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{d.title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed whitespace-pre-line bg-black/30 p-3 rounded-xl border border-white/5 font-sans">
                      {d.draft}
                    </p>

                    {d.achievementParagraph && (
                      <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs italic">
                        "{d.achievementParagraph.slice(0, 150)}..."
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(d.draft);
                          toast.success("Draft copied to clipboard");
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold glass hover:bg-white/10 text-white flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDraftText(d.draft);
                          setSourceType(d.sourceType);
                          if (d.attachedImagePreview) setAttachedImagePreview(d.attachedImagePreview);
                          setActiveTab("create");
                          toast.success("Loaded draft into editor!");
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 flex items-center gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit in Studio
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(d.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Delete draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LinkedInPostsPage;