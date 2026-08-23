import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSuperDream } from "@/stores/superDreamStore";
import { SuperDreamIntroAnimation } from "@/components/superdream/SuperDreamIntroAnimation";
import { StudentProfileHeader } from "@/components/superdream/checklist/StudentProfileHeader";
import { PrintableChecklistModal } from "@/components/superdream/checklist/PrintableChecklistModal";
import { TrackRoadNavigator } from "@/components/superdream/checklist/TrackRoadNavigator";
import { Section1Programming } from "@/components/superdream/checklist/Section1Programming";
import { Section2CsFundamentals } from "@/components/superdream/checklist/Section2CsFundamentals";
import { Section3CodingDsa } from "@/components/superdream/checklist/Section3CodingDsa";
import { Section4SoftwareDev } from "@/components/superdream/checklist/Section4SoftwareDev";
import { Section5AiDataScience } from "@/components/superdream/checklist/Section5AiDataScience";
import { Section6CloudDevOps } from "@/components/superdream/checklist/Section6CloudDevOps";
import { Section7GithubPortfolio } from "@/components/superdream/checklist/Section7GithubPortfolio";
import { Section8Certifications } from "@/components/superdream/checklist/Section8Certifications";
import { Section9InterviewPrep } from "@/components/superdream/checklist/Section9InterviewPrep";
import { Section10ReadinessEvaluation } from "@/components/superdream/checklist/Section10ReadinessEvaluation";
import { SuperDreamBrainAnalyzer } from "@/components/superdream/checklist/SuperDreamBrainAnalyzer";
import { SuperDreamInterviewCenter } from "@/components/superdream/checklist/SuperDreamInterviewCenter";

// Legacy tab fallbacks
import { SuperDreamTravelRoadmap } from "@/components/superdream/SuperDreamTravelRoadmap";
import { SuperDreamCourses } from "@/components/superdream/SuperDreamCourses";
import { SuperDreamEvents } from "@/components/superdream/SuperDreamEvents";
import { SuperDreamLearningRoadmap } from "@/components/superdream/SuperDreamLearningRoadmap";
import { SuperDreamCodingSection } from "@/components/superdream/SuperDreamCodingSection";
import { SuperDreamTestsSection } from "@/components/superdream/SuperDreamTestsSection";
import { SuperDreamAnalysisSection } from "@/components/superdream/SuperDreamAnalysisSection";

export const Route = createFileRoute("/_authenticated/super-dream")({
  head: () => ({ meta: [{ title: "Super Dream Track — Campus to Career AI" }] }),
  component: SuperDreamPage,
});

function SuperDreamPage() {
  const {
    activeTab,
    setActiveTab,
    activeSectionId,
    setActiveSectionId,
    showWelcomeAnimation,
    dismissWelcomeAnimation,
    loadLiveSuperDreamState,
  } = useSuperDream();

  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    loadLiveSuperDreamState();
  }, [loadLiveSuperDreamState]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Intro Portal Animation on first entrance */}
      {showWelcomeAnimation && (
        <SuperDreamIntroAnimation onComplete={dismissWelcomeAnimation} />
      )}

      {/* Printable Official Checklist Modal */}
      <PrintableChecklistModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />

      {/* Official Header: Easwari Engineering College Student Profile */}
      <StudentProfileHeader onOpenPrintModal={() => setPrintModalOpen(true)} />



      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {/* Phase A: Track Road and 10 Sections */}
        {activeTab === "track-road" && (
          <div className="space-y-6">
            {activeSectionId === 0 && <TrackRoadNavigator />}
            {activeSectionId === 1 && <Section1Programming />}
            {activeSectionId === 2 && <Section2CsFundamentals />}
            {activeSectionId === 3 && <Section3CodingDsa />}
            {activeSectionId === 4 && <Section4SoftwareDev />}
            {activeSectionId === 5 && <Section5AiDataScience />}
            {activeSectionId === 6 && <Section6CloudDevOps />}
            {activeSectionId === 7 && <Section7GithubPortfolio />}
            {activeSectionId === 8 && <Section8Certifications />}
            {activeSectionId === 9 && <Section9InterviewPrep />}
            {activeSectionId === 10 && (
              <Section10ReadinessEvaluation onOpenPrintModal={() => setPrintModalOpen(true)} />
            )}
          </div>
        )}

        {/* Phase B: Skill Tracking Brain Analyzer */}
        {activeTab === "skill-analyzer" && <SuperDreamBrainAnalyzer />}

        {/* Phase C: Interview Arena & Resume */}
        {activeTab === "interview" && <SuperDreamInterviewCenter />}

        {/* Legacy tabs */}
        {activeTab === "travel-roadmap" && <SuperDreamTravelRoadmap />}
        {activeTab === "courses" && <SuperDreamCourses />}
        {activeTab === "events" && <SuperDreamEvents />}
        {activeTab === "learning-roadmap" && <SuperDreamLearningRoadmap />}
        {activeTab === "coding" && <SuperDreamCodingSection />}
        {activeTab === "tests" && <SuperDreamTestsSection />}
        {activeTab === "analysis" && <SuperDreamAnalysisSection />}
      </div>
    </div>
  );
}
