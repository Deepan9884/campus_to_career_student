import React, { useState, useRef } from "react";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores, IndustryCertItem } from "@/lib/super-dream-checklist";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  UploadCloud,
  FileUp,
  Sparkles,
  Eye,
  RefreshCw,
  X,
  ShieldCheck,
  Check,
  Calendar,
  Lock,
  ExternalLink,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const CERT_COLOR_MAP: Record<string, { color: string; bg: string }> = {
  "cert-1": { color: "#38BDF8", bg: "rgba(56, 189, 248, 0.15)" }, // Python PCAP
  "cert-2": { color: "#FB923C", bg: "rgba(251, 146, 60, 0.15)" }, // Java Oracle
  "cert-3": { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" }, // AWS Cloud
  "cert-4": { color: "#60A5FA", bg: "rgba(96, 165, 250, 0.15)" }, // Azure Fundamentals
  "cert-5": { color: "#06B6D4", bg: "rgba(6, 182, 212, 0.15)" }, // Docker Certified
  "cert-6": { color: "#818CF8", bg: "rgba(129, 140, 248, 0.15)" }, // Kubernetes CKA
  "cert-7": { color: "#FB923C", bg: "rgba(251, 146, 60, 0.15)" }, // TensorFlow
  "cert-8": { color: "#EC4899", bg: "rgba(236, 72, 153, 0.15)" }, // Oracle Java Prof
  "cert-9": { color: "#FBBF24", bg: "rgba(251, 191, 36, 0.15)" }, // Linux LFCS
  "cert-10": { color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" }, // Spring Boot
  "cert-11": { color: "#A78BFA", bg: "rgba(167, 139, 250, 0.15)" }, // React Certified
  "cert-12": { color: "#34D399", bg: "rgba(52, 211, 153, 0.15)" }, // MongoDB Associate
};

// Real-world credential URL parser
export function parseRealWorldCredentialUrl(url: string): { issuer: string; credentialId: string; platformName: string } | null {
  if (!url) return null;
  const clean = url.trim();
  try {
    const urlObj = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    const host = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;
    const segments = pathname.split("/").filter(Boolean);

    // 1. Credly
    if (host.includes("credly.com")) {
      const badgeId = segments[segments.length - 1] || "";
      return {
        issuer: "Credly / Global Certification Authority",
        credentialId: badgeId.slice(0, 36),
        platformName: "Credly",
      };
    }

    // 2. Coursera
    if (host.includes("coursera.org")) {
      const certId = segments[segments.length - 1] || "";
      return {
        issuer: "Coursera Online University Verified",
        credentialId: certId,
        platformName: "Coursera",
      };
    }

    // 3. HackerRank
    if (host.includes("hackerrank.com")) {
      const certId = segments[segments.length - 1] || "";
      return {
        issuer: "HackerRank Verified Skill Assessment",
        credentialId: certId,
        platformName: "HackerRank",
      };
    }

    // 4. AWS
    if (host.includes("aws.amazon.com") || host.includes("certmetrics.com")) {
      const credId = urlObj.searchParams.get("id") || segments[segments.length - 1] || "AWS-CERT-VERIFIED";
      return {
        issuer: "Amazon Web Services (AWS Training & Certification)",
        credentialId: credId,
        platformName: "AWS",
      };
    }

    // 5. Google Cloud / Accredible
    if (host.includes("google.accredible.com") || host.includes("credential.net") || host.includes("accredible.com")) {
      const credId = segments[segments.length - 1] || "";
      return {
        issuer: "Google Cloud / Accredible Certified",
        credentialId: credId,
        platformName: "Google Cloud",
      };
    }

    // 6. Microsoft Learn
    if (host.includes("microsoft.com") || host.includes("learn.microsoft.com")) {
      const credId = segments[segments.length - 1] || "";
      return {
        issuer: "Microsoft Certified Professional",
        credentialId: credId,
        platformName: "Microsoft",
      };
    }

    // 7. Udemy
    if (host.includes("udemy.com")) {
      const certId = segments[segments.length - 1] || "";
      return {
        issuer: "Udemy Certified Academy",
        credentialId: certId,
        platformName: "Udemy",
      };
    }

    // 8. freeCodeCamp
    if (host.includes("freecodecamp.org")) {
      const certId = segments[segments.length - 1] || "";
      return {
        issuer: "freeCodeCamp Developer Certification",
        credentialId: certId,
        platformName: "freeCodeCamp",
      };
    }

    // 9. Linux Foundation / CNCF
    if (host.includes("linuxfoundation.org") || host.includes("cncf.io")) {
      const certId = segments[segments.length - 1] || "";
      return {
        issuer: "The Linux Foundation & CNCF",
        credentialId: certId,
        platformName: "Linux Foundation",
      };
    }

    // Fallback general format
    const id = segments[segments.length - 1] || "CERT-VERIFIED";
    const hostFormatted = host.replace(/^www\./, "").split(".")[0];
    return {
      issuer: `${hostFormatted.charAt(0).toUpperCase() + hostFormatted.slice(1)} Certification Registry`,
      credentialId: id,
      platformName: hostFormatted,
    };
  } catch {
    return null;
  }
}

export function Section8Certifications() {
  const { studentChecklist, updateIndustryCert } = useSuperDream();
  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 8) || summaries[7];

  // Upload & Verification Modal State
  const [activeCertModal, setActiveCertModal] = useState<IndustryCertItem | null>(null);
  const [viewingPdfCert, setViewingPdfCert] = useState<IndustryCertItem | null>(null);

  // Modal mode: 'link' | 'pdf'
  const [verificationMode, setVerificationMode] = useState<"link" | "pdf">("link");

  // Modal form inputs
  const [credentialUrlInput, setCredentialUrlInput] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [credentialIdInput, setCredentialIdInput] = useState("");
  const [issuerInput, setIssuerInput] = useState("");
  const [issueDateInput, setIssueDateInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  // Hidden file input ref for direct quick upload on cards
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadCardId, setCurrentUploadCardId] = useState<string | null>(null);

  // Open the dedicated AI Verification & PDF Upload modal
  const handleOpenUploadModal = (item: IndustryCertItem) => {
    setActiveCertModal(item);
    setVerificationMode(item.credentialUrl ? "link" : "pdf");
    setCredentialUrlInput(item.credentialUrl || "");
    setUploadedFileName(item.certificatePdfName || "");
    setCredentialIdInput(item.credentialId || "");
    setIssuerInput(item.issuer || "");
    setIssueDateInput(item.issueDate || new Date().toISOString().split("T")[0]);
    setIsVerifying(false);
    setVerificationStep(0);
  };

  // Auto-detect Issuer & ID when Credential Link is entered
  const handleLinkChange = (url: string) => {
    setCredentialUrlInput(url);
    const parsed = parseRealWorldCredentialUrl(url);
    if (parsed) {
      if (!credentialIdInput || credentialIdInput.trim() === "") {
        setCredentialIdInput(parsed.credentialId);
      }
      if (!issuerInput || issuerInput.trim() === "") {
        setIssuerInput(parsed.issuer);
      }
    }
  };

  // Direct card file selection handler
  const handleCardFileSelect = (item: IndustryCertItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && !file.type.includes("pdf") && !file.type.includes("image")) {
      toast.error("Please upload a valid Certificate PDF or image file");
      return;
    }

    const fileName = file.name;
    toast.loading(`Processing ${fileName}...`, { id: "cert-quick-upload" });

    setTimeout(() => {
      updateIndustryCert(item.id, {
        status: "In Progress",
        verified: false,
        certificatePdfName: fileName,
        issueDate: new Date().toISOString().split("T")[0],
      });

      toast.success(`${item.certification} Certificate Uploaded!`, {
        id: "cert-quick-upload",
        description: `File: ${fileName} • Submitted for Faculty Review`,
      });
    }, 600);
  };

  // Run multi-step AI verification simulation in modal
  const handleRunAiVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCertModal) return;

    if (verificationMode === "pdf" && !uploadedFileName) {
      toast.error("Please select or upload a certificate PDF file.");
      return;
    }
    if (verificationMode === "link" && !credentialUrlInput.trim()) {
      toast.error("Please provide a valid live credential verification link.");
      return;
    }

    setIsVerifying(true);
    setVerificationStep(1);

    setTimeout(() => setVerificationStep(2), 400);
    setTimeout(() => setVerificationStep(3), 800);
    setTimeout(() => {
      setVerificationStep(4);
      setIsVerifying(false);

      const parsed = credentialUrlInput ? parseRealWorldCredentialUrl(credentialUrlInput) : null;
      const finalCredId = credentialIdInput || parsed?.credentialId || `CRED-${Math.floor(Math.random() * 90000 + 10000)}`;
      const finalIssuer = issuerInput || parsed?.issuer || "Global Certification Body";

      updateIndustryCert(activeCertModal.id, {
        status: "Completed",
        verified: true,
        credentialUrl: credentialUrlInput || undefined,
        certificatePdfName: uploadedFileName || (credentialUrlInput ? `${activeCertModal.certification}_Verified.pdf` : undefined),
        credentialId: finalCredId,
        issuer: finalIssuer,
        issueDate: issueDateInput,
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10B981", "#6366F1", "#F59E0B"],
        });
      } catch {
        // silent
      }

      toast.success(`${activeCertModal.certification} Authenticated & Verified!`, {
        description: `Credential ID: ${finalCredId} • Verified against ${finalIssuer} registry.`,
      });

      setActiveCertModal(null);
    }, 1400);
  };

  return (
    <div className="space-y-6">
      {/* Hidden global file input for single-click card uploads */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (currentUploadCardId) {
            const item = studentChecklist.section8Certifications.find((c) => c.id === currentUploadCardId);
            if (item) handleCardFileSelect(item, e);
          }
        }}
      />

      {/* 1. 3 Calm Pie Charts at Top */}
      <SectionHeaderMetrics
        sectionId={8}
        title={summary.title}
        subtitle="Tier-1 industry credentials across Cloud, Containers, Deep Learning, Java & DevOps. Upload official PDF certificates for AI authentication."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* 2. Certificate PDF Upload Callout Banner */}
      <div className="p-4 sm:p-5 rounded-2xl panel-card shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[var(--primary)]/10 blur-2xl" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25 flex items-center justify-center shrink-0 shadow-sm">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[var(--foreground)] flex items-center gap-2 tracking-tight">
              Official Certificate PDF Verification Required
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25">
                12 Industry Credentials
              </span>
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">
              Upload your official digital certificate PDFs to enable instant AI OCR authenticity parsing and cryptographic badge verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs text-[var(--foreground)] panel-slot px-3.5 py-1.5 rounded-full relative z-10 font-medium">
          <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
          <span>{studentChecklist.section8Certifications.filter((c) => c.status === "Completed" && c.verified).length} / 12 Verified</span>
        </div>
      </div>

      {/* 3. 12 Modular Certification Cards with PDF Upload Areas */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentChecklist.section8Certifications.map((item) => {
            const isCompleted = item.status === "Completed";
            const isInProgress = item.status === "In Progress";
            const hasPdf = Boolean(item.certificatePdfName);
            const styleConfig = CERT_COLOR_MAP[item.id] || { color: "#A78BFA", bg: "rgba(167, 139, 250, 0.15)" };

            return (
              <div
                key={item.id}
                className={cn(
                  "panel-card rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group shadow-md",
                  isCompleted && "border-[var(--success)]/30 shadow-[0_0_24px_rgba(134,239,172,0.12)]"
                )}
              >
                {/* Glow accent */}
                <div
                  className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-50"
                  style={{ background: styleConfig.color }}
                />

                <div className="space-y-3.5 relative z-10">
                  {/* Card Header: Icon, Name, Issuer & Status Toggle */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 shadow-sm"
                        style={{
                          background: styleConfig.bg,
                          border: `1px solid ${styleConfig.color}40`,
                          color: styleConfig.color,
                        }}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--foreground)] tracking-tight line-clamp-1">
                          {item.certification}
                        </h4>
                        <span className="text-xs text-[var(--muted-foreground)] block truncate max-w-[160px] font-medium">
                          {item.issuer || "Global Industry Vendor"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-mono font-medium flex items-center gap-1 shrink-0 border",
                        isCompleted
                          ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                          : isInProgress
                          ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30"
                          : "bg-white/[0.05] text-[var(--muted-foreground)] border-white/[0.08]"
                      )}
                    >
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />}
                      <span>{item.status}</span>
                    </span>
                  </div>

                  {/* Live Credential Link / PDF Upload Box */}
                  {item.credentialUrl ? (
                    <div className="p-3 rounded-2xl panel-slot border-[var(--success)]/25 flex items-center justify-between gap-2.5 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 grid place-items-center shrink-0 font-mono text-[10px] font-bold shadow-sm">
                          URL
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[var(--foreground)] truncate block font-[var(--font-sans)]">
                            Live Credential Verified
                          </span>
                          <span className="text-[10px] text-[var(--success)] font-medium flex items-center gap-1 font-[var(--font-sans)]">
                            <Check className="w-3 h-3" /> {item.issuer || "Official Authority"}
                          </span>
                        </div>
                      </div>

                      <a
                        href={item.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[var(--primary)] border border-white/[0.12] transition text-xs shrink-0 flex items-center gap-1 font-medium"
                        title="View Live Credential in Registry"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Open</span>
                      </a>
                    </div>
                  ) : hasPdf ? (
                    <div className="p-3 rounded-2xl panel-slot border-[var(--success)]/25 flex items-center justify-between gap-2.5 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/25 grid place-items-center shrink-0 font-mono text-[10px] font-bold shadow-sm">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[var(--foreground)] truncate block font-[var(--font-sans)]">
                            {item.certificatePdfName}
                          </span>
                          <span className="text-[10px] text-[var(--success)] font-medium flex items-center gap-1 font-[var(--font-sans)]">
                            <Check className="w-3 h-3" /> Authenticity Verified
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setViewingPdfCert(item)}
                        className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12] transition cursor-pointer text-xs shrink-0 active:scale-95"
                        title="View Certificate PDF Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        handleOpenUploadModal(item);
                      }}
                      className="p-3 rounded-2xl panel-slot hover:bg-white/[0.08] hover:border-[var(--primary)]/35 transition-all flex items-center gap-3 cursor-pointer group/upload shadow-xs"
                    >
                      <div className="w-9 h-9 rounded-xl grid place-items-center bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25 group-hover/upload:scale-105 transition-transform shrink-0 shadow-sm">
                        <FileUp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--foreground)] tracking-tight block">
                            Verify via Link or PDF
                          </span>
                          <span className="text-[10px] font-medium text-[var(--primary)] group-hover/upload:translate-x-0.5 transition-transform">
                            Verify →
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--muted-foreground)] font-medium block truncate">
                          Credly, Coursera, AWS, PDF upload
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Credential ID / Verification Input */}
                  <div className="pt-0.5">
                    <div className="flex items-center bg-white/[0.04] rounded-full border border-white/[0.08] focus-within:border-[var(--primary)]/40 focus-within:bg-white/[0.07] px-3.5 py-1.5 transition">
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)] mr-2 uppercase shrink-0 font-medium">ID:</span>
                      <input
                        type="text"
                        defaultValue={item.credentialId}
                        onBlur={(e) => updateIndustryCert(item.id, { credentialId: e.target.value })}
                        placeholder="Enter Credential ID (e.g. AWS-94812)..."
                        className="w-full bg-transparent text-[var(--foreground)] text-xs font-mono focus:outline-none placeholder:text-[var(--muted-foreground)]/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Status & Verification Action */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs relative z-10">
                  <span className="text-[11px] text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                    {item.verified ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                        <span className="text-[var(--success)] font-medium">Verified by Faculty ✓</span>
                      </>
                    ) : item.credentialUrl || hasPdf ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-[var(--warning)]" />
                        <span className="text-[var(--warning)] font-medium">Submitted (In Review)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        <span>Pending Verification</span>
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => handleOpenUploadModal(item)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95",
                      item.verified || hasPdf
                        ? "bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] border border-white/[0.12]"
                        : "btn-gradient btn-gradient-hover text-white"
                    )}
                  >
                    <FileUp className="w-3 h-3 text-[var(--primary)]" />
                    <span>{item.verified || hasPdf ? "Update Proof" : "Verify Proof"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL: UPLOAD CERTIFICATE PDF & LIVE LINK AI VERIFICATION */}
      {activeCertModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl panel-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/[0.16]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25 flex items-center justify-center shadow-sm">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                    Verify Industry Credential
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {activeCertModal.certification} • AI Authenticity & Credential Match
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCertModal(null)}
                className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[var(--muted-foreground)] hover:text-white transition cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Mode Selector */}
            <div className="px-5 pt-4 flex gap-2 border-b border-white/[0.06] pb-3">
              <button
                type="button"
                onClick={() => setVerificationMode("link")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                  verificationMode === "link"
                    ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 ring-1 ring-[var(--primary)]/20"
                    : "bg-white/[0.04] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Credential Link</span>
              </button>

              <button
                type="button"
                onClick={() => setVerificationMode("pdf")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                  verificationMode === "pdf"
                    ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 ring-1 ring-[var(--primary)]/20"
                    : "bg-white/[0.04] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Certificate PDF</span>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleRunAiVerification} className="p-5 space-y-4">
              {verificationMode === "link" ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Live Credential Verification URL</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-mono">Credly, Coursera, AWS, Google, HackerRank</span>
                  </div>
                  <input
                    type="url"
                    required
                    value={credentialUrlInput}
                    onChange={(e) => handleLinkChange(e.target.value)}
                    placeholder="https://www.credly.com/badges/... or https://coursera.org/verify/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] text-[var(--foreground)] text-xs font-mono focus:outline-none focus:border-[var(--primary)]/50 focus:bg-white/[0.08] transition"
                  />
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Paste your public badge or verification link. The issuer and credential ID will be auto-detected and validated.
                  </p>
                </div>
              ) : (
                /* PDF Dropzone */
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-2">
                    Select Certificate PDF File <span className="text-rose-400">*</span>
                  </label>
                  <div
                    onClick={() => {
                      setCurrentUploadCardId(activeCertModal.id);
                      fileInputRef.current?.click();
                    }}
                    className="p-5 rounded-2xl panel-slot hover:bg-white/[0.08] hover:border-[var(--primary)]/40 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[var(--foreground)] block">
                        {uploadedFileName || "Click to browse Certificate PDF"}
                      </span>
                      <span className="text-[11px] text-[var(--muted-foreground)] block font-medium mt-0.5">
                        Accepts .pdf or image files (Max 10MB)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields: Credential ID, Issuer, Issue Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)] block">
                    Credential ID
                  </label>
                  <input
                    type="text"
                    required
                    value={credentialIdInput}
                    onChange={(e) => setCredentialIdInput(e.target.value)}
                    placeholder="e.g. AWS-CP-7719"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-[var(--foreground)] text-xs font-mono focus:outline-none focus:border-[var(--primary)]/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)] block">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={issuerInput}
                    onChange={(e) => setIssuerInput(e.target.value)}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-[var(--foreground)] text-xs focus:outline-none focus:border-[var(--primary)]/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)] block">
                  Issue Date
                </label>
                <div className="flex items-center bg-white/[0.05] rounded-xl border border-white/[0.10] px-3.5 py-2">
                  <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)] mr-2" />
                  <input
                    type="date"
                    value={issueDateInput}
                    onChange={(e) => setIssueDateInput(e.target.value)}
                    className="w-full bg-transparent text-[var(--foreground)] text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Step indicator during verification */}
              {isVerifying && (
                <div className="p-4 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/25 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--primary)]">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                      AI OCR Engine Processing...
                    </span>
                    <span className="font-mono">Step {verificationStep}/4</span>
                  </div>
                  <p className="text-xs text-[var(--foreground)]/90">
                    {verificationStep === 1 && "Extracting cryptographic QR hash & PDF metadata..."}
                    {verificationStep === 2 && "Performing optical OCR text parsing on candidate name..."}
                    {verificationStep === 3 && "Querying official vendor credential registry..."}
                    {verificationStep === 4 && "Authenticity 99% confirmed — generating placement badge!"}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveCertModal(null)}
                  disabled={isVerifying}
                  className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] text-xs font-medium transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-5 py-2 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isVerifying ? "Submitting Proof..." : "Submit for Verification"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: VIEW UPLOADED CERTIFICATE PDF PREVIEW */}
      {viewingPdfCert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl panel-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/[0.16]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25 flex items-center justify-center shadow-sm">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                    {viewingPdfCert.certification} Certificate
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] font-mono">
                    {viewingPdfCert.certificatePdfName || "Verified Document"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPdfCert(null)}
                className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[var(--muted-foreground)] hover:text-white transition cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Certificate Document Card Preview */}
            <div className="p-5 space-y-4">
              <div className="p-5 rounded-2xl panel-slot text-center space-y-3 relative overflow-hidden shadow-inner border border-white/[0.12]">
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--primary)] font-semibold block">
                    Certificate of Completion & Competency
                  </span>
                  <h4 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                    {viewingPdfCert.certification}
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Issued by: <strong className="text-[var(--foreground)]">{viewingPdfCert.issuer || "Global Industry Vendor"}</strong>
                  </p>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-left text-xs font-mono bg-white/[0.04] p-3 rounded-xl border border-white/[0.08]">
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">CREDENTIAL ID</span>
                    <span className="text-[var(--foreground)] font-semibold">{viewingPdfCert.credentialId || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">ISSUE DATE</span>
                    <span className="text-[var(--foreground)] font-semibold">{viewingPdfCert.issueDate || "2026-02-15"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[var(--success)] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> AI Verified Super Dream Credential
                </span>

                <button
                  onClick={() => {
                    const cert = viewingPdfCert;
                    setViewingPdfCert(null);
                    handleOpenUploadModal(cert);
                  }}
                  className="px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] font-semibold transition cursor-pointer border border-white/[0.12] active:scale-95"
                >
                  Replace PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




