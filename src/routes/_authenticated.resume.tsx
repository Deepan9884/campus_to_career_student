import { createFileRoute } from "@tanstack/react-router";
import { ResumeAnalyzerView } from "@/components/resume/ResumeAnalyzerView";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({ meta: [{ title: "Resume Analyzer — Campus to Career AI" }] }),
  component: ResumePage,
});

function ResumePage() {
  return <ResumeAnalyzerView />;
}
