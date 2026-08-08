import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/GlassCard";
import { EventCard } from "@/components/EventCard";
import {
  Trophy,
  Zap,
  Plus,
  Loader2,
  Search,
  Sparkles,
  Award,
  Calendar,
  X,
  FileText,
  Upload,
  Globe,
  Star,
  Code,
  Users,
  CheckCircle2,
  Trash2,
  Edit3,
  ExternalLink,
  Target,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  generateEventDescription,
  predictSkillGaps,
  getCertificateUrl,
} from "@/lib/events-api";
import type {
  Event,
  EventType,
  EventMode,
  EventLevel,
  EventResult,
  CreateEventPayload,
  EventStats,
} from "@/types/event";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events & Proofs — CareerForge AI" }] }),
  component: EventsPage,
});

const EVENT_TYPE_OPTIONS: Array<{ value: EventType; label: string }> = [
  { value: "hackathon", label: "Hackathon" },
  { value: "ideathon", label: "Ideathon" },
  { value: "coding-competition", label: "Coding Competition" },
  { value: "ctf", label: "CTF (Capture The Flag)" },
  { value: "game-jam", label: "Game Jam" },
  { value: "research-symposium", label: "Research Symposium" },
  { value: "startup-weekend", label: "Startup Weekend" },
  { value: "other", label: "Other" },
];

const MODE_OPTIONS: Array<{ value: EventMode; label: string }> = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

