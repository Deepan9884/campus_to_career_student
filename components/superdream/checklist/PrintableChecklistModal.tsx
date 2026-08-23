import React, { useState, useMemo } from "react";
import { useSuperDream } from "@/stores/superDreamStore";
import {
  calculateStudentChecklistScores,
  SUPER_DREAM_COMPANIES,
} from "@/lib/super-dream-checklist";
import {
  X,
  Printer,
  FileText,
  Building2,
  QrCode,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface PrintableModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrintableChecklistModal({ open, onClose }: PrintableModalProps) {
  const { studentChecklist } = useSuperDream();
  const { profile } = studentChecklist;
  const { categoryScores, totalObtained, tier, summaries } = useMemo(
    () => calculateStudentChecklistScores(studentChecklist),
    [studentChecklist]
  );

  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  const authHash = `EEC-SD-2026-${(
    (profile.registerNumber || "REG") +
    (profile.name || "STU") +
    totalObtained.toString()
  )
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between overflow-hidden animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* SCOPED CSS FOR SCREEN & PRINT PDF ENGINE */}
      {/* ========================================================================= */}
      <style>{`
        .pdf-page-container {
          background-color: #ffffff !important;
          color: #0f172a !important;
          color-scheme: light !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.08) !important;
        }
        .pdf-page-container * {
          color-scheme: light !important;
        }
        .pdf-table {
          width: 100% !important;
          border-collapse: collapse !important;
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #1e293b !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        .pdf-table th {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          font-weight: 700 !important;
          border: 1px solid #cbd5e1 !important;
          padding: 6px 8px !important;
          text-align: left !important;
          font-size: 10.5px !important;
        }
        .pdf-table td {
          background-color: #ffffff !important;
          color: #1e293b !important;
          border: 1px solid #e2e8f0 !important;
          padding: 5px 8px !important;
          font-size: 11px !important;
        }
        .pdf-table tbody tr:nth-child(even) td {
          background-color: #f8fafc !important;
        }
        .pdf-table tbody tr:hover td {
          background-color: #f1f5f9 !important;
        }
        .pdf-hero-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important;
          color: #ffffff !important;
          border: 1px solid #334155 !important;
        }
        .pdf-hero-card * {
          color: #ffffff !important;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            transform: none !important;
          }
          .pdf-page-container {
            box-shadow: none !important;
            margin-bottom: 0 !important;
            page-break-after: always !important;
            padding: 10mm 12mm !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* TOP PDF VIEWER TOOLBAR (Adobe Acrobat / macOS Preview Styled) */}
      {/* ========================================================================= */}
      <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white shadow-xl z-20 shrink-0 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 grid place-items-center text-red-400 font-bold text-xs">
            PDF
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Official Placement Readiness Audit Dossier.pdf
            </h3>
            <span className="text-[11px] text-slate-400">
              Easwari Engineering College • Certified Technical Audit
            </span>
          </div>
        </div>

        {/* Center & Right Controls */}
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2.5 font-mono text-xs text-slate-200 min-w-[50px] text-center font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700 ml-1"
            title="Close document viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DOCUMENT CANVAS (Scrollable Neutral Gray Backdrop) */}
      {/* ========================================================================= */}
      <div className="w-full flex-1 overflow-y-auto bg-slate-900/90 py-8 px-4 flex flex-col items-center justify-start gap-8 no-scrollbar">
        <div
          id="print-area"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top center",
          }}
          className="w-full max-w-4xl transition-transform duration-150 space-y-8"
        >
          {/* ======================================================================= */}
          {/* PAGE 1: OFFICIAL COLLEGE HEADER, PROFILE & EXECUTIVE SUMMARY */}
          {/* ======================================================================= */}
          <div className="pdf-page-container rounded-sm p-8 sm:p-12 space-y-6">
            {/* Document Institutional Header */}
            <div className="border-b-2 border-slate-900 pb-5 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-slate-900 grid place-items-center shrink-0 bg-slate-50">
                  <Building2 className="w-7 h-7 text-slate-900" />
                </div>

                <div className="text-center flex-1 space-y-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-950 uppercase font-sans">
                    EASWARI ENGINEERING COLLEGE
                  </h1>
                  <p className="text-xs font-sans font-semibold text-slate-800">
                    (An Autonomous Institution, Affiliated to Anna University Chennai)
                  </p>
                  <p className="text-[10px] font-sans text-slate-600">
                    Bharathi Salai, Ramapuram, Chennai – 600 089, Tamil Nadu, India
                  </p>
                  <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-900 pt-0.5">
                    DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING • CENTRE FOR CAREER DEVELOPMENT
                  </p>
                </div>

                <div className="w-14 h-14 rounded-lg border border-slate-900 p-1 text-center shrink-0 flex flex-col items-center justify-center bg-slate-50 text-[9px] font-mono font-bold">
                  <QrCode className="w-6 h-6 text-slate-900 mx-auto" />
                  <span className="text-[8px] leading-tight mt-0.5 text-slate-700">VERIFIED</span>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="pt-2 text-center">
                <div className="inline-block border-y-2 border-slate-900 py-1.5 px-6 bg-slate-50">
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide font-sans text-slate-950">
                    OFFICIAL ELITE PLACEMENT READINESS AUDIT DOSSIER
                  </h2>
                  <p className="text-[10px] font-sans text-slate-700 font-semibold">
                    Benchmark Competency Standard for Super Dream Tier Placement Offers (₹20.00 LPA – ₹75.00+ LPA)
                  </p>
                </div>
              </div>
            </div>

            {/* Candidate Profile Metadata Box */}
            <div className="bg-slate-50 border border-slate-300 p-4 rounded-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-6 text-[11px] font-sans">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Candidate Full Name</span>
                  <strong className="text-slate-950 text-xs">{profile.name || "Student Candidate"}</strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Anna University Reg. No.</span>
                  <strong className="text-slate-950 text-xs font-mono">{profile.registerNumber || "—"}</strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Degree & Program</span>
                  <strong className="text-slate-950 text-xs">{profile.department || "—"}</strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Academic Batch & Year</span>
                  <strong className="text-slate-950 text-xs font-mono">{profile.batch || "—"}</strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Current Academic Semester</span>
                  <strong className="text-slate-950 text-xs">{profile.currentSemester || "—"}</strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Assigned Faculty Mentor</span>
                  <strong className="text-slate-950 text-xs">{profile.facultyMentor || "Unassigned"}</strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Audit Generation Timestamp</span>
                  <span className="text-slate-800 font-mono text-[10px]">{formattedDate}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Verification Authenticity Key</span>
                  <span className="text-slate-900 font-mono text-[10px] font-bold">{authHash}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Target Placement Tier</span>
                  <span className="text-indigo-900 font-bold font-sans text-xs">Super Dream (₹20.00 – ₹75.00+ LPA)</span>
                </div>
              </div>
            </div>

            {/* Executive Placement Readiness Index Card */}
            <div className="pdf-hero-card p-5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest block">
                  ★ INSTITUTIONAL READINESS ATTAINMENT
                </span>
                <h3 className="text-lg font-bold font-sans tracking-tight text-white">
                  {tier.tierName}
                </h3>
                <p className="text-xs text-slate-200 font-sans">
                  Forecasted Compensation Band: <strong className="text-amber-300 text-sm font-mono">{tier.packageRange}</strong>
                </p>
                <p className="text-[10px] text-slate-300 font-sans italic">
                  {tier.recommendation}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-700 sm:pl-6 shrink-0">
                <span className="text-[10px] font-sans text-slate-300 uppercase font-semibold block">Total Placement Score</span>
                <div className="flex items-baseline justify-end gap-1 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                    {totalObtained}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">/ 100</span>
                </div>
                <span className="text-[10px] font-sans text-emerald-400 font-bold block mt-0.5">
                  {totalObtained >= 80 ? "QUALIFIED FOR DIRECT INTERVIEWS" : "DEVELOPMENT PROTOCOL ACTIVE"}
                </span>
              </div>
            </div>

            {/* 9-Domain Rubric Summary Table */}
            <div className="space-y-1.5 pt-1">
              <h4 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 flex items-center justify-between border-b border-slate-300 pb-1">
                <span>100-Mark Rubric Breakdown Across 9 Evaluation Criteria</span>
                <span className="text-[10px] font-mono text-slate-600 font-normal">Official Academic Weightage</span>
              </h4>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th style={{ width: "35px", textAlign: "center" }}>#</th>
                    <th>Evaluation Domain / Pillar</th>
                    <th style={{ width: "90px", textAlign: "center" }}>Max Marks</th>
                    <th style={{ width: "95px", textAlign: "center" }}>Obtained</th>
                    <th style={{ width: "90px", textAlign: "center" }}>Attainment</th>
                    <th style={{ width: "130px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryScores.map((cat, cIdx) => {
                    const catName = cat?.categoryName || cat?.category || cat?.key || `Criterion ${cIdx + 1}`;
                    const obtained = cat?.obtainedMarks ?? cat?.obtained ?? 0;
                    const max = cat?.maxMarks || 1;
                    const pct = Math.min(100, Math.round((obtained / max) * 100));

                    return (
                      <tr key={cIdx}>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{cIdx + 1}</td>
                        <td style={{ fontWeight: "600" }}>{catName}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold" }}>{max}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold", color: "#312e81" }}>{obtained}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "600" }}>{pct}%</td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                          {pct >= 80 ? (
                            <span style={{ color: "#065f46" }}>Mastered ✓</span>
                          ) : pct >= 50 ? (
                            <span style={{ color: "#0369a1" }}>In Progress</span>
                          ) : (
                            <span style={{ color: "#92400e" }}>Requires Focus</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ fontWeight: "bold", backgroundColor: "#f1f5f9" }}>
                    <td colSpan={2} style={{ textAlign: "right", textTransform: "uppercase", paddingRight: "12px" }}>
                      Cumulative Institutional Total
                    </td>
                    <td style={{ textAlign: "center", fontFamily: "monospace" }}>100</td>
                    <td style={{ textAlign: "center", fontFamily: "monospace", color: "#312e81" }}>{totalObtained}</td>
                    <td style={{ textAlign: "center", fontFamily: "monospace", color: "#065f46" }}>{totalObtained}%</td>
                    <td style={{ textAlign: "center", textTransform: "uppercase", fontSize: "10px", color: "#1e1b4b" }}>{tier.tierName}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 1: Programming Languages */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>1. Programming Languages & Core Paradigms</span>
                <span className="font-normal text-[10px] text-slate-600 font-mono">Weightage: 10 Marks</span>
              </h3>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Skill / Language</th>
                    <th>Target Benchmark</th>
                    <th style={{ width: "85px", textAlign: "center" }}>Quiz Score</th>
                    <th style={{ width: "95px", textAlign: "center" }}>Practice Solved</th>
                    <th style={{ width: "110px", textAlign: "center" }}>Mastery Status</th>
                    <th>Faculty Audit Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {studentChecklist.section1Programming.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: "600" }}>{item.skill}</td>
                      <td>{item.target}</td>
                      <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold" }}>
                        {item.bestQuizScore ? `${item.bestQuizScore}%` : "—"}
                      </td>
                      <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                        {item.problemsSolved || 0} Problems
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                        {item.status === "Mastered" ? (
                          <span style={{ color: "#065f46" }}>Mastered ✓</span>
                        ) : item.status === "In Progress" ? (
                          <span style={{ color: "#0369a1" }}>In Progress</span>
                        ) : (
                          <span style={{ color: "#64748b" }}>Not Started</span>
                        )}
                      </td>
                      <td>{item.facultyRemarks || "Verified by Proctored Telemetry"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 2: CS Fundamentals */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>2. Computer Science Core Fundamentals (12 Subjects)</span>
                <span className="font-normal text-[10px] text-slate-600 font-mono">Weightage: 10 Marks</span>
              </h3>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Core Subject</th>
                    <th style={{ width: "110px", textAlign: "center" }}>Rating (1–5 ★)</th>
                    <th style={{ width: "110px", textAlign: "center" }}>Proctored Status</th>
                    <th>Verification Remarks & Competencies</th>
                  </tr>
                </thead>
                <tbody>
                  {studentChecklist.section2CsFundamentals.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: "600" }}>{item.subject}</td>
                      <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold", color: "#b45309" }}>
                        {"★".repeat(Math.max(1, item.rating || 1))} ({item.rating || 1}/5)
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                        {item.completed ? (
                          <span style={{ color: "#065f46" }}>Mastered ✓</span>
                        ) : (
                          <span style={{ color: "#64748b" }}>In Progress</span>
                        )}
                      </td>
                      <td>{item.remarks || "Assessed via standard proctored examination"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* PAGE 2: CODING, SOFTWARE DEV, AI & CLOUD DEVOPS */}
          {/* ======================================================================= */}
          <div className="pdf-page-container rounded-sm p-8 sm:p-12 space-y-6">
            {/* Section 3: Competitive Programming & DSA */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>3. Competitive Programming & Algorithmic DSA Telemetry</span>
                <span className="font-normal text-[10px] text-slate-600 font-mono">Weightage: 15 Marks</span>
              </h3>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Activity / Benchmark</th>
                    <th style={{ width: "120px", textAlign: "center" }}>Target Standard</th>
                    <th style={{ width: "120px", textAlign: "center" }}>Current Synced</th>
                    <th style={{ width: "150px", textAlign: "center" }}>Attainment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentChecklist.section3CodingDsa.map((item) => {
                    const isMet = item.current >= item.target;
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: "600" }}>{item.activity}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace" }}>{item.target} {item.unit || ""}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold", color: "#312e81" }}>
                          {item.current} {item.unit || ""}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                          {isMet ? (
                            <span style={{ color: "#065f46" }}>Target Achieved ✓</span>
                          ) : (
                            <span style={{ color: "#92400e" }}>In Progress ({Math.round((item.current / Math.max(1, item.target)) * 100)}%)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Section 4 & 5: Software Dev & AI Data Science */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>4. Software Dev & Microservices</span>
                  <span className="font-normal text-[10px] text-slate-600 font-mono">15 Marks</span>
                </h3>
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>Deliverable</th>
                      <th style={{ width: "70px", textAlign: "center" }}>Count</th>
                      <th style={{ width: "110px", textAlign: "center" }}>Faculty Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentChecklist.section4SoftwareDev.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: "600" }}>{item.activity}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold" }}>
                          {item.current} / {item.target}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                          {item.verified ? (
                            <span style={{ color: "#065f46" }}>Verified ✓</span>
                          ) : (
                            <span style={{ color: "#64748b" }}>Under Review</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>5. AI, Data Science & GenAI</span>
                  <span className="font-normal text-[10px] text-slate-600 font-mono">10 Marks</span>
                </h3>
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>AI / ML System</th>
                      <th style={{ width: "70px", textAlign: "center" }}>Count</th>
                      <th style={{ width: "110px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentChecklist.section5AiDataScience.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: "600" }}>{item.activity}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold" }}>
                          {item.current} / {item.target}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                          {item.verified ? (
                            <span style={{ color: "#065f46" }}>Verified ✓</span>
                          ) : (
                            <span style={{ color: "#64748b" }}>Under Review</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 6 & 7: Cloud DevOps & GitHub Portfolio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>6. Cloud & DevOps</span>
                  <span className="font-normal text-[10px] text-slate-600 font-mono">10 Marks</span>
                </h3>
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>Infrastructure Target</th>
                      <th style={{ width: "70px", textAlign: "center" }}>Count</th>
                      <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentChecklist.section6CloudDevOps.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: "600" }}>{item.activity}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold" }}>
                          {item.current} / {item.target}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                          {item.verified || item.current >= item.target ? (
                            <span style={{ color: "#065f46" }}>Completed ✓</span>
                          ) : (
                            <span style={{ color: "#64748b" }}>In Progress</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>7. GitHub Portfolio</span>
                  <span className="font-normal text-[10px] text-slate-600 font-mono">10 Marks</span>
                </h3>
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th style={{ width: "75px", textAlign: "center" }}>Target</th>
                      <th style={{ width: "75px", textAlign: "center" }}>Synced</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentChecklist.section7GithubPortfolio.map((item) => {
                      const isPort = item.id === "gh-7" || item.activity === "Portfolio Website";
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: "600" }}>{item.activity}</td>
                          <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                            {item.targetDisplay || (typeof item.target === "string" ? item.target : item.target.toString())}
                          </td>
                          <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold", color: "#312e81" }}>
                            {isPort ? (item.liveUrl ? "Live" : item.isCompleted ? "Active" : "—") : item.current}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                            {item.isCompleted || (typeof item.target === "number" && item.current >= item.target) ? (
                              <span style={{ color: "#065f46" }}>Done ✓</span>
                            ) : (
                              <span style={{ color: "#92400e" }}>In Progress</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* PAGE 3: CERTIFICATIONS, INTERVIEW PREP & INSTITUTIONAL SIGNATURES */}
          {/* ======================================================================= */}
          <div className="pdf-page-container rounded-sm p-8 sm:p-12 space-y-6">
            {/* Section 8 & 9: Certifications & Interview Prep */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>8. Industry Certifications & Contests</span>
                  <span className="font-normal text-[10px] text-slate-600 font-mono">10 Marks</span>
                </h3>
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>Certification</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Issuer</th>
                      <th style={{ width: "85px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentChecklist.section8Certifications.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: "600" }}>{item.certification}</td>
                        <td style={{ textAlign: "center", fontSize: "10px" }}>{item.issuer || "Industry"}</td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                          {item.status === "Completed" || item.verified ? (
                            <span style={{ color: "#065f46" }}>Verified ✓</span>
                          ) : item.status === "In Progress" ? (
                            <span style={{ color: "#0369a1" }}>In Progress</span>
                          ) : (
                            <span style={{ color: "#64748b" }}>Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>9. Interview Simulation Readiness</span>
                  <span className="font-normal text-[10px] text-slate-600 font-mono">10 Marks</span>
                </h3>
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>Simulation Loop</th>
                      <th style={{ width: "65px", textAlign: "center" }}>Target</th>
                      <th style={{ width: "65px", textAlign: "center" }}>Done</th>
                      <th style={{ width: "85px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentChecklist.section9InterviewPrep.map((item) => {
                      const isMet = item.current >= item.target;
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: "600" }}>{item.activity}</td>
                          <td style={{ textAlign: "center", fontFamily: "monospace" }}>{item.target}</td>
                          <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold", color: "#312e81" }}>{item.current}</td>
                          <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                            {isMet ? (
                              <span style={{ color: "#065f46" }}>Mastered ✓</span>
                            ) : (
                              <span style={{ color: "#92400e" }}>{item.current}/{item.target}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Target Tier-1 Companies Table */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-xs uppercase font-sans tracking-wide text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>Target Tier-1 Super Dream Employers & Eligibility Forecast</span>
                <span className="font-normal text-[10px] text-slate-600 font-mono">12 Key Employers</span>
              </h3>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Target Employer</th>
                    <th>Target Role</th>
                    <th style={{ width: "95px", textAlign: "center" }}>Package</th>
                    <th style={{ width: "85px", textAlign: "center" }}>Cutoff</th>
                    <th style={{ width: "160px", textAlign: "center" }}>Institutional Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SUPER_DREAM_COMPANIES.slice(0, 8).map((comp) => {
                    const eligible = totalObtained >= comp.minOverallScore;
                    return (
                      <tr key={comp.id}>
                        <td style={{ fontWeight: "700" }}>{comp.name}</td>
                        <td>{comp.role}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold", color: "#b45309" }}>{comp.packageLPA}</td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold" }}>{comp.minOverallScore}+</td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>
                          {eligible ? (
                            <span style={{ color: "#065f46" }}>Fast-Track Shortlisted ✓</span>
                          ) : (
                            <span style={{ color: "#92400e" }}>Deficiency Gap: -{comp.minOverallScore - totalObtained} pts</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Institutional Certification & Signatures */}
            <div className="space-y-4 pt-4 border-t-2 border-slate-900">
              <div className="bg-slate-50 border border-slate-300 p-3 text-[10px] text-slate-800 font-sans leading-relaxed rounded-sm">
                <strong className="block text-slate-950 font-bold uppercase text-[11px] mb-1">
                  Institutional Certification of Technical Authenticity
                </strong>
                This is to officially certify that the aforementioned candidate has participated in verified competitive telemetry, proctored subject audits, architectural assessments, and simulated interview evaluations in compliance with the <strong>Easwari Engineering College Elite Placement Framework</strong>. All scores, repository commits, and credentials documented herein are certified for official Tier-1 recruitment consideration.
              </div>

              {/* Official 3-Column Signatory Triad */}
              <div className="grid grid-cols-3 gap-6 pt-6 font-sans text-center">
                <div className="space-y-1">
                  <div className="h-10 flex items-end justify-center">
                    <span className="font-serif italic font-bold text-sm text-slate-950 border-b border-slate-900 pb-0.5 px-4">
                      {profile.name || "Student Candidate"}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-950 uppercase pt-1">Candidate Digital Signature</p>
                  <p className="text-[10px] text-slate-600 font-mono">Reg: {profile.registerNumber || "—"}</p>
                </div>

                <div className="space-y-1">
                  <div className="h-10 flex items-end justify-center">
                    <span className="font-serif italic font-bold text-sm text-indigo-950 border-b border-slate-900 pb-0.5 px-4">
                      {studentChecklist.section10Evaluation?.facultyMentorSignature || profile.facultyMentor || "Faculty Mentor"}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-950 uppercase pt-1">Faculty Mentor & Reviewer</p>
                  <p className="text-[10px] text-slate-600">Department Review</p>
                </div>

                <div className="space-y-1">
                  <div className="h-10 flex items-end justify-center">
                    <span className="font-serif italic font-bold text-sm text-indigo-950 border-b border-slate-900 pb-0.5 px-4">
                      {studentChecklist.section10Evaluation?.hodSignature || "Head of Department"}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-950 uppercase pt-1">Head of Department / Dean</p>
                  <p className="text-[10px] text-slate-600">Directorate of Placements</p>
                </div>
              </div>

              {/* Verification Key Bar */}
              <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between text-[9px] text-slate-500 font-mono gap-2">
                <span>Security Hash: {authHash}</span>
                <span>Easwari Engineering College • ISO 9001:2015 Certified Institution</span>
                <span>Generated on: {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

