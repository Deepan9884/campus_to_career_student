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
    organizer: "Host Organization",
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
      <GlassCard className="p-6 border-amber-500/30 bg-gradient-to-r from-slate-900/90 via-amber-950/40 to-slate-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Competitive Accolades & Proofs
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Events, Hackathons & Competition Proofs
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
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
        <GlassCard className="p-4 border-cyan-500/30 bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Total Logged</p>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-300 font-mono mt-1">
            {stats?.totalEvents ?? events.length}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border-amber-500/30 bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Wins & Podiums</p>
            <Medal className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">
            {stats?.byResult?.winner ?? 2}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border-purple-500/30 bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Hackathons</p>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 font-mono mt-1">
            {stats?.byType?.hackathon ?? 3}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border-emerald-500/30 bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Verified Certificates</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {stats?.totalEvents ?? 4}
          </p>
        </GlassCard>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by event title, project, technologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
        >
          <option value="all">All Event Categories</option>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Loading event portfolio...
        </div>
      ) : events.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/10 text-center text-slate-400 space-y-3">
          <Trophy className="w-10 h-10 mx-auto text-amber-400/50" />
          <p className="font-semibold text-white text-sm">No events logged yet</p>
          <p className="text-xs max-w-sm mx-auto">
            Log your hackathon participations and contest achievements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((evt) => (
            <EventCard
              key={evt._id}
              event={evt}
              onEdit={() => handleOpenLogModal(evt)}
              onDelete={() => handleDelete(evt._id)}
              onViewCertificate={(url) => setCertificateViewUrl(url)}
            />
          ))}
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl space-y-4 text-white my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingEvent ? "Edit Event Proof" : "Log Event & Certificate"}
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                 <label className="text-slate-300 font-medium">Event Title *</label>
                 <input
                   type="text"
                   required
                   placeholder="e.g. Smart India Hackathon 2026"
                   value={formData.eventName}
                   onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                   className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                 />
               </div>

               <div className="grid grid-cols-3 gap-2.5">
                 <div className="space-y-1">
                   <label className="text-slate-300 font-medium">Category</label>
                   <select
                     value={formData.eventType}
                     onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
                     className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                   >
                     {EVENT_TYPE_OPTIONS.map((o) => (
                       <option key={o.value} value={o.value}>{o.label}</option>
                     ))}
                   </select>
                 </div>

                 <div className="space-y-1">
                   <label className="text-slate-300 font-medium">Level</label>
                   <select
                     value={formData.level}
                     onChange={(e) => setFormData({ ...formData, level: e.target.value as EventLevel })}
                     className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                   >
                     {LEVEL_OPTIONS.map((o) => (
                       <option key={o.value} value={o.value}>{o.label}</option>
                     ))}
                   </select>
                 </div>

                 <div className="space-y-1">
                   <label className="text-slate-300 font-medium">Result</label>
                   <select
                     value={formData.result}
                     onChange={(e) => setFormData({ ...formData, result: e.target.value as EventResult })}
                     className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                   >
                     {RESULT_OPTIONS.map((o) => (
                       <option key={o.value} value={o.value}>{o.label}</option>
                     ))}
                   </select>
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-slate-300 font-medium">Project Name</label>
                 <input
                   type="text"
                   placeholder="e.g. Distributed Consensus Engine"
                   value={formData.projectTitle || ""}
                   onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                   className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-slate-300 font-medium">Tech Stack (Press Enter)</label>
                 <input
                   type="text"
                   placeholder="e.g. React, Rust, Kafka"
                   value={techInput}
                   onChange={(e) => setTechInput(e.target.value)}
                   onKeyDown={handleAddTech}
                   className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                 />
                 <div className="flex flex-wrap gap-1.5 pt-1">
                   {formData.techStack?.map((t) => (
                     <span
                       key={t}
                       className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] flex items-center gap-1"
                     >
                       {t}
                       <button type="button" onClick={() => handleRemoveTech(t)}>
                         <X className="w-3 h-3 hover:text-white" />
                       </button>
                     </span>
                   ))}
                 </div>
               </div>

               <div className="space-y-1">
                 <div className="flex items-center justify-between">
                   <label className="text-slate-300 font-medium">Project Description</label>
                   <button
                     type="button"
                     onClick={handleGenerateDescription}
                     disabled={generatingDesc}
                     className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer flex items-center gap-1"
                   >
                     <Bot className="w-3 h-3" />
                     {generatingDesc ? "Drafting..." : "Draft with AI"}
                   </button>
                 </div>
                 <textarea
                   rows={3}
                   value={formData.description || ""}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 resize-none"
                 />
               </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Certificate Document</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-95 text-white font-bold cursor-pointer shadow-lg shadow-amber-500/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-white/20 p-5 space-y-3 relative text-white">
            <button
              onClick={() => setCertificateViewUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold">Certificate Document Preview</h3>
            <div className="h-[60vh] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
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