const LEVEL_OPTIONS: Array<{ value: EventLevel; label: string }> = [
  { value: "intra-college", label: "Intra-College" },
  { value: "inter-college", label: "Inter-College" },
  { value: "state", label: "State" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
];

const RESULT_OPTIONS: Array<{ value: EventResult; label: string }> = [
  { value: "winner", label: "Winner (1st Place)" },
  { value: "runner-up", label: "Runner-up (2nd/3rd Place)" },
  { value: "finalist", label: "Finalist" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "participated", label: "Participated" },
];

function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal states
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [certificateViewUrl, setCertificateViewUrl] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<{
    eventName: string;
    eventType: EventType;
    organizer: string;
    mode: EventMode;
    level: EventLevel;
    startDate: string;
    endDate: string;
    teamName: string;
    teamSize: number;
    role: string;
    teamMembersInput: string;
    projectTitle: string;
    problemStatement: string;
    techStackInput: string;
    description: string;
    result: EventResult;
    prize: string;
    projectLink: string;
    socialPostLink: string;
    certificateFile: File | null;
    whatILearned: string;
    whatIdDoDifferently: string;
    keyTakeawaysInput: string;
    rating: number;
    isPublic: boolean;
    featured: boolean;
  }>({
    eventName: "",
    eventType: "hackathon",
    organizer: "",
    mode: "online",
    level: "inter-college",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    teamName: "",
    teamSize: 1,
    role: "Developer",
    teamMembersInput: "",
    projectTitle: "",
    problemStatement: "",
    techStackInput: "",
    description: "",
    result: "participated",
    prize: "",
    projectLink: "",
    socialPostLink: "",
    certificateFile: null,
    whatILearned: "",
    whatIdDoDifferently: "",
    keyTakeawaysInput: "",
    rating: 5,
    isPublic: true,
    featured: false,
  });

  const fetchEvents = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getUserEvents(p, 12);
      setEvents(res.events || []);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatsData = useCallback(async () => {
    try {
      const data = await getEventStats();
      setStats(data);
    } catch {
      // silent catch for stats
    }
  }, []);

  useEffect(() => {
    fetchEvents(1);
    fetchStatsData();
  }, [fetchEvents, fetchStatsData]);

  const resetForm = () => {
    setFormData({
      eventName: "",
      eventType: "hackathon",
      organizer: "",
      mode: "online",
      level: "inter-college",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      teamName: "",
      teamSize: 1,
      role: "Developer",
      teamMembersInput: "",
      projectTitle: "",
      problemStatement: "",
      techStackInput: "",
      description: "",
      result: "participated",
      prize: "",
      projectLink: "",
      socialPostLink: "",
      certificateFile: null,
      whatILearned: "",
      whatIdDoDifferently: "",
      keyTakeawaysInput: "",
      rating: 5,
      isPublic: true,
      featured: false,
    });
    setEditingEvent(null);
  };

  const handleOpenEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      eventName: event.eventName || "",
      eventType: event.eventType || "hackathon",
      organizer: event.organizer || "",
      mode: event.mode || "online",
      level: event.level || "inter-college",
      startDate: event.startDate ? new Date(event.startDate).toISOString().split("T")[0] : "",
      endDate: event.endDate ? new Date(event.endDate).toISOString().split("T")[0] : "",
      teamName: event.teamName || "",
      teamSize: event.teamSize || 1,
      role: event.role || "",
      teamMembersInput: (event.teamMembers || []).join(", "),
      projectTitle: event.projectTitle || "",
      problemStatement: event.problemStatement || "",
      techStackInput: (event.techStack || []).join(", "),
      description: event.description || "",
      result: event.result || "participated",
      prize: event.prize || "",
      projectLink: event.projectLink || "",
      socialPostLink: event.socialPostLink || "",
      certificateFile: null,
      whatILearned: event.reflection?.whatILearned || "",
      whatIdDoDifferently: event.reflection?.whatIdDoDifferently || "",
      keyTakeawaysInput: (event.reflection?.keyTakeaways || []).join("\n"),
      rating: event.reflection?.rating || 5,
      isPublic: event.isPublic ?? true,
      featured: false,
    });
    setShowLogModal(true);
  };

  const handleGenerateAIDescription = async () => {
    if (!formData.eventType) return;
    setGeneratingAI(true);
    try {
      const techArr = formData.techStackInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await generateEventDescription({
        eventType: formData.eventType,
        projectTitle: formData.projectTitle,
        problemStatement: formData.problemStatement,
        techStack: techArr,
        result: formData.result,
      });

      if (res.description) {
        setFormData((prev) => ({
          ...prev,
          description: res.description,
          whatILearned: res.reflection?.whatILearned || prev.whatILearned,
          whatIdDoDifferently: res.reflection?.whatIdDoDifferently || prev.whatIdDoDifferently,
          keyTakeawaysInput: (res.reflection?.keyTakeaways || []).join("\n"),
        }));
        toast.success("Generated description & reflection!");
      }
    } catch {
      toast.error("Failed to generate AI description");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim()) {
      toast.error("Please enter event name");
      return;
    }
    if (!editingEvent && !formData.certificateFile) {
      toast.error("Please upload a certificate proof");
      return;
    }

    setSubmitting(true);
    try {
      const techStack = formData.techStackInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const teamMembers = formData.teamMembersInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const keyTakeaways = formData.keyTakeawaysInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const reflectionData = {
        whatILearned: formData.whatILearned,
        whatIdDoDifferently: formData.whatIdDoDifferently,
        keyTakeaways,
        rating: formData.rating,
      };

      if (editingEvent) {
        await updateEvent(editingEvent._id, {
          eventName: formData.eventName,
          eventType: formData.eventType,
          organizer: formData.organizer,
          mode: formData.mode,
          level: formData.level,
          startDate: formData.startDate,
          endDate: formData.endDate,
          teamName: formData.teamName || undefined,
          teamSize: formData.teamSize,
          role: formData.role || undefined,
          teamMembers,
          projectTitle: formData.projectTitle || undefined,
          problemStatement: formData.problemStatement || undefined,
          techStack,
          description: formData.description || undefined,
          result: formData.result,
          prize: formData.prize || undefined,
          projectLink: formData.projectLink || undefined,
          socialPostLink: formData.socialPostLink || undefined,
          certificate: formData.certificateFile || undefined,
          reflection: reflectionData,
          isPublic: formData.isPublic,
        });
        toast.success("Event updated successfully!");
      } else {
        const payload: CreateEventPayload = {
          eventName: formData.eventName,
          eventType: formData.eventType,
          organizer: formData.organizer,
          mode: formData.mode,
          level: formData.level,
          startDate: formData.startDate,
          endDate: formData.endDate,
          teamName: formData.teamName || undefined,
          teamSize: formData.teamSize,
          role: formData.role || undefined,
          teamMembers,
          projectTitle: formData.projectTitle || undefined,
          problemStatement: formData.problemStatement || undefined,
          techStack,
          description: formData.description || undefined,
          result: formData.result,
          prize: formData.prize || undefined,
          projectLink: formData.projectLink || undefined,
          socialPostLink: formData.socialPostLink || undefined,
          certificate: formData.certificateFile!,
          reflection: reflectionData,
          isPublic: formData.isPublic,
        };
        await createEvent(payload);
        toast.success("Event logged successfully! Skills auto-updated.");
      }

      setShowLogModal(false);
      resetForm();
      fetchEvents(1);
      fetchStatsData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr.message || "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      toast.success("Event deleted");
      setEvents((prev) => prev.filter((e) => e._id !== id));
      fetchStatsData();
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAnalyzeGaps = async (eventId: string) => {
    try {
      const result = await predictSkillGaps(eventId);
      toast.success(
        `Identified ${result.predictedSkills.length} recommended skills to strengthen!`
      );
      navigate({ to: "/skills" });
    } catch {
      navigate({ to: "/skills" });
    }
  };

  // Filtering
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.organizer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.projectTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === "all") return true;
    if (selectedCategory === "winners") return ev.result === "winner" || ev.result === "runner-up";
    if (selectedCategory === "hackathons") return ev.eventType === "hackathon";
    if (selectedCategory === "competitions") return ev.eventType === "coding-competition";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-amber-400" />
            Events & Proofs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Showcase your hackathons, ideathons, and verified proof of participation.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowLogModal(true);
          }}
          className="btn-gradient btn-gradient-hover rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus className="h-4 w-4" /> Log Event / Proof
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 grid place-items-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Events</p>
            <p className="text-xl font-bold">{stats?.totalEvents ?? events.length}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 grid place-items-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Victories</p>
            <p className="text-xl font-bold">
              {stats?.byResult ? (stats.byResult.winner || 0) + (stats.byResult["runner-up"] || 0) : 0}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-500/20 text-green-400 grid place-items-center shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-xl font-bold">{stats?.winRate ?? 0}%</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 grid place-items-center shrink-0">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unique Techs</p>
            <p className="text-xl font-bold">{stats?.uniqueTechStack ?? 0}</p>
          </div>
        </GlassCard>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: "all", label: "All Events" },
              { id: "hackathons", label: "Hackathons" },
              { id: "competitions", label: "Coding Competitions" },
              { id: "winners", label: "Winners & Podium" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                  selectedCategory === tab.id
                    ? "bg-white/20 text-foreground shadow"
                    : "glass hover:bg-white/10 text-muted-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events or tech..."
              className="w-full glass-input rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            />
          </div>
        </div>
      </GlassCard>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-3">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-lg font-semibold">No events logged yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Log your hackathon participations, ideathon wins, or competition proofs to strengthen your career profile and verify skills.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowLogModal(true);
            }}
            className="btn-gradient btn-gradient-hover rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="h-3.5 w-3.5" /> Add Your First Event
          </button>
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredEvents.map((ev) => (
            <div key={ev._id} className="relative group">
              <EventCard
                event={ev}
                onAnalyzeGaps={handleAnalyzeGaps}
                onViewCertificate={(url) => setCertificateViewUrl(url)}
                onEdit={handleOpenEdit}
                onDelete={(id) => setDeletingId(id)}
              />
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(ev);
                  }}
                  className="p-1.5 rounded-lg glass hover:bg-white/20 text-muted-foreground hover:text-foreground"
                  title="Edit event"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingId(ev._id);
                  }}
                  className="p-1.5 rounded-lg glass hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
                  title="Delete event"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => fetchEvents(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="text-xs px-3 py-1.5 rounded-xl glass disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground py-1.5">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchEvents(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="text-xs px-3 py-1.5 rounded-xl glass disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Log / Edit Event Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <GlassCard variant="strong" className="max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                {editingEvent ? "Edit Event" : "Log Event / Proof"}
              </h2>
              <button
                onClick={() => {
                  setShowLogModal(false);
                  resetForm();
                }}
                className="hover:text-red-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Event Name & Type */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    placeholder="e.g. Smart India Hackathon 2026"
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Event Type *
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value as EventType })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none bg-slate-900"
                  >
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Organizer, Mode, Level */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Organizer
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    placeholder="e.g. Govt of India / IEEE"
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Mode *</label>
                  <select
                    value={formData.mode}
                    onChange={(e) =>
                      setFormData({ ...formData, mode: e.target.value as EventMode })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none bg-slate-900"
                  >
                    {MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Level *</label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value as EventLevel })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none bg-slate-900"
                  >
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates & Result */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Result *</label>
                  <select
                    value={formData.result}
                    onChange={(e) =>
                      setFormData({ ...formData, result: e.target.value as EventResult })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none bg-slate-900"
                  >
                    {RESULT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Certificate Upload & Prize */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Certificate Proof {!editingEvent && "*"} (.pdf, .png, .jpg)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    required={!editingEvent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificateFile: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-foreground hover:file:bg-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Prize / Award Details
                  </label>
                  <input
                    type="text"
                    value={formData.prize}
                    onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                    placeholder="e.g. ₹50,000 Cash Prize + Trophy"
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Project Title & Problem Statement */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    placeholder="e.g. AI MedAssist"
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Tech Stack (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.techStackInput}
                    onChange={(e) => setFormData({ ...formData, techStackInput: e.target.value })}
                    placeholder="React, Node.js, MongoDB, Python"
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Problem Statement & Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Problem Statement
                </label>
                <input
                  type="text"
                  value={formData.problemStatement}
                  onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                  placeholder="Short description of the challenge statement solved"
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Project Description
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={generatingAI}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {generatingAI ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate with AI
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your project, features, and key achievements..."
                  className="w-full glass-input rounded-xl p-3 text-sm outline-none resize-none"
                />
              </div>

              {/* Links & Team */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Project Demo / GitHub Link
                  </label>
                  <input
                    type="url"
                    value={formData.projectLink}
                    onChange={(e) => setFormData({ ...formData, projectLink: e.target.value })}
                    placeholder="https://github.com/username/project"
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    LinkedIn / Post Link
                  </label>
                  <input
                    type="url"
                    value={formData.socialPostLink}
                    onChange={(e) => setFormData({ ...formData, socialPostLink: e.target.value })}
                    placeholder="https://linkedin.com/posts/..."
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Reflections */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Personal Reflection & Learnings
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      What did you learn?
                    </label>
                    <textarea
                      rows={2}
                      value={formData.whatILearned}
                      onChange={(e) => setFormData({ ...formData, whatILearned: e.target.value })}
                      placeholder="Technical & soft skills acquired..."
                      className="w-full glass-input rounded-xl p-2.5 text-xs outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      What would you do differently?
                    </label>
                    <textarea
                      rows={2}
                      value={formData.whatIdDoDifferently}
                      onChange={(e) =>
                        setFormData({ ...formData, whatIdDoDifferently: e.target.value })
                      }
                      placeholder="Future improvements & architectural choices..."
                      className="w-full glass-input rounded-xl p-2.5 text-xs outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogModal(false);
                    resetForm();
                  }}
                  className="glass rounded-xl px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingEvent ? "Update Event" : "Save Event & Verify Skills"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {certificateViewUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md p-4">
          <GlassCard variant="strong" className="max-w-3xl w-full p-4 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" /> Certificate Proof
              </h3>
              <button onClick={() => setCertificateViewUrl(null)} className="hover:text-red-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="w-full h-[60vh] bg-black/40 rounded-xl overflow-hidden flex items-center justify-center">
              {certificateViewUrl.endsWith(".pdf") ? (
                <iframe src={certificateViewUrl} className="w-full h-full border-0" />
              ) : (
                <img
                  src={certificateViewUrl}
                  alt="Certificate Proof"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}
            </div>
            <div className="flex justify-between items-center mt-3">
              <a
                href={certificateViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> Open in New Tab
              </a>
              <button
                onClick={() => setCertificateViewUrl(null)}
                className="glass rounded-xl px-4 py-1.5 text-xs"
              >
                Close
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard variant="strong" className="max-w-md w-full">
            <h3 className="text-lg font-bold">Delete event?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This permanently removes this event record and certificate proof. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setDeletingId(null)}
                className="glass rounded-xl px-4 py-2 text-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-xl px-4 py-2 text-sm flex-1 bg-red-500/30 text-red-100 hover:bg-red-500/50"
              >
                Delete
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
