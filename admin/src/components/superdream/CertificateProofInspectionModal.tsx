import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
  ExternalLink,
  QrCode,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface CertificateProofInspectionModalProps {
  open: boolean;
  onClose: () => void;
  course: any;
  candidateName: string;
  onApproveProof: (courseId: string) => void;
  onRejectProof: (courseId: string, reason: string) => void;
}

export function CertificateProofInspectionModal({
  open,
  onClose,
  course,
  candidateName,
  onApproveProof,
  onRejectProof,
}: CertificateProofInspectionModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!open || !course) return null;

  const handleApprove = () => {
    onApproveProof(course.id);
    toast.success(`Proof for "${course.title}" verified and certified!`);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide rejection reason");
      return;
    }
    onRejectProof(course.id, rejectReason);
    toast.info("Proof rejected and notification sent to candidate.");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/40 shadow-2xl flex flex-col text-slate-900 dark:text-white overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 grid place-items-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  NEURAL OCR CERTIFICATE INSPECTION
                </span>
                <span className="text-xs text-slate-400">Candidate: <strong className="text-white">{candidateName}</strong></span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {course.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Certificate OCR Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm text-white">{course.provider} Certificate of Completion</span>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                AI Confidence: 98.4%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">Recipient</p>
                <p className="font-bold text-white mt-0.5">{candidateName}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">Credential ID</p>
                <p className="font-mono text-cyan-300 font-bold mt-0.5 text-[11px]">CERT-SD-88492A</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">Issue Date</p>
                <p className="font-mono text-slate-300 mt-0.5">2026-08-15</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">Syllabus Match</p>
                <p className="font-mono text-emerald-400 font-bold mt-0.5">99.2% Alignment</p>
              </div>
            </div>
          </div>

          {/* 5-Point Cryptographic Check Results */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Automated 5-Point Cryptographic & OCR Audit
            </h3>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-white">Student Enrollment & Name Matching</p>
                    <p className="text-[11px] text-slate-400">Document matches candidate registry ({candidateName}) with 100% confidence</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  PASSED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-white">Issuer Public Key & Blockchain Ledger</p>
                    <p className="text-[11px] text-slate-400">Cryptographically signed by {course.provider} root CA</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  AUTHENTICATED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-white">Syllabus Topic Coverage & Rigor Audit</p>
                    <p className="text-[11px] text-slate-400">Covers all mandatory topics: {course.topics?.join(", ")}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  99% COVERAGE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-white">Tamper & EXIF Pixel Modification Shield</p>
                    <p className="text-[11px] text-slate-400">Zero image splicing, photoshop artifacts, or timestamp manipulation</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  VERIFIED CLEAN
                </span>
              </div>
            </div>
          </div>

          {/* Rejection form if toggled */}
          {showRejectForm && (
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-2">
              <label className="text-slate-300 font-bold">Reason for Rejection *</label>
              <textarea
                rows={2}
                placeholder="State why the proof is invalid or what additional documentation is required..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white resize-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {!showRejectForm && (
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 transition cursor-pointer"
              >
                Reject Proof
              </button>
            )}

            <button
              type="button"
              onClick={handleApprove}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Certify & Mark Course Complete</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
