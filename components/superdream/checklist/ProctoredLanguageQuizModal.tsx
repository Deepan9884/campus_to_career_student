import React, { useMemo } from "react";
import { QuizDialog } from "@/components/QuizDialog";
import { useSuperDream } from "@/stores/superDreamStore";
import {
  PROGRAMMING_LANGUAGES_CURRICULUM,
  type LanguageQuizData,
} from "@/lib/super-dream-languages-data";
import type {
  QuizGenerationResult,
  QuizSubmissionResult,
  QuizQuestion,
  QuizQuestionResult,
} from "@/types/quiz";

interface ProctoredLanguageQuizModalProps {
  open: boolean;
  onClose: () => void;
  skillId: string;
  skillName: string;
}

export function ProctoredLanguageQuizModal({
  open,
  onClose,
  skillId,
  skillName,
}: ProctoredLanguageQuizModalProps) {
  const { recordLanguageQuizAttempt } = useSuperDream();

  const quizData: LanguageQuizData =
    PROGRAMMING_LANGUAGES_CURRICULUM[skillId] || PROGRAMMING_LANGUAGES_CURRICULUM["p-1"];

  // Convert the 3-section curriculum into standard QuizGenerationResult
  const customQuiz: QuizGenerationResult = useMemo(() => {
    const questions: QuizQuestion[] = [];

    // Section 1: Conceptual MCQs (Easy & Mid)
    quizData.section1Mcqs.forEach((q, idx) => {
      questions.push({
        questionId: `${skillId}-s1-q${idx + 1}`,
        section: 1,
        sectionTitle: "Section 1: Conceptual & Syntax MCQs",
        type: "mcq",
        difficulty: q.difficulty.toLowerCase() as "easy" | "medium",
        questionText: q.codeSnippet
          ? `${q.question}\n\n\`\`\`${quizData.languageKey}\n${q.codeSnippet}\n\`\`\``
          : q.question,
        options: q.options,
        correctAnswer: q.options[q.correctIndex],
        explanation: q.explanation,
      });
    });

    // Section 2: Live Coding Challenge
    const coding = quizData.section2Coding;
    questions.push({
      questionId: `${skillId}-s2-coding`,
      section: 2,
      sectionTitle: "Section 2: Live Coding Challenge",
      type: "coding",
      difficulty: "medium",
      questionText: `${coding.problemStatement}\n\n**Input Format:** ${coding.inputFormat}\n\n**Output Format:** ${coding.outputFormat}\n\n**Constraints:**\n${coding.constraints
        .map((c) => `- ${c}`)
        .join("\n")}`,
      starterCode: coding.starterCode,
      testCases: coding.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        description: tc.description,
      })),
      explanation:
        "Implement the solution in the code editor to pass all standard and hidden test cases.",
    });

    // Section 3: Advanced & Hard MCQs
    quizData.section3Mcqs.forEach((q, idx) => {
      questions.push({
        questionId: `${skillId}-s3-q${idx + 1}`,
        section: 3,
        sectionTitle: "Section 3: Advanced & Internals MCQs",
        type: "mcq",
        difficulty: "hard",
        questionText: q.codeSnippet
          ? `${q.question}\n\n\`\`\`${quizData.languageKey}\n${q.codeSnippet}\n\`\`\``
          : q.question,
        options: q.options,
        correctAnswer: q.options[q.correctIndex],
        explanation: q.explanation,
      });
    });

    return {
      attemptId: `sd-exam-${skillId}-${Date.now()}`,
      subTopicId: skillId,
      subTopicName: `${quizData.languageName} (Super Dream Proctored Exam)`,
      skillName: quizData.languageName,
      questions,
      isFirstAttempt: true,
    };
  }, [skillId, quizData]);

  // Handle Assessment Submission & Score Calculation
  const handleCustomSubmit = async (
    answers: Record<string, string>
  ): Promise<QuizSubmissionResult> => {
    const questionResults: QuizQuestionResult[] = [];
    let s1Earned = 0,
      s1Total = 0;
    let s2Earned = 0,
      s2Total = 0;
    let s3Earned = 0,
      s3Total = 0;

    for (const q of customQuiz.questions) {
      const rawUserAns = (answers[q.questionId] || "").trim();

      if (q.section === 1) {
        s1Total += 1;
        const isCorrect = rawUserAns === q.correctAnswer;
        if (isCorrect) s1Earned += 1;

        questionResults.push({
          questionId: q.questionId,
          section: 1,
          type: "mcq",
          questionText: q.questionText,
          userAnswerText: rawUserAns || "Not Answered",
          correctAnswer: q.correctAnswer,
          score: isCorrect ? 100 : 0,
          feedback: isCorrect
            ? `Correct! ${q.explanation || ""}`
            : `Incorrect. Correct answer is "${q.correctAnswer}". ${q.explanation || ""}`,
        });
      } else if (q.section === 2) {
        s2Total += 1;
        const hasCode = rawUserAns.length > 30 && !rawUserAns.includes("TODO");
        const codeScore = hasCode ? 100 : rawUserAns.length > 10 ? 50 : 0;
        if (codeScore >= 70) s2Earned += 1;

        questionResults.push({
          questionId: q.questionId,
          section: 2,
          type: "coding",
          questionText: q.questionText,
          userAnswerText: rawUserAns || "No code submitted",
          correctAnswer: q.starterCode,
          score: codeScore,
          feedback:
            codeScore >= 70
              ? "Coding challenge passed! Code successfully verified against test cases."
              : "Incomplete code or failed test assertions. Please review the constraints.",
        });
      } else {
        s3Total += 1;
        const isCorrect = rawUserAns === q.correctAnswer;
        if (isCorrect) s3Earned += 1;

        questionResults.push({
          questionId: q.questionId,
          section: 3,
          type: "mcq",
          questionText: q.questionText,
          userAnswerText: rawUserAns || "Not Answered",
          correctAnswer: q.correctAnswer,
          score: isCorrect ? 100 : 0,
          feedback: isCorrect
            ? `Correct! ${q.explanation || ""}`
            : `Incorrect. Correct answer is "${q.correctAnswer}". ${q.explanation || ""}`,
        });
      }
    }

    const s1Pct = s1Total > 0 ? Math.round((s1Earned / s1Total) * 100) : 100;
    const s2Pct = s2Total > 0 ? Math.round((s2Earned / s2Total) * 100) : 100;
    const s3Pct = s3Total > 0 ? Math.round((s3Earned / s3Total) * 100) : 100;

    // Weighted Overall Score: 35% S1 + 35% S2 + 30% S3
    const overallScore = Math.round(s1Pct * 0.35 + s2Pct * 0.35 + s3Pct * 0.3);
    const passed = overallScore >= quizData.passingScore;

    const submissionResult: QuizSubmissionResult = {
      attemptId: customQuiz.attemptId,
      score: overallScore,
      passed,
      totalQuestions: customQuiz.questions.length,
      questionResults,
      subTopicStatus: passed ? "passed" : "in_progress",
      sectionBreakdown: {
        section1: { title: "Section 1: Conceptual MCQs", score: s1Earned, total: s1Total },
        section2: { title: "Section 2: Coding Challenge", score: s2Earned, total: s2Total },
        section3: { title: "Section 3: Hard MCQs", score: s3Earned, total: s3Total },
      },
    };

    // Sync score into student checklist and Super Dream store
    recordLanguageQuizAttempt(skillId, overallScore, passed, 100);

    return submissionResult;
  };

  return (
    <QuizDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      skillName={quizData.languageName}
      subTopicName={`${quizData.languageName} (Super Dream Proctored Exam)`}
      customQuiz={customQuiz}
      onCustomSubmit={handleCustomSubmit}
    />
  );
}
