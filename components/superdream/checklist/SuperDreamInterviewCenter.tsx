import React from "react";
import { InterviewEngine } from "@/components/interview/InterviewEngine";
import { useSuperDream } from "@/stores/superDreamStore";
import type { InterviewSession } from "@/types/interview";
import { toast } from "sonner";

export function SuperDreamInterviewCenter() {
  const { updateInterviewMetric, studentChecklist } = useSuperDream();

  const handleSessionComplete = (session: InterviewSession) => {
    if (!session || !session.rounds) return;

    // Track telemetry into Super Dream Placement Section 9
    session.rounds.forEach((round) => {
      if (round.roundType === "technical") {
        const item1 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-1");
        const item6 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-6");
        updateInterviewMetric("iv-1", (item1?.current ?? 0) + 1);
        updateInterviewMetric("iv-6", (item6?.current ?? 0) + 1);
      } else if (round.roundType === "coding" || round.roundType === "core") {
        const item2 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-2");
        updateInterviewMetric("iv-2", (item2?.current ?? 0) + 1);
      } else if (round.roundType === "hr") {
        const item3 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-3");
        const item7 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-7");
        updateInterviewMetric("iv-3", (item3?.current ?? 0) + 1);
        updateInterviewMetric("iv-7", (item7?.current ?? 0) + 1);
      } else if (round.roundType === "aptitude" || round.roundType === "quiz") {
        const item4 = studentChecklist.section9InterviewPrep.find((i) => i.id === "iv-4");
        updateInterviewMetric("iv-4", (item4?.current ?? 0) + 1);
      }
    });

    toast.success("Super Dream Interview Metrics & Performance updated!");
  };

  return (
    <div className="space-y-6">
      <InterviewEngine
        title="Super Dream AI Mock Interview Arena"
        subtitle="Practice multi-round technical, system design, DSA live coding, and resume-driven HR interviews matching Tier-1 placement standards."
        onSessionComplete={handleSessionComplete}
        showHistory={true}
      />
    </div>
  );
}
