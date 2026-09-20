import { createFileRoute } from "@tanstack/react-router";
import { InterviewEngine } from "@/components/interview/InterviewEngine";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Mock Interview — Campus to Career AI" }] }),
  component: InterviewPage,
});

function InterviewPage() {
  return <InterviewEngine />;
}
