import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OFFICIAL_CODING_ASSESSMENTS, type ProctoredAssessment } from "@/lib/tests-data";

export interface CompletedTestRecord {
  testId: string;
  testTitle: string;
  score: number;
  passed: boolean;
  percentile: number;
  completedAt: string;
  durationSeconds: number;
  questionScores: Record<string, { passed: boolean; score: number; executionTimeMs: number }>;
  proctoringIntegrity: number; // 0 - 100%
  violationsCount: number;
}

interface TestsState {
  assessments: ProctoredAssessment[];
  completedAttempts: Record<string, CompletedTestRecord>;
  codeDrafts: Record<string, string>; // key: `${testId}_${challengeId}_${lang}` -> code

  // Actions
  recordCompletedTest: (record: CompletedTestRecord) => void;
  saveCodeDraft: (testId: string, challengeId: string, lang: string, code: string) => void;
  getCodeDraft: (testId: string, challengeId: string, lang: string) => string | undefined;
  getBestScoreForTest: (testId: string) => number | undefined;
  isTestPassed: (testId: string) => boolean;
}

export const useTestsStore = create<TestsState>()(
  persist(
    (set, get) => ({
      assessments: OFFICIAL_CODING_ASSESSMENTS,
      completedAttempts: {},
      codeDrafts: {},

      recordCompletedTest: (record) => {
        set((state) => {
          const current = state.completedAttempts[record.testId];
          const bestScore = current ? Math.max(current.score, record.score) : record.score;
          const passed = (current && current.passed) || record.passed;

          return {
            completedAttempts: {
              ...state.completedAttempts,
              [record.testId]: {
                ...record,
                score: bestScore,
                passed,
              },
            },
          };
        });
      },

      saveCodeDraft: (testId, challengeId, lang, code) => {
        const key = `${testId}_${challengeId}_${lang}`;
        set((state) => ({
          codeDrafts: {
            ...state.codeDrafts,
            [key]: code,
          },
        }));
      },

      getCodeDraft: (testId, challengeId, lang) => {
        const key = `${testId}_${challengeId}_${lang}`;
        return get().codeDrafts[key];
      },

      getBestScoreForTest: (testId) => {
        return get().completedAttempts[testId]?.score;
      },

      isTestPassed: (testId) => {
        return Boolean(get().completedAttempts[testId]?.passed);
      },
    }),
    {
      name: "c2c_coding_tests_storage",
    }
  )
);
