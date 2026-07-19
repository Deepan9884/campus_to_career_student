import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const CURATED_ROLES = [
  // Software Engineering
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer (iOS)",
  "Mobile Developer (Android)",
  "Embedded Systems Engineer",
  // Data & AI
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI Research Engineer",
  "Business Intelligence Analyst",
  // Infrastructure
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Cloud Engineer",
  "Platform Engineer",
  "Security Engineer",
  "Network Engineer",
  // Product & Design
  "Product Manager",
  "Product Designer",
  "UX Designer",
  "UI Designer",
  "UX Researcher",
  // QA & Testing
  "QA Engineer",
  "Test Automation Engineer",
  "Software Development Engineer in Test (SDET)",
  // Management / Leadership
  "Engineering Manager",
  "Technical Lead",
  "CTO",
  "VP of Engineering",
  // Specialized
  "Blockchain Developer",
  "Game Developer",
  "AR/VR Developer",
  "Robotics Engineer",
  "Systems Administrator",
  "Database Administrator",
  "Solutions Architect",
  "Technical Writer",
  "Developer Advocate",
  "Data Privacy Engineer",
  "IT Support Specialist",
  "Business Analyst",
  "Scrum Master",
  "Release Engineer",
  "Build Engineer",
  "Firmware Engineer",
  "Hardware Engineer",
  "Signal Processing Engineer",
  "Computer Vision Engineer",
  "NLP Engineer",
];

interface TargetRoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TargetRoleSelect({
  value,
  onChange,
  placeholder = "e.g. Software Engineer",
  className,
}: TargetRoleSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return CURATED_ROLES;
    const q = query.toLowerCase();
    return CURATED_ROLES.filter((r) => r.toLowerCase().includes(q));
  }, [query]);

  const isExactMatch = CURATED_ROLES.some((r) => r.toLowerCase() === query.toLowerCase());
  const showCustomOption = query.trim().length > 0 && !isExactMatch;

  function select(role: string) {
    onChange(role);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className={cn("relative", className, open && "z-50")}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full glass-input rounded-xl px-3 py-2.5 text-sm text-left flex items-center justify-between gap-2 outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <div className="flex items-center gap-2 glass rounded-lg px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto p-1">
            {filtered.map((role) => (
              <li key={role}>
                <button
                  type="button"
                  onClick={() => select(role)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-lg transition",
                    value === role
                      ? "btn-gradient text-white"
                      : "hover:bg-white/10 text-slate-200",
                  )}
                >
                  {role}
                </button>
              </li>
            ))}

            {showCustomOption && (
              <>
                <li className="border-t border-white/10 my-1" />
                <li>
                  <button
                    type="button"
                    onClick={() => select(query.trim())}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-[color:var(--color-primary)] flex items-center gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Use &ldquo;{query.trim()}&rdquo; as custom role
                  </button>
                </li>
              </>
            )}

            {filtered.length === 0 && !showCustomOption && (
              <li className="px-3 py-4 text-xs text-muted-foreground text-center">
                No matching roles
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
