export async function generateStudentPdfReport(reportElementId: string, studentName: string): Promise<void> {
  const reportElement = document.getElementById(reportElementId);
  if (!reportElement) {
    throw new Error("Report element not found");
  }

  const html2canvasModule = await import("html2canvas");
  const html2canvas = (html2canvasModule as any).default || html2canvasModule;

  const jspdfModule = await import("jspdf");
  const JsPdfClass = (jspdfModule as any).jsPDF || (jspdfModule as any).default || jspdfModule;

  // Temporarily make visible if hidden for rendering
  const wasHidden = reportElement.classList.contains("hidden");
  if (wasHidden) {
    reportElement.classList.remove("hidden");
    reportElement.style.position = "absolute";
    reportElement.style.left = "-9999px";
    reportElement.style.top = "0";
    reportElement.style.width = "800px";
  }

  try {
    const canvas = await html2canvas(reportElement, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new JsPdfClass({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    // Additional pages if content overflows A4 height
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    const cleanFilename = `CampusToCareer-360-Report-${(studentName || "Candidate").replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(cleanFilename);
  } finally {
    if (wasHidden) {
      reportElement.classList.add("hidden");
      reportElement.style.position = "";
      reportElement.style.left = "";
      reportElement.style.top = "";
      reportElement.style.width = "";
    }
  }
}
