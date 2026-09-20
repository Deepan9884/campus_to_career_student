import React, { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/GlassCard";
import { EventCard } from "@/components/EventCard";
import {
  Trophy,
  Plus,
  Loader2,
  Search,
  X,
  FileText,
  Bot,
  Award,
  Medal,
  Flame,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  generateEventDescription,
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

const EVENT_TYPE_OPTIONS: Array<{ value: EventType; label: string }> = [
  { value: "hackathon", label: "Hackathon" },
  { value: "ideathon", label: "Ideathon" },
  { value: "coding-competition", label: "Coding Competition" },
  { value: "ctf", label: "CTF" },
  { value: "game-jam", label: "Game Jam" },
  { value: "research-symposium", label: "Research Symposium" },
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
  { value: "national", label: "National" },
  { value: "international", label: "International" },
];

const RESULT_OPTIONS: Array<{ value: EventResult; label: string }> = [
  { value: "winner", label: "Winner (1st Place)" },
  { value: "runner-up", label: "Runner-up" },
  { value: "finalist", label: "Finalist" },
  { value: "participated", label: "Participated" },
];

export function SuperDreamEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [showLogModal, setShowLogModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [certificateViewUrl, setCertificateViewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    eventName: string;
    eventType: EventType;
    organizer: string;
    mode: EventMode;
    level: EventLevel;
    result: EventResult;
    teamSize: number;
    teamName: string;
    projectTitle: string;
    description: string;
    techStack: string[];
    tags: string[];
    startDate: string;
    endDate: string;
    certificateUrl?: string;
  }>({
    eventName: "",
    eventType: "hackathon",
    organizer: "",
    mode: "online",
    level: "national",
    result: "participated",
    teamSize: 1,
    teamName: "",
    projectTitle: "",
    description: "",
    techStack: [],
    tags: [],
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [techInput, setTechInput] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserEvents(page, 10);
      setEvents(res.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadStats = useCallback(async () => {
    try {
      const res = await getEventStats();
      setStats(res);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [loadEvents, loadStats]);

  const handleOpenLogModal = (evt?: Event) => {
    if (evt) {
      setEditingEvent(evt);
      setFormData({
        eventName: evt.eventName || "",
        eventType: evt.eventType,
        organizer: evt.organizer || "",
        mode: evt.mode,
        level: evt.level,
        result: evt.result,
        teamSize: evt.teamSize,
        teamName: evt.teamName || "",
        projectTitle: evt.projectTitle || "",
        description: evt.description || "",
        techStack: evt.techStack || [],
        tags: evt.tags || [],
        startDate: evt.startDate?.split("T")[0] || "",
        endDate: evt.endDate?.split("T")[0] || "",
        certificateUrl: evt.certificateUrl,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        eventName: "",
        eventType: "hackathon",
        organizer: "Hackathon Org",
        mode: "online",
        level: "national",
        result: "participated",
        teamSize: 1,
        teamName: "",
        projectTitle: "",
        description: "",
        techStack: [],
        tags: [],
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      });
    }
    setTechInput("");
    setCertificateFile(null);
    setShowLogModal(true);
  };

  const handleAddTech = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && techInput.trim()) {
      e.preventDefault();
      if (!formData.techStack?.includes(techInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          techStack: [...(prev.techStack || []), techInput.trim()],
        }));
      }
      setTechInput("");
    }
  };

  const handleRemoveTech = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack?.filter((t) => t !== tech),
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.projectTitle && !formData.eventName) {
      toast.error("Enter project name or event title first");
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await generateEventDescription({
        eventType: formData.eventType,
        projectTitle: formData.projectTitle || formData.eventName,
        techStack: formData.techStack,
      });
      setFormData((prev) => ({ ...prev, description: res.description }));
      toast.success("AI description drafted");
    } catch {
      toast.error("Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim()) {
      toast.error("Event title is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        ...formData,
        certificate: certificateFile || undefined,
      };
      if (editingEvent) {
        await updateEvent(editingEvent._id, payload);
        toast.success("Event proof updated");
      } else {
        await createEvent(payload);
        toast.success("Event successfully logged into portfolio!");
      }
      setShowLogModal(false);
      loadEvents();
      loadStats();
    } catch {
      toast.error("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      toast.success("Event removed");
      loadEvents();
      loadStats();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard className="p-6 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-slate-900/90 dark:via-amber-950/40 dark:to-slate-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Competitive Accolades & Proofs
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Events, Hackathons & Competition Proofs
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Showcase your hackathon projects, competitive wins, and credentials for recruiter vetting.
          </p>
        </div>

        <button
          onClick={() => handleOpenLogModal()}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Log Event Proof
        </button>
      </GlassCard>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 border-cyan-500/30 bg-card/80 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Total Logged</p>
            <Calendar className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-300 font-mono mt-1">
            {stats?.totalEvents ?? events.length}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border-amber-500/30 bg-card/80 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Wins & Podiums</p>
            <Medal className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-300 font-mono mt-1">
            {stats?.byResult?.winner ?? 2}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border-purple-500/30 bg-card/80 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Hackathons</p>
            <Flame className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-300 font-mono mt-1">
            {stats?.byType?.hackathon ?? 3}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border-emerald-500/30 bg-card/80 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Verified Certificates</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {events.filter((e) => !!e.certificateUrl).length}
          </p>
        </GlassCard>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by event title, project, technologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card dark:bg-slate-900/80 border border-border/80 dark:border-slate-800 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-xs transition"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-card dark:bg-slate-900/80 border border-border/80 dark:border-slate-800 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-xs cursor-pointer transition"
        >
          <option value="all" className="bg-popover text-foreground">All Event Categories</option>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-popover text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      {(() => {
        const filteredEvents = events
          .filter((e) => selectedCategory === "all" || e.eventType === selectedCategory)
          .filter((e) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              e.eventName?.toLowerCase().includes(q) ||
              e.projectTitle?.toLowerCase().includes(q) ||
              e.techStack?.some((t) => t.toLowerCase().includes(q)) ||
              e.organizer?.toLowerCase().includes(q)
            );
          });

        if (loading) {
          return (
            <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Loading event portfolio...
            </div>
          );
        }

        if (filteredEvents.length === 0) {
          return (
            <GlassCard className="p-12 text-center space-y-4 border-dashed border-border/80 dark:border-slate-800 bg-card/60 dark:bg-slate-900/40 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-500 dark:text-amber-400 shadow-xs">
                <Trophy className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-base">
                  {events.length === 0 ? "No events logged yet" : "No matching events found"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {events.length === 0
                    ? "Log your hackathon participations, competitive coding wins, and credentials to showcase to mentors and recruiters."
                    : "Try clearing your search query or selecting a different category."}
                </p>
              </div>
              {events.length === 0 && (
                <button
                  onClick={() => handleOpenLogModal()}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Log First Event Proof
                </button>
              )}
            </GlassCard>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((evt) => (
              <EventCard
                key={evt._id}
                event={evt}
                onEdit={() => handleOpenLogModal(evt)}
                onDelete={() => handleDelete(evt._id)}
                onViewCertificate={(url) => setCertificateViewUrl(url)}
              />
            ))}
          </div>
        );
      })()}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-card text-card-foreground border border-border/80 dark:border-amber-500/30 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold text-foreground">
                {editingEvent ? "Edit Event Proof" : "Log Event & Certificate"}
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-foreground font-medium">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2026"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/40 dark:bg-slate-950 border border-border dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-foreground font-medium">Category</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 dark:bg-slate-950 border border-border dark:border-slate-700 text-foreground focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
                  >
                    {EVENT_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-popover text-foreground">{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-foreground font-medium">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as EventLevel })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 dark:bg-slate-950 border border-border dark:border-slate-700 text-foreground focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
                  >
                    {LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-popover text-foreground">{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-foreground font-medium">Result</label>
                  <select
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value as EventResult })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 dark:bg-slate-950 border border-border dark:border-slate-700 text-foreground focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
                  >
                    {RESULT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-popover text-foreground">{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-foreground font-medium">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Consensus Engine"
                  value={formData.projectTitle || ""}
                  onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/40 dark:bg-slate-950 border border-border dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-foreground font-medium">Tech Stack (Press Enter)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Rust, Kafka"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleAddTech}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/40 dark:bg-slate-950 border border-border dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.techStack?.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] flex items-center gap-1 font-medium"
                    >
                      {t}
                      <button type="button" onClick={() => handleRemoveTech(t)}>
                        <X className="w-3 h-3 hover:text-destructive" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-foreground font-medium">Project Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDesc}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:brightness-110 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Bot className="w-3 h-3" />
                    {generatingDesc ? "Drafting..." : "Draft with AI"}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/40 dark:bg-slate-950 border border-border dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-foreground font-medium">Certificate Document</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  className="w-full text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-95 text-white font-bold cursor-pointer shadow-lg shadow-amber-500/20 transition"
                >
                  {submitting ? "Saving..." : "Save Event Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Viewer */}
      {certificateViewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-card text-card-foreground border border-border/80 dark:border-white/20 p-5 space-y-3 relative shadow-2xl">
            <button
              onClick={() => setCertificateViewUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-foreground">Certificate Document Preview</h3>
            <div className="h-[60vh] bg-muted/30 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-border">
              <iframe
                src={certificateViewUrl}
                title="Certificate Preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
