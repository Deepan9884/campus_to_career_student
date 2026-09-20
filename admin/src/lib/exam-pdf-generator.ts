import type { ExamResultsResponse } from "./admin-api";

/**
 * Generate a clean, institutional grade PDF Marksheet for an Exam
 */
export async function generateExamResultsPdf(
  data: ExamResultsResponse,
  institutionName = "CAMPUS TO CAREER AI — CENTER FOR CAREER READINESS"
): Promise<void> {
  const jspdfModule = await import("jspdf");
  const JsPdfClass = (jspdfModule as any).jsPDF || (jspdfModule as any).default || jspdfModule;

  const pdf = new JsPdfClass({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297; // Landscape A4 width
  const pageHeight = 210; // Landscape A4 height
  const margin = 12;

  // ── HEADER & LETTERHEAD ──────────────────────────────────────────────────
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 24, "F");

  // Accent gradient line
  pdf.setFillColor(99, 102, 241); // indigo-500
  pdf.rect(0, 24, pageWidth, 1.5, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text(institutionName, margin, 10);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(199, 210, 254); // indigo-200
  pdf.text(
    "OFFICIAL CONSOLIDATED ASSESSMENT MARKSHEET & PERFORMANCE AUDIT",
    margin,
    16
  );

  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  pdf.text(`Generated: ${dateStr}`, pageWidth - margin - 35, 16);

  // ── EXAM SUMMARY CARDS ────────────────────────────────────────────────────
  let startY = 32;

  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.roundedRect(margin, startY, pageWidth - margin * 2, 24, 2, 2, "FD");

  // Column 1: Exam Info
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.exam.title, margin + 4, startY + 6);

  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `Type: ${data.exam.examType.toUpperCase()} | Category: ${data.exam.category} | Duration: ${data.exam.durationMinutes} Mins | Max Marks: ${data.exam.totalMarks}`,
    margin + 4,
    startY + 12
  );
  pdf.text(
    `Passing Score: ${data.exam.passingScorePercentage}% | Disclosure Status: ${
      data.exam.isResultDisclosed ? "DISCLOSED TO STUDENTS" : "CONFIDENTIAL / UNDER EVALUATION"
    }`,
    margin + 4,
    startY + 18
  );

  // Column 2: Statistics Badges
  const statsStartX = pageWidth - margin - 110;
  const badges = [
    { label: "Appeared", val: String(data.summary.totalSubmissions) },
    { label: "Passed", val: `${data.summary.passedCount} (${data.summary.passPercentage}%)` },
    { label: "Avg Score", val: `${data.summary.avgScore}/${data.exam.totalMarks}` },
    { label: "Highest", val: `${data.summary.highestScore}/${data.exam.totalMarks}` },
  ];

  badges.forEach((b, idx) => {
    const bx = statsStartX + idx * 27;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(bx, startY + 3, 24, 18, 1.5, 1.5, "FD");

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text(b.label, bx + 12, startY + 8, { align: "center" });

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text(b.val, bx + 12, startY + 16, { align: "center" });
  });

  // ── TABULAR MARKSHEET ─────────────────────────────────────────────────────
  let tableY = startY + 28;

  // Table Headers
  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.rect(margin, tableY, pageWidth - margin * 2, 7, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "bold");

  const cols = [
    { title: "RANK", width: 14, align: "center" },
    { title: "REGISTER NO", width: 28, align: "left" },
    { title: "STUDENT NAME", width: 46, align: "left" },
    { title: "DEPARTMENT", width: 34, align: "left" },
    { title: "QUESTION SCORES BREAKDOWN", width: 80, align: "left" },
    { title: "TOTAL", width: 18, align: "center" },
    { title: "%", width: 14, align: "center" },
    { title: "INTEGRITY", width: 18, align: "center" },
    { title: "STATUS", width: 21, align: "center" },
  ];

  let curX = margin;
  cols.forEach((col) => {
    if (col.align === "center") {
      pdf.text(col.title, curX + col.width / 2, tableY + 5, { align: "center" });
    } else {
      pdf.text(col.title, curX + 2, tableY + 5);
    }
    curX += col.width;
  });

  tableY += 7;

  // Table Rows
  data.resultsTable.forEach((row, rIdx) => {
    // Check if new page needed
    if (tableY > pageHeight - 20) {
      pdf.addPage();
      tableY = 16;

      // Repeat Table Header
      pdf.setFillColor(30, 41, 59);
      pdf.rect(margin, tableY, pageWidth - margin * 2, 7, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");

      let reX = margin;
      cols.forEach((col) => {
        if (col.align === "center") {
          pdf.text(col.title, reX + col.width / 2, tableY + 5, { align: "center" });
        } else {
          pdf.text(col.title, reX + 2, tableY + 5);
        }
        reX += col.width;
      });
      tableY += 7;
    }

    const isEven = rIdx % 2 === 0;
    pdf.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    pdf.rect(margin, tableY, pageWidth - margin * 2, 6.5, "F");

    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, tableY + 6.5, pageWidth - margin, tableY + 6.5);

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(15, 23, 42);

    let rowX = margin;

    // 1. Rank
    pdf.setFont("helvetica", "bold");
    if (row.rank === 1) pdf.setTextColor(202, 138, 4); // gold
    else if (row.rank === 2) pdf.setTextColor(100, 116, 139); // silver
    else if (row.rank === 3) pdf.setTextColor(180, 83, 9); // bronze
    else pdf.setTextColor(15, 23, 42);
    pdf.text(`#${row.rank}`, rowX + 7, tableY + 4.5, { align: "center" });
    rowX += 14;

    // 2. Register Number
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(51, 65, 85);
    pdf.text(row.registerNumber || "N/A", rowX + 2, tableY + 4.5);
    rowX += 28;

    // 3. Name
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    const truncName = row.studentName.length > 22 ? row.studentName.slice(0, 20) + "..." : row.studentName;
    pdf.text(truncName, rowX + 2, tableY + 4.5);
    rowX += 46;

    // 4. Department
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105);
    const truncDept = row.department.length > 18 ? row.department.slice(0, 16) + "..." : row.department;
    pdf.text(truncDept, rowX + 2, tableY + 4.5);
    rowX += 34;

    // 5. Question Scores Summary
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(79, 70, 229); // indigo-600
    const qStr = (row.questionScores || [])
      .slice(0, 6)
      .map((q, idx) => `Q${idx + 1}:${q.score}/${q.maxMarks}`)
      .join("  ");
    const extraQ = (row.questionScores?.length || 0) > 6 ? ` (+${row.questionScores.length - 6} more)` : "";
    pdf.text((qStr + extraQ) || "Evaluated", rowX + 2, tableY + 4.5);
    rowX += 80;

    // 6. Total Score
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${row.totalScore}/${row.maxScore}`, rowX + 9, tableY + 4.5, { align: "center" });
    rowX += 18;

    // 7. Percentage
    pdf.text(`${row.percentage}%`, rowX + 7, tableY + 4.5, { align: "center" });
    rowX += 14;

    // 8. Integrity
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(row.proctoringIntegrity >= 80 ? 22 : 220, row.proctoringIntegrity >= 80 ? 101 : 38, row.proctoringIntegrity >= 80 ? 52 : 38);
    pdf.text(`${row.proctoringIntegrity}%`, rowX + 9, tableY + 4.5, { align: "center" });
    rowX += 18;

    // 9. Status
    pdf.setFont("helvetica", "bold");
    if (row.passed) {
      pdf.setTextColor(22, 101, 52); // green-800
      pdf.text("PASSED", rowX + 10.5, tableY + 4.5, { align: "center" });
    } else {
      pdf.setTextColor(185, 28, 28); // red-700
      pdf.text("FAILED", rowX + 10.5, tableY + 4.5, { align: "center" });
    }

    tableY += 6.5;
  });

  // ── FOOTER & SIGNOFF ──────────────────────────────────────────────────────
  const footerY = pageHeight - 12;
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    "Campus to Career AI System-Generated Marksheet — Confidential Assessment Telemetry",
    margin,
    footerY
  );
  pdf.text(
    `Faculty Mentor / Controller of Examinations Signoff: ________________________`,
    pageWidth - margin - 90,
    footerY
  );

  const cleanTitle = data.exam.title.replace(/[^a-zA-Z0-9_-]/g, "_");
  pdf.save(`Exam-Results-${cleanTitle}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
