import React from "react";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import { X, Printer, Download, CheckCircle2 } from "lucide-react";

interface PrintableModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrintableChecklistModal({ open, onClose }: PrintableModalProps) {
  const { studentChecklist } = useSuperDream();
  const { profile, section10Evaluation } = studentChecklist;
  const { categoryScores, totalObtained, tier } = calculateStudentChecklistScores(studentChecklist);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar (Non-printable) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold">Official Placement Readiness Checklist Document</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-sm font-serif leading-relaxed print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="text-center space-y-1 border-b-2 border-black pb-4">
            <h1 className="text-xl font-bold tracking-wide uppercase">EASWARI ENGINEERING COLLEGE</h1>
            <p className="text-xs text-gray-700 font-sans">
              (An Autonomous Institution, Affiliated to Anna University, Ramapuram Chennai)
            </p>
            <h2 className="text-base font-bold text-black pt-2 underline uppercase">
              Elite Placement Readiness Checklist – Target: ₹20 LPA & Above Product & Global Technology Companies
            </h2>
          </div>

          {/* Student Profile Info */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-xs font-sans border-b border-gray-400 pb-4">
            <p><strong>Student Name:</strong> {profile.name}</p>
            <p><strong>Register Number:</strong> {profile.registerNumber}</p>
            <p><strong>Department:</strong> {profile.department}</p>
            <p><strong>Batch:</strong> {profile.batch}</p>
            <p><strong>Faculty Mentor:</strong> {profile.facultyMentor}</p>
            <p><strong>Current Semester:</strong> {profile.currentSemester}</p>
          </div>

          {/* Section 1: Programming Languages */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase">1. Programming Languages</h3>
            <table className="w-full text-xs border border-black border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="p-1.5 border-r border-black">Skill</th>
                  <th className="p-1.5 border-r border-black">Target</th>
                  <th className="p-1.5 border-r border-black">Status (✓/✗)</th>
                  <th className="p-1.5">Faculty Remarks</th>
                </tr>
              </thead>
              <tbody>
                {studentChecklist.section1Programming.map((item) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-black font-semibold">{item.skill}</td>
                    <td className="p-1.5 border-r border-black">{item.target}</td>
                    <td className="p-1.5 border-r border-black">{item.status === "Mastered" ? "✓ Mastered" : item.status === "In Progress" ? "In Progress" : "✗"}</td>
                    <td className="p-1.5">{item.facultyRemarks || "Verified"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: CS Fundamentals */}
          <div className="space-y-2 pt-2">
            <h3 className="font-bold text-sm uppercase">2. Computer Science Fundamentals</h3>
            <table className="w-full text-xs border border-black border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="p-1.5 border-r border-black">Subject</th>
                  <th className="p-1.5 border-r border-black">Rating (1–5)</th>
                  <th className="p-1.5 border-r border-black">Completed</th>
                  <th className="p-1.5">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {studentChecklist.section2CsFundamentals.map((item) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-black font-semibold">{item.subject}</td>
                    <td className="p-1.5 border-r border-black">{item.rating} / 5</td>
                    <td className="p-1.5 border-r border-black">{item.completed ? "✓ Completed" : "Pending"}</td>
                    <td className="p-1.5">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3 & 4 Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase">3. Coding & Problem Solving</h3>
              <table className="w-full text-xs border border-black border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="p-1.5 border-r border-black">Activity</th>
                    <th className="p-1.5 border-r border-black">Target</th>
                    <th className="p-1.5">Current</th>
                  </tr>
                </thead>
                <tbody>
                  {studentChecklist.section3CodingDsa.map((item) => (
                    <tr key={item.id} className="border-b border-gray-300">
                      <td className="p-1.5 border-r border-black">{item.activity}</td>
                      <td className="p-1.5 border-r border-black">{item.target}</td>
                      <td className="p-1.5 font-bold">{item.current}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase">4. Software Development</h3>
              <table className="w-full text-xs border border-black border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="p-1.5 border-r border-black">Activity</th>
                    <th className="p-1.5 border-r border-black">Target</th>
                    <th className="p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentChecklist.section4SoftwareDev.map((item) => (
                    <tr key={item.id} className="border-b border-gray-300">
                      <td className="p-1.5 border-r border-black">{item.activity}</td>
                      <td className="p-1.5 border-r border-black">{item.target}</td>
                      <td className="p-1.5 font-bold">{item.current} ({item.verified ? "Verified" : "Pending"})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 7: GitHub Portfolio */}
          <div className="space-y-2 pt-2">
            <h3 className="font-bold text-sm uppercase">7. GitHub Portfolio</h3>
            <table className="w-full text-xs border border-black border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="p-1.5 border-r border-black font-bold">Activity</th>
                  <th className="p-1.5 border-r border-black font-bold">Target</th>
                  <th className="p-1.5 font-bold">Current</th>
                </tr>
              </thead>
              <tbody>
                {studentChecklist.section7GithubPortfolio.map((item) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-black font-semibold">{item.activity}</td>
                    <td className="p-1.5 border-r border-black font-bold">
                      {item.targetDisplay || (typeof item.target === "string" ? item.target : item.target.toString())}
                    </td>
                    <td className="p-1.5 font-bold">
                      {item.id === "gh-7" || item.activity === "Portfolio Website"
                        ? item.isCompleted || item.current >= 1 ? "Completed" : "In Progress"
                        : item.current}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 10 Score & Evaluation */}
          <div className="space-y-2 pt-4 border-t-2 border-black">
            <h3 className="font-bold text-sm uppercase">10. Placement Readiness Score & Level</h3>
            <div className="p-3 border border-black flex items-center justify-between text-xs font-sans">
              <div>
                <p className="text-base font-bold">Overall Score: {totalObtained} / 100</p>
                <p className="font-semibold text-gray-800">Readiness Level: {tier.tierName} ({tier.packageRange})</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-black text-white font-bold text-xs uppercase">
                  {tier.tierName}
                </span>
              </div>
            </div>
          </div>

          {/* Mentor Evaluation & Signatures */}
          <div className="space-y-3 pt-2 text-xs">
            <h3 className="font-bold text-sm uppercase">Faculty Mentor Evaluation</h3>
            <p><strong>Strengths:</strong> {section10Evaluation.strengths}</p>
            <p><strong>Areas for Improvement:</strong> {section10Evaluation.areasForImprovement}</p>
            <p><strong>Action Plan (Next Semester):</strong> {section10Evaluation.actionPlanNextSemester}</p>
            <p><strong>Recommended Learning Path:</strong> {(section10Evaluation.recommendedLearningPaths || []).join(", ")}</p>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-400 text-center text-xs">
              <div className="space-y-1">
                <p className="font-bold underline">{section10Evaluation.studentSignature || profile.name}</p>
                <p className="text-gray-600">Student Signature</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold underline">{section10Evaluation.facultyMentorSignature || "Dr. Rajesh Kumar"}</p>
                <p className="text-gray-600">Faculty Mentor</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold underline">{section10Evaluation.hodSignature || "Dr. S. K. Ramesh"}</p>
                <p className="text-gray-600">HoD / Placement Coordinator</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 text-center pt-2">Review Date: {section10Evaluation.reviewDate || "2026-08-22"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
