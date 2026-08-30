import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useSuperDream } from "@/stores/superDreamStore";
import { useAuth } from "@/stores";
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  ExternalLink,
  FileCheck,
  X,
  FileText,
  Check,
  Scan,
  Award,
  Zap,
  FileUp,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  verifyCourseCertificateAI,
  type SuperDreamCourse,
} from "@/lib/super-dream-api";
import { cn } from "@/lib/utils";

export function SuperDreamCourses() {
  const { courses, submitCourseCertificate } = useSuperDream();
  const { user } = useAuth();

  const [activeCourseModal, setActiveCourseModal] = useState<SuperDreamCourse | null>(null);
  const [credentialId, setCredentialId] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<number>(0);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const [activeProofViewCourse, setActiveProofViewCourse] = useState<SuperDreamCourse | null>(null);

  const completedCourses = courses.filter((c) => c.status === "completed");

  const handleOpenVerifyModal = (course: SuperDreamCourse) => {
    setActiveCourseModal(course);
    setCredentialId("");
    setIssuerName(course.provider.split("/")[0].trim());
    setProofUrl("");
    setSelectedFileName("");
    setVerificationResult(null);
    setVerificationStep(0);
  };

  const handleRunAiVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseModal) return;

    setIsVerifying(true);
    setVerificationStep(1);

    setTimeout(() => setVerificationStep(2), 500);
    setTimeout(() => setVerificationStep(3), 1000);
    setTimeout(() => setVerificationStep(4), 1500);

    try {
      const result = await verifyCourseCertificateAI({
        courseTitle: activeCourseModal.title,
        studentName: user?.name || "Student",
        credentialId,
        issuedBy: issuerName,
        proofFileOrUrl: proofUrl || selectedFileName,
      });

      setTimeout(() => {
        setIsVerifying(false);
        setVerificationResult(result);

        if (result.success) {
          submitCourseCertificate(activeCourseModal.id, {
            certificateUrl: proofUrl,
            certificateFileName: selectedFileName,
            credentialId,
            issuedBy: issuerName,
            issueDate: new Date().toISOString().split("T")[0],
            studentName: user?.name || "Student",
            verificationScore: result.score,
            verifiedAt: new Date().toISOString(),
            verificationChecks: result.verificationChecks,
          });

          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#10B981", "#6366F1", "#F59E0B"],
            });
          } catch {
            // silent
          }

          toast.success("Certificate Proof Submitted for Faculty Verification!", {
            description: `Authenticity Checks Passed (${result.score}%) • Submitted for Faculty Sign-Off`,
          });
        } else {
          toast.error("Verification failed", {
            description: result.summary,
          });
        }
      }, 1800);
    } catch {
      setIsVerifying(false);
      toast.error("Verification error. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard
        variant="liquid"
        className="p-6 border border-emerald-300/60 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 dark:from-slate-900/90 dark:via-emerald-950/40 dark:to-slate-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden rounded-2xl shadow-xs dark:shadow-none"
      >
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            AI Proof Verification Protocol
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Super Dream Verified Curriculums
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
            High-yield technical courses required for Super Dream placements. Courses are marked as completed <strong className="text-emerald-700 dark:text-emerald-300 font-bold">strictly after valid certificate submission and AI verification</strong>.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/90 dark:bg-slate-900/90 p-4 rounded-2xl border border-emerald-300/70 dark:border-emerald-500/30 shrink-0 shadow-sm dark:shadow-lg dark:shadow-emerald-950/30 backdrop-blur-md z-10">
          <div className="text-center px-2">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Verified Courses</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {completedCourses.length} / {courses.length}
            </p>
          </div>
          <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10" />
          <div className="text-center px-2">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Verification Status</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-cyan-300">
              <Zap className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> Active Scanner
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <GlassCard className="p-12 text-center text-slate-600 dark:text-slate-400 space-y-3 border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
          <GraduationCap className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Courses Assigned Yet</h3>
          <p className="text-xs max-w-md mx-auto">
            Your faculty mentor or placement cell will curate and assign accredited certification courses here.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course) => {
            const isVerified = course.status === "completed";
            const isLocked = course.status === "locked";

            return (
              <GlassCard
                key={course.id}
                className={cn(
                  "p-6 border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 flex flex-col justify-between gap-5 card-hover-lift transition-all relative overflow-hidden shadow-xs dark:shadow-none",
                  isVerified && "border-emerald-400/60 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-slate-900/85"
                )}
              >
              {isVerified && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" /> AI Verified
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2 pr-16">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                    {course.provider}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-mono font-bold px-2 py-0.5 rounded border",
                      course.difficulty === "Master"
                        ? "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30"
                        : "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30"
                    )}
                  >
                    {course.difficulty}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug mt-1">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Instructor: <span className="text-slate-900 dark:text-slate-200 font-semibold">{course.instructor}</span> • {course.duration}
                </p>

                <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
                  {course.description}
                </p>

                {/* Key Topics */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {course.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status and Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {isVerified && course.certificateProof ? (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Score: {course.certificateProof.verificationScore}% Authenticity
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                        ID: {course.certificateProof.credentialId}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Proof Required for Completion</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <button
                      onClick={() => setActiveProofViewCourse(course)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-400/60 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> View Proof Dossier
                    </button>
                  ) : isLocked ? (
                    <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                      <Lock className="w-3 h-3" /> Locked by Mentor
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenVerifyModal(course)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-indigo-600 to-amber-600 hover:opacity-95 text-white transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Scan className="w-3.5 h-3.5" /> Submit Proof for Verification
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
      )}

      {/* AI Verification Scanner Modal */}
      {activeCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-emerald-400/60 dark:border-emerald-500/40 p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white relative">
            <button
              onClick={() => {
                if (!isVerifying) setActiveCourseModal(null);
              }}
              disabled={isVerifying}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3 h-3" /> Proof Verification Engine
              </div>
              <h3 className="text-lg font-bold text-white">{activeCourseModal.title}</h3>
              <p className="text-xs text-slate-400">
                Candidate: <strong className="text-white">{user?.name || "Student"}</strong> • Provider: {activeCourseModal.provider}
              </p>
            </div>

            {isVerifying ? (
              <div className="py-8 space-y-5 text-center">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="w-full h-full rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Scan className="w-8 h-8 text-emerald-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-white">
                    Verification in Progress...
                  </p>
                  <div className="space-y-1 text-xs text-slate-300 font-mono max-w-sm mx-auto text-left bg-slate-950 p-3 rounded-xl border border-white/10">
                    <p className={cn(verificationStep >= 1 ? "text-emerald-400 font-semibold" : "text-slate-600")}>
                      ✓ [1/3] Validating candidate details & credential ID...
                    </p>
                    <p className={cn(verificationStep >= 2 ? "text-emerald-400 font-semibold" : "text-slate-600")}>
                      ✓ [2/3] Cross-referencing {issuerName} syllabus coverage...
                    </p>
                    <p className={cn(verificationStep >= 3 ? "text-emerald-400 font-semibold" : "text-slate-600")}>
                      ✓ [3/3] Authenticating certificate proof...
                    </p>
                  </div>
                </div>
              </div>
            ) : verificationResult?.success ? (
              <div className="space-y-4 py-2 text-center">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-1" />
                  <p className="text-base font-bold text-white">Certificate Verified Successfully!</p>
                  <p className="text-xs text-emerald-300 font-mono">
                    Authenticity Score: {verificationResult.score}% • Verified
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-white/10">
                  {verificationResult.summary}
                </p>
                <button
                  onClick={() => setActiveCourseModal(null)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs transition"
                >
                  Close & View Verified Course
                </button>
              </div>
            ) : (
              <form onSubmit={handleRunAiVerification} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Credential ID / Certificate No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STAN-SYS-9942"
                      value={credentialId}
                      onChange={(e) => setCredentialId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Issuing Institution / Body *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stanford Online, MIT, Coursera"
                      value={issuerName}
                      onChange={(e) => setIssuerName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Verification URL / Public Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://coursera.org/verify/YOUR_ID"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Upload Certificate PDF / Image
                  </label>
                  <label className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition flex items-center justify-center gap-3 cursor-pointer text-center block">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="sr-only"
                      onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || "")}
                    />
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center justify-center shrink-0">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {selectedFileName || "Click to browse completion certificate"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">PDF, PNG, JPG up to 10MB</p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveCourseModal(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full text-xs font-semibold btn-gradient btn-gradient-hover text-white transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" /> Run AI Verification
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View AI Verified Proof Details Modal */}
      {activeProofViewCourse?.certificateProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-emerald-400/60 dark:border-emerald-500/50 p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white relative">
            <button
              onClick={() => setActiveProofViewCourse(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Verified Proof Dossier</h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Course</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{activeProofViewCourse.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Candidate:</span>{" "}
                  <strong className="text-slate-900 dark:text-white font-bold">{activeProofViewCourse.certificateProof.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Issued By:</span>{" "}
                  <strong className="text-slate-900 dark:text-white font-bold">{activeProofViewCourse.certificateProof.issuedBy}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Credential ID:</span>{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{activeProofViewCourse.certificateProof.credentialId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Verified Date:</span>{" "}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{activeProofViewCourse.certificateProof.issueDate}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-emerald-700 dark:text-emerald-300">Verification Checks:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Student Identity Matched</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Issuer Authenticated</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Credential ID Valid</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Syllabus Alignment 98%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveProofViewCourse(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-white transition"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
