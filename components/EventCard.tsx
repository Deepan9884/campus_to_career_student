"use client";

import { GlassCard } from "@/components/GlassCard";
import { formatEventDateRange, getCertificateUrl, calculateWinRate, getUniqueTechStack, downloadICS } from "@/lib/events-api";
import {
  Calendar,
  Trophy,
  Users,
  Code,
  Globe,
  Link2,
  FileText,
  Star,
  MapPin,
  Zap,
  Lightbulb,
  Terminal,
  Award,
  ExternalLink,
  ChevronRight,
  Eye,
  Share2,
  Flag,
  Target,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Event, EventType, EventResult, EventLevel } from "@/types/event";

interface EventCardProps {
  event: Event;
  variant?: "default" | "compact" | "featured";
  onAnalyzeGaps?: (eventId: string) => void;
  onViewCertificate?: (url: string) => void;
  onShare?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
}

export function EventCard({
  event,
  variant = "default",
  onAnalyzeGaps,
  onViewCertificate,
  onShare,
  onEdit,
  onDelete,
}: EventCardProps) {
  const navigate = useNavigate();
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  const handleClick = () => {
    if (!isCompact) {
      navigate({ to: `/events/${event._id}` });
    }
  };

  const eventTypeColors: Record<EventType, string> = {
    hackathon: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ideathon: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "coding-competition": "bg-green-500/20 text-green-400 border-green-500/30",
    ctf: "bg-red-500/20 text-red-400 border-red-500/30",
    "game-jam": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "research-symposium": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "startup-weekend": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  const resultColors: Record<EventResult, string> = {
    winner: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "runner-up": "bg-slate-300/20 text-slate-300 border-slate-300/30",
    finalist: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    shortlisted: "bg-green-500/20 text-green-400 border-green-500/30",
    participated: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  const levelColors: Record<EventLevel, string> = {
    "intra-college": "bg-gray-500/20 text-gray-400",
    "inter-college": "bg-blue-500/20 text-blue-400",
    state: "bg-green-500/20 text-green-400",
    national: "bg-purple-500/20 text-purple-400",
    international: "bg-amber-500/20 text-amber-400",
  };

  const eventTypeIcons: Record<EventType, typeof Zap> = {
    hackathon: Zap,
    ideathon: Lightbulb,
    "coding-competition": Terminal,
    ctf: Flag,
    "game-jam": Award,
    "research-symposium": FileText,
    "startup-weekend": Target,
    other: Calendar,
  };

  const EventTypeIcon = eventTypeIcons[event.eventType] || Calendar;

  if (isCompact) {
    return (
      <GlassCard className="p-4 hover:-translate-y-0.5 transition-transform cursor-pointer" onClick={handleClick}>
        <div className="flex items-start gap-3">
          <div className={cn("h-10 w-10 rounded-xl grid place-items-center shrink-0", eventTypeColors[event.eventType])}>
            <EventTypeIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate">{event.eventName}</h3>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", resultColors[event.result])}>
                {event.result.replace("-", " ")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{event.projectTitle || event.problemStatement || "No project details"}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {formatEventDateRange(event.startDate, event.endDate)}</span>
              <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {event.teamSize} members</span>
              <span className="flex items-center gap-1"><Code className="h-2.5 w-2.5" /> {event.techStack.length} tech</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {event.techStack.slice(0, 4).map((tech) => (
                <span key={tech} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                  {tech}
                </span>
              ))}
              {event.techStack.length > 4 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                  +{event.techStack.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className={cn(
        "p-5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
        isFeatured && "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-white/20 shadow-[0_0_40px_rgba(124,58,237,0.15)]",
        event.portfolio?.featured && "ring-2 ring-amber-500/50"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", eventTypeColors[event.eventType])}>
            <EventTypeIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate max-w-[300px]">{event.eventName}</h3>
              {event.portfolio?.featured && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              {event.portfolio?.isPublic && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Public
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{event.organizer}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatEventDateRange(event.startDate, event.endDate)}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.mode}</span>
              <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", levelColors[event.level])}>
                {event.level.replace("-", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", resultColors[event.result])}>
            {event.result === "runner-up" ? "Runner-up" : event.result.charAt(0).toUpperCase() + event.result.slice(1)}
          </span>
        </div>
      </div>

      {event.projectTitle && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="font-medium">{event.projectTitle}</p>
          {event.problemStatement && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.problemStatement}</p>
          )}
        </div>
      )}

      {event.techStack.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {event.techStack.slice(0, isFeatured ? 8 : 6).map((tech) => (
            <span key={tech} className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 transition">
              {tech}
            </span>
          ))}
          {event.techStack.length > (isFeatured ? 8 : 6) && (
            <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted-foreground">
              +{event.techStack.length - (isFeatured ? 8 : 6)} more
            </span>
          )}
        </div>
      )}

      {event.reflection?.whatDidYouLearn && (
        <div className="mt-4 pt-4 border-t border-white/10 bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Lightbulb className="h-3 w-3" />
            <span>Reflection</span>
          </div>
          <p className="text-sm text-slate-300 line-clamp-2">{event.reflection.whatDidYouLearn}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {calculateWinRate([event])}% win rate</span>
          <span className="flex items-center gap-1"><Code className="h-3 w-3" /> {getUniqueTechStack([event]).length} techs</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.teamSize} members</span>
        </div>

        <div className="flex items-center gap-2">
          {onAnalyzeGaps && (
            <button
              onClick={(e) => { e.stopPropagation(); onAnalyzeGaps(event._id); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition flex items-center gap-1"
            >
              <Target className="h-3 w-3" /> Analyze Gaps
            </button>
          )}
          {event.certificateUrl && onViewCertificate && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewCertificate(getCertificateUrl(event.certificateUrl)); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition flex items-center gap-1"
            >
              <FileText className="h-3 w-3" /> Certificate
            </button>
          )}
          {event.projectLink && (
            <a
              href={event.projectLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> Project
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadICS(event);
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition flex items-center gap-1 text-xs"
            title="Add to Calendar"
          >
            <Calendar className="h-3 w-3" /> <span className="hidden sm:inline">Calendar</span>
          </button>
          {onShare && (
            <button
              onClick={(e) => { e.stopPropagation(); onShare(event); }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
              aria-label="Share event"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}