import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import {
  Edit2,
  Check,
  Printer,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/stores";

interface StudentProfileHeaderProps {
  onOpenPrintModal?: () => void;
}

export function StudentProfileHeader({ onOpenPrintModal }: StudentProfileHeaderProps) {
  const { user } = useAuth();
  const { studentChecklist, updateStudentProfile } = useSuperDream();
  const { profile } = studentChecklist;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name && profile.name !== "Student" && profile.name !== "Student Candidate" ? profile.name : user?.name || profile.name || "",
    registerNumber: profile.registerNumber || user?.profile?.registerNumber || "",
    department: profile.department || user?.profile?.department || "",
    batch: profile.batch || user?.profile?.batch || "",
    facultyMentor: profile.facultyMentor || user?.profile?.facultyMentor || "",
    currentSemester: profile.currentSemester || user?.profile?.currentSemester || "",
  });

  React.useEffect(() => {
    setFormData({
      name: profile.name && profile.name !== "Student" && profile.name !== "Student Candidate" ? profile.name : user?.name || profile.name || "",
      registerNumber: profile.registerNumber || user?.profile?.registerNumber || "",
      department: profile.department || user?.profile?.department || "",
      batch: profile.batch || user?.profile?.batch || "",
      facultyMentor: profile.facultyMentor || user?.profile?.facultyMentor || "",
      currentSemester: profile.currentSemester || user?.profile?.currentSemester || "",
    });
  }, [profile, user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentProfile(formData);
    setIsEditing(false);
    toast.success("Student profile updated successfully");
  };

  const inputClass =
    "w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.14] text-[var(--foreground)] text-xs placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.09] transition font-[var(--font-sans)]";

  return (
    <GlassCard variant="liquid" className="p-4 sm:p-5 relative overflow-hidden space-y-3.5 rounded-2xl">
      {/* Subtle aurora decoration */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[var(--primary)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[var(--accent)]/08 blur-2xl" />

      {/* College Institutional Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.25) 0%, rgba(249,168,212,0.15) 100%)", border: "1px solid rgba(167,139,250,0.3)" }}>
            <span className="text-[var(--primary)] font-extrabold text-[11px] tracking-wider">EEC</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-[var(--foreground)]">
                Easwari Engineering College
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)", color: "var(--primary)" }}>
                Autonomous
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] font-medium mt-0.5">
              Elite Placement Readiness Checklist — Target: ₹20 LPA & Above Product & Technology Roles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            style={{
              background: isEditing ? "rgba(134,239,172,0.15)" : "rgba(255,255,255,0.07)",
              border: isEditing ? "1px solid rgba(134,239,172,0.35)" : "1px solid rgba(255,255,255,0.14)",
              color: isEditing ? "#86EFAC" : "var(--foreground)",
            }}
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5 text-[var(--primary)]" />}
            <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
          </button>

          {onOpenPrintModal && (
            <button
              onClick={onOpenPrintModal}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              style={{
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.30)",
                color: "var(--primary)",
              }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Checklist</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Details or Edit Form */}
      <div className="relative z-10">
        {isEditing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { label: "Student Name", key: "name" },
              { label: "Register Number", key: "registerNumber" },
              { label: "Department", key: "department" },
              { label: "Batch", key: "batch" },
              { label: "Faculty Mentor", key: "facultyMentor" },
              { label: "Current Semester", key: "currentSemester" },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1">
                <label className="text-[var(--muted-foreground)] font-medium">{label}:</label>
                <input
                  type="text"
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}

            <div className="sm:col-span-2 lg:col-span-3 pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-full btn-gradient btn-gradient-hover text-xs font-semibold"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {[
              { label: "Student Name", value: profile.name && profile.name !== "Student" && profile.name !== "Student Candidate" ? profile.name : user?.name || profile.name || "Student", color: "var(--foreground)" },
              { label: "Register Number", value: profile.registerNumber || user?.profile?.registerNumber || "(Click Edit to add)", color: "var(--primary)" },
              { label: "Department", value: profile.department || user?.profile?.department || "(Click Edit to add)", color: "var(--foreground)" },
              { label: "Batch", value: profile.batch || user?.profile?.batch || "(Click Edit to add)", color: "var(--foreground)" },
              { label: "Faculty Mentor", value: profile.facultyMentor || user?.profile?.facultyMentor || "(Unassigned)", color: "#FDE68A" },
              { label: "Semester", value: profile.currentSemester || user?.profile?.currentSemester || "(Click Edit to add)", color: "var(--foreground)" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="p-2.5 rounded-xl space-y-0.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-[10px] uppercase font-medium text-[var(--muted-foreground)] tracking-wider">
                  {label}
                </span>
                <p
                  className="font-semibold truncate text-xs"
                  style={{ color }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
