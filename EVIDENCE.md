================================================================================
1. QUIZ ATTEMPT / SESSION MODEL & CONTROLLER
================================================================================

--- backend/src/models/QuizAttempt.model.js ---
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    questionText: { type: String, required: true },
    keyPoints: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one key point required per question",
      },
    },
  },
  { _id: false },
);

const userAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    answerText: { type: String, required: true },
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    feedback: { type: String, default: "" },
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    roadmapItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningRoadmap",
      required: [true, "Roadmap item ID is required"],
    },
    skillName: {
      type: String,
      required: [true, "Skill name is required"],
      trim: true,
    },
    subTopicId: {
      type: String,
      required: [true, "Sub-topic ID is required"],
      trim: true,
      index: true,
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 3 && arr.length <= 5,
        message: "Quiz must have 3-5 questions",
      },
    },
    userAnswers: {
      type: [userAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

quizAttemptSchema.index({ userId: 1, subTopicId: 1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);

--- backend/src/controllers/quiz.controller.js ---
const LearningRoadmap = require("../models/LearningRoadmap.model");
const UserSkill = require("../models/UserSkill.model");
const SkillGapAnalysis = require("../models/SkillGapAnalysis.model");
const QuizAttempt = require("../models/QuizAttempt.model");
const aiService = require("../services/ai.service");
const notificationService = require("../services/notification.service");
const activityLogService = require("../services/activityLog.service");
const badgeService = require("../services/badge.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

function buildQuizPrompt(subTopicName, skillName, resources) {
  const resourceList = resources.map((r) => `- ${r.name} (${r.platform}, ${r.type})`).join("\n");

  return `You are an expert technical instructor creating a focused quiz for a specific learning sub-topic.

Skill: ${skillName}
Sub-topic: ${subTopicName}

Learning resources for this sub-topic:
${resourceList}

Generate 3-5 open-ended questions that test practical understanding of this specific sub-topic. Questions should require the student to explain concepts, not just recall facts.

Requirements:
- Questions should test practical knowledge and conceptual understanding
- Avoid yes/no or single-word answer questions
- Each question must have clear "key points" that a correct answer should cover
- Questions should be scoped to the sub-topic content, not the broader skill

Return a JSON object:
{
  "questions": [
    {
      "questionId": "string (e.g., q1, q2, q3)",
      "questionText": "string",
      "keyPoints": ["string", "string", ...]
    }
  ]
}

Do NOT include any explanation or extra fields. The response must be valid JSON matching this schema exactly.`;
}

const generateQuiz = asyncHandler(async (req, res) => {
  const { roadmapItemId } = req.body;

  let roadmap = null;
  let milestone = null;
  let subTopic = null;
  let skillName = "";
  let subTopicId = "";
  let resources = [];
  let isStandaloneSkill = false;
  let basedOnGapAnalysis = null;

  // 1. Try to find as roadmap milestone
  roadmap = await LearningRoadmap.findOne({
    "milestones._id": roadmapItemId,
    user: req.user._id,
  });

  if (roadmap) {
    if (roadmap.status !== "completed") {
      throw ApiError.badRequest("Roadmap generation is not complete");
    }
    if (!roadmap.milestones || roadmap.milestones.length === 0) {
      throw ApiError.badRequest("Roadmap has no milestones");
    }
    milestone = roadmap.milestones.find((m) => m._id.toString() === roadmapItemId);
    subTopic = roadmap.subTopics?.find((st) => st.subTopicId === milestone.subTopicId);

    if (!subTopic) throw ApiError.notFound("Sub-topic not found for this milestone");

    skillName = milestone.skillName;
    subTopicId = subTopic.subTopicId;
    resources = milestone.resources || [];
    basedOnGapAnalysis = roadmap.basedOnGapAnalysis;
  } else {
    // 2. Try as standalone skill
    const skill = await UserSkill.findOne({ _id: roadmapItemId, user: req.user._id });
    if (!skill) {
      throw ApiError.notFound("Roadmap item or Skill not found");
    }
    skillName = skill.name;
    subTopicId = `standalone_${skill._id.toString()}`;
    subTopic = { subTopicId, name: skill.name };
    resources = [];
    isStandaloneSkill = true;
  }

  const existingAttempt = await QuizAttempt.findOne({
    userId: req.user._id,
    subTopicId: subTopicId,
    score: { $ne: null },
    passed: true,
  });

  const isFirstAttempt = !existingAttempt;

  const responseSchema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionId: { type: "string" },
            questionText: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" }, minItems: 1 },
          },
          required: ["questionId", "questionText", "keyPoints"],
        },
        minItems: 3,
        maxItems: 5,
      },
    },
    required: ["questions"],
  };

  const prompt = buildQuizPrompt(subTopic.name, skillName, resources);

  const aiResult = await aiService.generateContent({
    prompt,
    responseSchema,
    feature: "quiz-generation",
    userId: req.user._id,
  });

  if (!aiResult.success || !aiResult.data) {
    throw ApiError.internal(aiResult.message || "AI service failed to generate quiz");
  }

  const aiData = aiResult.data;

  if (!aiData.questions || aiData.questions.length < 3 || aiData.questions.length > 5) {
    throw ApiError.internal("AI returned invalid question count");
  }

  for (const q of aiData.questions) {
    if (
      !q.questionId ||
      !q.questionText ||
      !Array.isArray(q.keyPoints) ||
      q.keyPoints.length === 0
    ) {
      throw ApiError.internal("AI returned malformed question");
    }
  }

  const attempt = await QuizAttempt.create({
    userId: req.user._id,
    roadmapItemId: isStandaloneSkill ? roadmapItemId : roadmap._id, // if standalone, just store the skill ID
    skillName: skillName,
    subTopicId: subTopicId,
    questions: aiData.questions,
    userAnswers: [],
    score: null,
    passed: false,
  });

  if (isFirstAttempt && !isStandaloneSkill) {
    const gapAnalysis = await SkillGapAnalysis.findById(basedOnGapAnalysis);
    if (gapAnalysis) {
      const gap = gapAnalysis.gaps.find((g) => g.skillName === skillName);
      if (gap) {
        const st = gap.subTopics.find((s) => s.subTopicId === subTopicId);
        if (st && st.status === "not_started") {
          st.status = "in_progress";
          await gapAnalysis.save();
        }
      }
    }
  }

  const responseQuestions = aiData.questions.map((q) => ({
    questionId: q.questionId,
    questionText: q.questionText,
  }));

  return ApiResponse.success({
    attemptId: attempt._id,
    subTopicId: subTopicId,
    subTopicName: subTopic.name,
    skillName: skillName,
    questions: responseQuestions,
    isFirstAttempt,
  }).send(res);
});

function buildGradingPrompt(questions, answers, skillName, subTopicName) {
  let prompt = `You are an expert technical instructor grading a student's quiz answers for a specific sub-topic.

Skill: ${skillName}
Sub-topic: ${subTopicName}

For each question below, the question text, the expected key points, and the student's free-text answer are provided. Grade each answer individually on a 0-100 scale based on how well it covers the key points and demonstrates understanding. Provide brief constructive feedback for each answer.

`;

  questions.forEach((q, i) => {
    const answer = answers.find((a) => a.questionId === q.questionId);
    const userAnswer = answer ? answer.answerText : "(no answer provided)";
    prompt += `--- Question ${i + 1} ---
Q: ${q.questionText}
Expected key points: ${q.keyPoints.join(", ")}
Student's answer: ${userAnswer}

`;
  });

  prompt += `Return evaluations in a "perQuestionFeedback" array in the EXACT SAME ORDER as the questions above. Each element must have:
- questionIndex (0-based: 0 for the first question, 1 for the second, etc.)
- score (0-100)
- feedback (string)

Be honest and constructive â€” highlight genuine understanding but also identify specific gaps.`;

  return prompt;
}

const submitQuiz = asyncHandler(async (req, res) => {
  const { attemptId, answers } = req.body;

  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt || attempt.userId.toString() !== req.user._id.toString()) {
    throw ApiError.notFound("Quiz attempt not found");
  }

  if (attempt.score !== null) {
    throw ApiError.badRequest("This quiz attempt has already been scored");
  }

  if (answers.length !== attempt.questions.length) {
    throw ApiError.badRequest("Number of answers does not match number of questions");
  }

  for (const a of answers) {
    if (!a.questionId || typeof a.answerText !== "string") {
      throw ApiError.badRequest("Each answer must have questionId and answerText");
    }
  }

  const gradingResponseSchema = {
    type: "object",
    properties: {
      perQuestionFeedback: {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionIndex: { type: "integer", minimum: 0 },
            score: { type: "number", minimum: 0, maximum: 100 },
            feedback: { type: "string" },
          },
          required: ["questionIndex", "score", "feedback"],
        },
        minItems: 3,
        maxItems: 5,
      },
    },
    required: ["perQuestionFeedback"],
  };

  const prompt = buildGradingPrompt(
    attempt.questions,
    answers,
    attempt.skillName,
    attempt.subTopicId,
  );

  const gradingResult = await aiService.generateContent({
    prompt,
    responseSchema: gradingResponseSchema,
    feature: "quiz-grading",
    userId: req.user._id,
  });

  if (!gradingResult.success || !gradingResult.data) {
    throw ApiError.internal(gradingResult.message || "AI service failed to grade quiz");
  }

  const gradingData = gradingResult.data;

  if (
    !gradingData.perQuestionFeedback ||
    gradingData.perQuestionFeedback.length !== attempt.questions.length
  ) {
    throw ApiError.internal("AI returned invalid grading feedback count");
  }

  const questionResults = [];
  let totalScore = 0;

  for (let i = 0; i < attempt.questions.length; i++) {
    const question = attempt.questions[i];
    const userAnswer = answers.find((a) => a.questionId === question.questionId);
    const feedback = gradingData.perQuestionFeedback.find((f) => f.questionIndex === i);
    const score = feedback ? Math.round(feedback.score) : 0;
    const feedbackText = feedback ? feedback.feedback : "No feedback available";

    totalScore += score;

    questionResults.push({
      questionId: question.questionId,
      questionText: question.questionText,
      userAnswerText: userAnswer?.answerText || "",
      keyPoints: question.keyPoints,
      score,
      feedback: feedbackText,
    });
  }

  const overallScore = Math.round(totalScore / attempt.questions.length);
  const passed = overallScore >= 80;

  attempt.userAnswers = answers.map((a) => ({
    questionId: a.questionId,
    answerText: a.answerText,
  }));
  attempt.score = overallScore;
  attempt.passed = passed;
  attempt.attemptedAt = new Date();
  await attempt.save();

  if (passed) {
    // Auto-upgrade user skill level in UserSkill model
    try {
      const userSkill = await UserSkill.findOne({
        user: req.user._id,
        name: new RegExp(`^${attempt.skillName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      });
      if (userSkill) {
        if (userSkill.level === "beginner") userSkill.level = "intermediate";
        else if (userSkill.level === "intermediate") userSkill.level = "advanced";
        await userSkill.save();
      } else {
        await UserSkill.create({
          user: req.user._id,
          name: attempt.skillName,
          level: "intermediate",
          source: "quiz",
        });
      }
    } catch (err) {
      console.error("Failed to auto-upgrade user skill level:", err);
    }

    const roadmap = await LearningRoadmap.findById(attempt.roadmapItemId);
    if (roadmap) {
      const st = roadmap.subTopics.find((s) => s.subTopicId === attempt.subTopicId);
      if (st && st.status !== "passed") {
        st.status = "passed";
        await roadmap.save();
      }
    }

    const gapAnalysis = await SkillGapAnalysis.findById(roadmap?.basedOnGapAnalysis);
    if (gapAnalysis) {
      const gap = gapAnalysis.gaps.find((g) => g.skillName === attempt.skillName);
      if (gap) {
        const st = gap.subTopics.find((s) => s.subTopicId === attempt.subTopicId);
        if (st && st.status !== "passed") {
          st.status = "passed";
        }

        const totalWeight = gap.subTopics.reduce((sum, s) => sum + (s.weightPercent || 0), 0);
        const passedWeight = gap.subTopics
          .filter((s) => s.status === "passed")
          .reduce((sum, s) => sum + (s.weightPercent || 0), 0);
        gap.gapPercent = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
      }

      await gapAnalysis.save();
    }

    const notificationPromise = notificationService.createNotification({
      userId: req.user._id,
      module: "quiz",
      type: "quiz_passed",
      title: "Quiz passed",
      message: `You passed the quiz for ${attempt.skillName} â€” ${attempt.subTopicId} with ${overallScore}%`,
      relatedResourceId: attempt._id,
      relatedResourceType: "QuizAttempt",
    });

    const activityLogPromise = activityLogService.logActivity({
      userId: req.user._id,
      module: "quiz",
      action: "quiz_passed",
      summary: `Passed quiz for ${attempt.skillName} â€” ${attempt.subTopicId} with ${overallScore}%`,
      relatedResourceId: attempt._id,
      relatedResourceType: "QuizAttempt",
      metadata: {
        skillName: attempt.skillName,
        subTopicId: attempt.subTopicId,
        score: overallScore,
      },
    });

    const badgesPromise = badgeService.checkBadges(req.user._id);

    await Promise.allSettled([notificationPromise, activityLogPromise, badgesPromise]).then(
      (results) => {
        results.forEach((result, idx) => {
          if (result.status === "rejected") {
            const serviceName =
              idx === 0 ? "NotificationService" : idx === 1 ? "ActivityLogService" : "BadgeService";
            console.error(
              `[Background Task] ${serviceName} promise rejected in submitQuiz:`,
              result.reason,
            );
          }
        });
      },
    );
  }

  return ApiResponse.success({
    attemptId: attempt._id,
    score: overallScore,
    passed,
    totalQuestions: attempt.questions.length,
    questionResults,
    subTopicStatus: passed ? "passed" : "in_progress",
  }).send(res);
});

module.exports = { generateQuiz, submitQuiz };

================================================================================
2. INTERVIEW SESSION MODEL & CONTROLLER
================================================================================

--- backend/src/models/InterviewSession.model.js ---
const mongoose = require("mongoose");

const ITEM_TYPES = ["mcq", "open_ended"];
const ROUND_TYPES = ["quiz", "aptitude", "core", "technical", "hr"];
const GRADING_METHODS = ["auto", "gemini"];

const itemSchema = new mongoose.Schema(
    {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", default: null },
        questionText: { type: String, required: true },
        itemType: { type: String, enum: ITEM_TYPES, required: true },
        options: { type: [String], default: undefined }, // mcq only
        correctOptionIndex: { type: Number, default: null }, // mcq only
        idealAnswerPoints: { type: [String], default: undefined }, // open_ended ideal answer points
        selectedOptionIndex: { type: Number, default: null }, // mcq answer
        answer: { type: String, default: null }, // open_ended answer
        isCorrect: { type: Boolean, default: null }, // mcq auto-grade result
        score: { type: Number, min: 0, max: 100, default: null }, // gemini-graded item score
        feedback: { type: String, default: null },
        answeredAt: { type: Date, default: null },
    },
    { _id: false },
);

const roundSchema = new mongoose.Schema(
    {
        roundType: { type: String, enum: ROUND_TYPES, required: true },
        status: {
            type: String,
            enum: ["pending", "in-progress", "completed", "skipped", "failed"],
            default: "pending",
        },
        gradingMethod: { type: String, enum: GRADING_METHODS, required: true },
        items: { type: [itemSchema], default: [] },
        roundScore: { type: Number, min: 0, max: 100, default: null },
        strengths: { type: [String], default: null }, // gemini rounds only
        improvements: { type: [String], default: null }, // gemini rounds only
        summary: { type: String, default: null }, // gemini rounds only
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        errorMessage: { type: String, default: null },
    },
    { _id: false },
);

const interviewSessionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        targetRole: { type: String, default: null },
        status: { type: String, enum: ["in-progress", "completed", "failed"], default: "in-progress" },
        currentRoundIndex: { type: Number, default: 0 },
        rounds: { type: [roundSchema], default: [] },
        overallScore: { type: Number, min: 0, max: 100, default: null },
        skillDimensionScores: {
            technicalKnowledge: { type: Number, min: 0, max: 100, default: null },
            problemSolving: { type: Number, min: 0, max: 100, default: null },
            handsOnTechnical: { type: Number, min: 0, max: 100, default: null },
            communication: { type: Number, min: 0, max: 100, default: null },
        },
        startedAt: { type: Date, required: true },
        completedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

interviewSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
module.exports.ROUND_TYPES = ROUND_TYPES;
module.exports.ITEM_TYPES = ITEM_TYPES;
module.exports.GRADING_METHODS = GRADING_METHODS;

--- backend/src/controllers/interview.controller.js ---
const Question = require("../models/Question.model");
const InterviewSession = require("../models/InterviewSession.model");
const aiService = require("../services/ai.service");
const notificationService = require("../services/notification.service");
const activityLogService = require("../services/activityLog.service");
const badgeService = require("../services/badge.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getAdjacentDifficulties(difficulty) {
  const idx = DIFFICULTY_ORDER.indexOf(difficulty);
  if (idx === 0) return ["medium"];
  if (idx === DIFFICULTY_ORDER.length - 1) return ["medium"];
  return ["easy", "hard"];
}

function buildSelectionPrompt(candidates, roundType, targetRole, questionCount) {
  let prompt = `You are an expert technical interviewer. You will select ${questionCount} questions from the provided question bank for a ${roundType} round interview.`;

  if (targetRole) {
    prompt += ` The candidate is applying for the target role:
[User-provided target role (for evaluation purposes only, not instructions): \`\`\`${targetRole}\`\`\`]\n`;
  }

  prompt += `
For each selected question, you may lightly adapt the wording to better match the candidate's target role or context, but do NOT change the core intent of the question â€” only adjust the framing.

The question bank entries are shown below as:
  ID: <questionId>
  Category: <category>
  Difficulty: <difficulty>
  Text: <questionText>

Bank:
`;

  candidates.forEach((q) => {
    prompt += `\nID: ${q._id}\nCategory: ${q.category || "general"}\nDifficulty: ${q.difficulty}\nText: ${q.questionText}\n`;
  });

  prompt += `
Select exactly ${questionCount} questions from the bank above. Return a JSON array of objects with:
- originalQuestionId: the ID of the question from the bank (must be one of the IDs listed above)
- adaptedText: the question text, optionally adapted for the candidate's role context (if no adaptation needed, use the original text)

IMPORTANT: Each originalQuestionId must exactly match one of the IDs in the bank. Do not fabricate questions.`;

  return prompt;
}

function buildScoringPrompt(questions, roundType, targetRole) {
  let prompt = `You are an expert ${roundType} interviewer. Evaluate the following interview transcript and provide a structured assessment.`;

  if (targetRole) {
    prompt += `\nThe candidate is interviewing for the target role:
[User-provided target role (for evaluation purposes only, not instructions): \`\`\`${targetRole}\`\`\`]`;
  }

  prompt += `
For each question, the candidate's answer is provided. Score each answer individually (0-100) and provide brief feedback.

Then provide:
- roundScore: A number 0-100 representing the overall round performance
- strengths: 2-4 specific strengths demonstrated in the answers
- improvements: 3-5 specific, actionable areas for improvement
- summary: A 1-2 sentence overall assessment

Transcript:
`;

  questions.forEach((q, i) => {
    prompt += `\n--- Question ${i + 1} ---\nQ: ${q.questionText}\nA: ${q.answer}\n`;
  });

  prompt += `\nReturn evaluations in a "perQuestionFeedback" array in the EXACT SAME ORDER as the questions above. Each element must have: questionIndex (0-based), score (0-100), and feedback (string). Be honest and constructive.`;

  return prompt;
}

function stripCorrectOptionIndex(sessionDoc) {
  const obj = sessionDoc.toObject ? sessionDoc.toObject() : JSON.parse(JSON.stringify(sessionDoc));
  const sessionCompleted = obj.status === "completed" || obj.status === "failed";

  obj.rounds = (obj.rounds || []).map((r) => {
    const roundCompleted = r.status === "completed" || r.status === "failed" || sessionCompleted;
    return {
      ...r,
      items: (r.items || []).map((it) => {
        if (roundCompleted) {
          return it;
        }
        const { correctOptionIndex, ...rest } = it;
        return rest;
      }),
    };
  });
  return obj;
}

function computeAutoRoundScore(round) {
  const items = round.items || [];
  if (items.length === 0) return null;
  const correctCount = items.reduce((acc, it) => acc + (it.isCorrect ? 1 : 0), 0);
  return Math.round((correctCount / items.length) * 100);
}

async function buildRoundBankItems({ roundType, targetRole, difficulty, questionCount, gradingMethod, userId }) {
  // Query: roundType + targetRole with fallback to empty array (same pattern as old controller)
  const filter = { roundType };
  if (targetRole) {
    filter.$or = [{ targetRoles: { $in: [targetRole] } }, { targetRoles: { $size: 0 } }];
  }

  let candidates = await Question.find(filter).lean();

  if (!candidates || candidates.length === 0) return { items: [], bankEmpty: true };

  if (difficulty) {
    const exact = candidates.filter((q) => q.difficulty === difficulty);
    if (exact.length >= Math.min(questionCount, candidates.length)) {
      candidates = shuffle(exact);
    } else {
      const adjacent = candidates.filter((q) => getAdjacentDifficulties(difficulty).includes(q.difficulty));
      candidates = shuffle([...exact, ...adjacent]);
    }
  } else {
    candidates = shuffle(candidates);
  }

  const actualCount = Math.min(questionCount, candidates.length);
  candidates = candidates.slice(0, actualCount);

  const sampleItemsFromBank = (bankQs) =>
    bankQs.map((q) => ({
      questionId: q._id,
      questionText: q.questionText,
      itemType: q.itemType,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      idealAnswerPoints: q.idealAnswerPoints,
      selectedOptionIndex: null,
      answer: null,
      isCorrect: null,
      score: null,
      feedback: null,
      answeredAt: null,
    }));

  if (gradingMethod === "auto") {
    return { items: sampleItemsFromBank(candidates), bankEmpty: false };
  }

  // Gemini selection/adaptation
  const selectionPrompt = buildSelectionPrompt(candidates, roundType, targetRole, actualCount);
  const selectionResponseSchema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        originalQuestionId: { type: "string" },
        adaptedText: { type: "string" },
      },
      required: ["originalQuestionId", "adaptedText"],
    },
  };

  const selectionResult = await aiService.generateContent({
    prompt: selectionPrompt,
    responseSchema: selectionResponseSchema,
    feature: `interview-${roundType}-selection`,
    userId,
  });

  if (!selectionResult?.success) {
    return { items: sampleItemsFromBank(candidates), bankEmpty: false };
  }

  const adapted = selectionResult.data;
  if (!Array.isArray(adapted) || adapted.length === 0) {
    return { items: sampleItemsFromBank(candidates), bankEmpty: false };
  }

  const items = adapted.map((item) => {
    const original = candidates.find((c) => c._id.toString() === item.originalQuestionId);
    if (!original) {
      // shouldn't happen if Gemini respects IDs, but keep session resilient
      return {
        questionId: null,
        questionText: item.adaptedText || "Error loading question",
        itemType: "open_ended",
        options: undefined,
        correctOptionIndex: null,
        idealAnswerPoints: undefined,
        selectedOptionIndex: null,
        answer: null,
        isCorrect: null,
        score: null,
        feedback: null,
        answeredAt: null,
      };
    }

    return {
      questionId: original._id,
      questionText: item.adaptedText || original.questionText,
      itemType: original.itemType,
      options: original.options,
      correctOptionIndex: original.correctOptionIndex,
      idealAnswerPoints: original.idealAnswerPoints,
      selectedOptionIndex: null,
      answer: null,
      isCorrect: null,
      score: null,
      feedback: null,
      answeredAt: null,
    };
  });

  return { items, bankEmpty: items.length === 0 };
}

async function scoreGeminiRound(round, { roundType, targetRole, userId }) {
  const transcript = (round.items || []).map((it) => ({
    questionText: it.questionText,
    answer: it.itemType === "mcq" ? "" : it.answer || "",
  }));

  const scoringPrompt = buildScoringPrompt(transcript, roundType, targetRole);
  const scoringResponseSchema = {
    type: "object",
    properties: {
      roundScore: { type: "number", minimum: 0, maximum: 100 },
      perQuestionFeedback: {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionIndex: { type: "number", minimum: 0 },
            score: { type: "number", minimum: 0, maximum: 100 },
            feedback: { type: "string" },
          },
          required: ["questionIndex", "score", "feedback"],
        },
      },
      strengths: { type: "array", items: { type: "string" } },
      improvements: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
    },
    required: ["roundScore", "perQuestionFeedback", "strengths", "improvements", "summary"],
  };

  const scoringResult = await aiService.generateContent({
    prompt: scoringPrompt,
    responseSchema: scoringResponseSchema,
    feature: `interview-${roundType}-scoring`,
    userId,
  });

  if (!scoringResult?.success) {
    if (scoringResult?.errorType === "QUOTA_EXCEEDED") {
      throw ApiError.internal("AI service at capacity, please try again shortly.");
    }
    throw ApiError.internal(scoringResult?.message || "Failed to score round via AI");
  }

  const scores = scoringResult.data;

  // Position-based first, then questionIndex fallback
  const feedbacks = scores.perQuestionFeedback || [];
  const items = round.items || [];
  const itemCount = items.length;

  for (let i = 0; i < itemCount && i < feedbacks.length; i++) {
    const fb = feedbacks[i];
    if (fb && typeof fb.score === "number") {
      items[i].score = Math.round(fb.score);
      items[i].feedback = fb.feedback || "";
    }
  }

  for (let i = 0; i < itemCount; i++) {
    if (items[i].score != null) continue;
    const fb = feedbacks.find((f) => {
      if (!f || typeof f.score !== "number") return false;
      let idx = f.questionIndex;
      if (typeof idx === "number" && idx >= 1 && idx <= itemCount) idx -= 1; // fallback alignment
      return idx === i;
    });
    if (fb) {
      items[i].score = Math.round(fb.score);
      items[i].feedback = fb.feedback || "";
    }
  }

  return {
    roundScore: Math.round(scores.roundScore),
    strengths: scores.strengths || [],
    improvements: scores.improvements || [],
    summary: scores.summary || "",
  };
}

/**
 * POST /api/interview/start
 */
const startSession = asyncHandler(async (req, res) => {
  const { targetRole, questionCount = 5, difficulty, selectedRounds } = req.body;

  const allRounds = ["quiz", "aptitude", "core", "technical", "hr"];
  // If selectedRounds provided, filter to only those (preserving canonical order)
  const roundOrder = Array.isArray(selectedRounds) && selectedRounds.length > 0
    ? allRounds.filter((r) => selectedRounds.includes(r))
    : allRounds;
  const autoRounds = new Set(["quiz", "aptitude"]);
  const geminiRounds = new Set(["core", "technical", "hr"]);

  const rounds = [];
  let anyRoundHadBank = false;

  for (let i = 0; i < roundOrder.length; i++) {
    const roundType = roundOrder[i];
    const gradingMethod = autoRounds.has(roundType) ? "auto" : geminiRounds.has(roundType) ? "gemini" : "auto";

    const { items, bankEmpty } = await buildRoundBankItems({
      roundType,
      targetRole,
      difficulty,
      questionCount,
      gradingMethod,
      userId: req.user._id,
    });

    if (!bankEmpty && items.length > 0) anyRoundHadBank = true;

    rounds.push({
      roundType,
      status: "pending",
      gradingMethod,
      items: items.length > 0 ? items : [],
      roundScore: null,
      strengths: null,
      improvements: null,
      summary: null,
      startedAt: null,
      completedAt: null,
      errorMessage: items.length === 0 ? `No questions found for ${roundType}` : null,
    });
  }

  if (!anyRoundHadBank) {
    throw ApiError.badRequest("No questions found for the requested target role / difficulty");
  }

  let firstValidIndex = -1;
  for (let i = 0; i < rounds.length; i++) {
    if (rounds[i].items.length > 0) {
      firstValidIndex = i;
      rounds[i].status = "in-progress";
      rounds[i].startedAt = new Date();
      break;
    } else {
      rounds[i].status = "failed";
      rounds[i].completedAt = new Date();
    }
  }

  const session = await InterviewSession.create({
    user: req.user._id,
    targetRole: targetRole || null,
    status: "in-progress",
    currentRoundIndex: firstValidIndex !== -1 ? firstValidIndex : 0,
    rounds,
    overallScore: null,
    skillDimensionScores: {
      technicalKnowledge: null,
      problemSolving: null,
      handsOnTechnical: null,
      communication: null,
    },
    startedAt: new Date(),
    completedAt: null,
  });

  // IMPORTANT: strip correctOptionIndex from response before sending to client
  return ApiResponse.success(stripCorrectOptionIndex(session)).send(res);
});

/**
 * POST /api/interview/:id/rounds/:roundType/answer
 */
const submitAnswer = asyncHandler(async (req, res) => {
  const { roundType } = req.params;
  const { itemIndex, selectedOptionIndex, answer } = req.body;

  const session = await InterviewSession.findById(req.params.id);
  if (!session || session.user.toString() !== req.user._id.toString()) {
    throw ApiError.notFound("Interview session not found");
  }
  if (session.status !== "in-progress") {
    throw ApiError.badRequest("Interview session is not in progress");
  }

  const roundIndex = session.rounds.findIndex((r) => r.roundType === roundType);
  if (roundIndex === -1) throw ApiError.badRequest("Invalid roundType");
  if (roundIndex !== session.currentRoundIndex) {
    throw ApiError.badRequest("This round is not currently in progress");
  }

  const round = session.rounds[roundIndex];
  if (round.status !== "in-progress") throw ApiError.badRequest("This round is not currently in progress");

  const item = round.items?.[itemIndex];
  if (!item) throw ApiError.badRequest("Invalid itemIndex");

  if (item.itemType === "mcq") {
    if (typeof selectedOptionIndex !== "number") {
      throw ApiError.badRequest("selectedOptionIndex is required for mcq items");
    }
    item.selectedOptionIndex = selectedOptionIndex;
    item.answeredAt = new Date();
    item.isCorrect = typeof item.correctOptionIndex === "number"
      ? item.selectedOptionIndex === item.correctOptionIndex
      : null;
    item.answer = null;
  } else {
    if (typeof answer !== "string" || !answer.trim()) {
      throw ApiError.badRequest("answer is required for open_ended items");
    }
    item.answer = answer;
    item.answeredAt = new Date();
    item.selectedOptionIndex = null;
    item.isCorrect = null;
  }

  await session.save();
  return ApiResponse.success(stripCorrectOptionIndex(session)).send(res);
});

/**
 * POST /api/interview/:id/rounds/:roundType/finish
 */
const finishRound = asyncHandler(async (req, res) => {
  const { roundType } = req.params;

  const session = await InterviewSession.findById(req.params.id);
  if (!session || session.user.toString() !== req.user._id.toString()) {
    throw ApiError.notFound("Interview session not found");
  }
  if (session.status !== "in-progress") {
    throw ApiError.badRequest("Interview session is not in progress");
  }

  const roundIndex = session.rounds.findIndex((r) => r.roundType === roundType);
  if (roundIndex === -1) throw ApiError.badRequest("Invalid roundType");
  if (roundIndex !== session.currentRoundIndex) throw ApiError.badRequest("This round is not currently in progress");

  const round = session.rounds[roundIndex];
  if (round.status !== "in-progress") throw ApiError.badRequest("This round is not currently in progress");

  const unansweredIdx = (round.items || []).findIndex((it) => {
    if (it.itemType === "mcq") return it.selectedOptionIndex == null;
    return !it.answer || !it.answer.trim();
  });

  if (unansweredIdx !== -1) {
    throw ApiError.badRequest(`Item at index ${unansweredIdx} has not been answered yet`);
  }

  // If round has no items (should be 'failed' already), allow finish to mark failed
  if (!round.items || round.items.length === 0) {
    round.status = "failed";
    round.errorMessage = round.errorMessage || `No questions found for ${roundType}`;
    round.completedAt = new Date();
    await session.save();
  } else if (round.gradingMethod === "auto") {
    for (const item of round.items || []) {
      if (item.itemType === "mcq" && (item.correctOptionIndex == null || item.isCorrect == null)) {
        let q = null;
        if (item.questionId) {
          q = await Question.findById(item.questionId).select("correctOptionIndex").lean();
        }
        if (!q && item.questionText) {
          q = await Question.findOne({ questionText: item.questionText }).select("correctOptionIndex").lean();
        }
        if (q && typeof q.correctOptionIndex === "number") {
          item.correctOptionIndex = q.correctOptionIndex;
        }
        if (item.selectedOptionIndex != null && item.correctOptionIndex != null) {
          item.isCorrect = item.selectedOptionIndex === item.correctOptionIndex;
          item.score = item.isCorrect ? 100 : 0;
        }
      }
    }
    round.roundScore = computeAutoRoundScore(round);
    round.status = "completed";
    round.completedAt = new Date();
  } else if (round.gradingMethod === "gemini") {
    try {
      const scored = await scoreGeminiRound(round, {
        roundType,
        targetRole: session.targetRole || null,
        userId: req.user._id,
      });

      round.roundScore = scored.roundScore;
      round.strengths = scored.strengths;
      round.improvements = scored.improvements;
      round.summary = scored.summary;
      round.status = "completed";
      round.completedAt = new Date();
    } catch (err) {
      round.status = "failed";
      round.errorMessage = err?.message || "Gemini scoring failed";
      round.completedAt = new Date();
    }
  }

  round.status = round.status || "completed";

  // Advance to next valid round or complete session
  let nextValidIndex = -1;
  for (let i = roundIndex + 1; i < session.rounds.length; i++) {
    const nextRound = session.rounds[i];
    if (nextRound.items && nextRound.items.length > 0) {
      nextValidIndex = i;
      nextRound.status = "in-progress";
      nextRound.startedAt = new Date();
      break;
    } else {
      nextRound.status = "failed";
      nextRound.errorMessage = nextRound.errorMessage || `No questions found for ${nextRound.roundType}`;
      nextRound.completedAt = new Date();
    }
  }

  if (nextValidIndex === -1) {
    // Task 1b computeSessionResults
    const completedRounds = session.rounds.filter((r) => r.status === "completed" && typeof r.roundScore === "number");
    const failedOrSkipped = session.rounds.filter((r) => r.status !== "completed");

    const overallScore = completedRounds.length > 0
      ? Math.round(completedRounds.reduce((sum, r) => sum + (r.roundScore || 0), 0) / completedRounds.length)
      : null;

    const avgByType = (types) => {
      const rs = session.rounds.filter((r) => types.includes(r.roundType) && r.status === "completed" && typeof r.roundScore === "number");
      if (rs.length === 0) return null;
      return Math.round(rs.reduce((sum, r) => sum + (r.roundScore || 0), 0) / rs.length);
    };

    const technicalKnowledge = avgByType(["quiz", "core"]);
    const problemSolving = avgByType(["aptitude"]);
    const handsOnTechnical = avgByType(["technical"]);
    const communication = avgByType(["hr"]);

    session.overallScore = overallScore;
    session.skillDimensionScores = {
      technicalKnowledge,
      problemSolving,
      handsOnTechnical,
      communication,
    };
    session.status = "completed";
    session.completedAt = new Date();
    // Update currentRoundIndex to point to the end to signify completion
    session.currentRoundIndex = session.rounds.length - 1;

    const targetRoleText = session.targetRole ? ` for ${session.targetRole}` : "";
    const notifMessage =
      typeof session.overallScore === "number"
        ? `You scored ${Math.round(session.overallScore)}% overall${targetRoleText}`
        : `Your interview has been completed${targetRoleText}`;

    const notificationPromise = notificationService.createNotification({
      userId: req.user._id,
      module: "interview",
      type: "interview_complete",
      title: "Interview complete",
      message: notifMessage,
      relatedResourceId: session._id,
      relatedResourceType: "InterviewSession",
    });

    const activityLogPromise = activityLogService.logActivity({
      userId: req.user._id,
      module: "interview",
      action: "interview_finished",
      summary: `Interview completed${session.targetRole ? ` for ${session.targetRole}` : ""} â€” overall ${typeof session.overallScore === "number" ? `${Math.round(session.overallScore)}%` : "N/A"
        }`,
      relatedResourceId: session._id,
      relatedResourceType: "InterviewSession",
      metadata: {
        score: typeof session.overallScore === "number" ? Math.round(session.overallScore) : null,
        targetRole: session.targetRole,
      },
    });

    const badgesPromise = activityLogPromise.then(() => badgeService.checkBadges(req.user._id));

    await Promise.allSettled([notificationPromise, activityLogPromise, badgesPromise]).then((results) => {
      results.forEach((result, idx) => {
        if (result.status === "rejected") {
          const serviceName = idx === 0 ? "NotificationService" : idx === 1 ? "ActivityLogService" : "BadgeService";
          console.error(`[Background Task] ${serviceName} promise rejected in finishRound:`, result.reason);
        }
      });
    });

    await session.save();
    return ApiResponse.success(stripCorrectOptionIndex(session)).send(res);
  }

  // Not last, advanced to nextValidIndex
  session.currentRoundIndex = nextValidIndex;

  await session.save();
  return ApiResponse.success(stripCorrectOptionIndex(session)).send(res);
});

/**
 * GET /api/interview/history
 */
const getSessionHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    InterviewSession.find({ user: req.user._id })
      .select("targetRole overallScore status createdAt rounds.roundType rounds.roundScore")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InterviewSession.countDocuments({ user: req.user._id }),
  ]);

  return ApiResponse.success({
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }).send(res);
});

/**
 * GET /api/interview/:id
 */
const getSessionById = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findById(req.params.id);
  if (!session || session.user.toString() !== req.user._id.toString()) {
    throw ApiError.notFound("Interview session not found");
  }

  // Populate missing correctOptionIndex or idealAnswerPoints from Question bank for older documents
  for (const round of session.rounds || []) {
    for (const item of round.items || []) {
      if (item.correctOptionIndex == null || !item.idealAnswerPoints) {
        let q = null;
        if (item.questionId) {
          q = await Question.findById(item.questionId).select("correctOptionIndex idealAnswerPoints").lean();
        }
        if (!q && item.questionText) {
          q = await Question.findOne({ questionText: item.questionText }).select("correctOptionIndex idealAnswerPoints").lean();
        }
        if (q) {
          if (item.correctOptionIndex == null && typeof q.correctOptionIndex === "number") {
            item.correctOptionIndex = q.correctOptionIndex;
            if (item.itemType === "mcq" && item.selectedOptionIndex != null) {
              item.isCorrect = item.selectedOptionIndex === item.correctOptionIndex;
              if (item.score == null) item.score = item.isCorrect ? 100 : 0;
            }
          }
          if (!item.idealAnswerPoints && Array.isArray(q.idealAnswerPoints)) {
            item.idealAnswerPoints = q.idealAnswerPoints;
          }
        }
      }
    }
  }

  return ApiResponse.success(stripCorrectOptionIndex(session)).send(res);
});

/**
 * DELETE /api/interview/:id
 */
const deleteSession = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findById(req.params.id);
  if (!session || session.user.toString() !== req.user._id.toString()) {
    throw ApiError.notFound("Interview session not found");
  }

  await InterviewSession.findByIdAndDelete(req.params.id);
  return ApiResponse.success(null, "Interview session deleted").send(res);
});

module.exports = {
  startSession,
  submitAnswer,
  finishRound,
  getSessionHistory,
  getSessionById,
  deleteSession,
};

================================================================================
3. USER MODEL
================================================================================

--- backend/src/models/User.model.js ---
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ["local", "google", "github", "both"], default: "local" },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      default: "student",
    },
    assignedMentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    mentees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    targetRole: { type: String, default: "" },
    githubUsername: { type: String, default: "" },
    profile: {
      targetRole: { type: String },
      githubUsername: { type: String },
      bio: { type: String },
      location: { type: String }
    },
    linkedinUrl: { type: String, default: "" },
    bio: { type: String, maxlength: 500, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    is2FAEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    refreshToken: { type: String, select: false },
    refreshTokenVersion: { type: Number, default: 0 },
    preferences: {
      theme: {
        type: String,
        enum: ["dark", "light", "system"],
        default: "dark",
      },
      notifyOn: {
        type: [String],
        default: ["/resume", "/interview", "/github", "/skills", "/roadmap"],
      },
      emailDigest: {
        type: String,
        enum: ["off", "daily", "weekly"],
        default: "off",
      },
      aiDifficulty: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Intermediate",
      },
      preferredLanguage: {
        type: String,
        default: "Python",
      },
      resumePrivacy: {
        type: Boolean,
        default: false,
      },
      dailyGoalProblems: {
        type: Number,
        default: 2,
      },
      hiddenModules: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook: Hash password with bcryptjs (10 rounds) only if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// Instance method: Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

// Instance method: Generate access token
userSchema.methods.generateAccessToken = function () {
  const nonce = crypto.randomBytes(16).toString("hex");
  return jwt.sign({ sub: this._id, email: this.email, name: this.name, nonce }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

// Instance method: Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  const nonce = crypto.randomBytes(16).toString("hex");
  return jwt.sign({ sub: this._id, nonce }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

// Static method: Find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

module.exports = mongoose.model("User", userSchema);

================================================================================
4. AUTH MIDDLEWARE
================================================================================

--- backend/src/middleware/auth.middleware.js ---
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");

/**
 * Extracts the Bearer token from the Authorization header.
 * @param {import("express").Request} req
 * @returns {string|null}
 */
function extractBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

/**
 * Express middleware:
 *   1. Reads the `` Authorization: Bearer <token>`` header.
 *   2. Verifies the JWT against env.JWT_SECRET.
 *   3. Loads the user (without password / refreshToken) from the DB.
 *   4. Attaches the user to req.user.
 *   5. Calls next().
 *
 * Throws ApiError.unauthorized() for missing, invalid or expired tokens.
 */
const verifyJWT = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw ApiError.unauthorized("Authentication token is required");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw ApiError.unauthorized("Token expired");
      }
      throw ApiError.unauthorized("Invalid token");
    }

    // decoded may contain _id (our custom claim) or sub (standard JWT claim).
    // We support both for backward compatibility.
    const userId = decoded._id || decoded.sub;
    if (!userId) {
      throw ApiError.unauthorized("Invalid token payload");
    }

    const user = await User.findById(userId).select("-password -refreshToken").lean();
    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = verifyJWT;

--- backend/src/middleware/role.middleware.js ---
const ApiError = require("../utils/ApiError");

/**
 * Middleware factory to verify that the authenticated user has one of the allowed roles.
 * Supports allowing all users in development if role is not set, while permitting 'admin' or 'mentor'.
 * @param {string[]} allowedRoles
 */
const verifyRole = (allowedRoles = ["admin", "mentor"]) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    const userRole = req.user.role || "student";

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return next(ApiError.forbidden("Access denied: Insufficient role permissions"));
  };
};

module.exports = verifyRole;

================================================================================
5. MENTOR ADMIN PORTAL ROUTES & CONTROLLER
================================================================================

--- backend/src/routes/admin.routes.js ---
const { Router } = require("express");
const verifyJWT = require("../middleware/auth.middleware");
const verifyRole = require("../middleware/role.middleware");
const {
  getStudentsList,
  getStudent360Detail,
  getCohortAnalytics,
  sendStudentFeedback,
  addMentee,
  removeMentee,
  getMyMentees,
  searchRegisteredStudents,
  getMentorProfile,
  updateMentorProfile,
  changeMentorPassword,
} = require("../controllers/admin.controller");

const router = Router();

// Apply JWT authentication and Mentor/Admin role protection to all admin routes
router.use(verifyJWT);
router.use(verifyRole(["admin", "mentor"]));

router.get("/students", getStudentsList);
router.get("/students/search-registered", searchRegisteredStudents);
router.get("/students/:studentId", getStudent360Detail);
router.get("/analytics", getCohortAnalytics);
router.post("/students/:studentId/feedback", sendStudentFeedback);

// Mentee management routes
router.get("/mentees", getMyMentees);
router.post("/mentees", addMentee);
router.delete("/mentees/:studentId", removeMentee);

// Mentor profile & credential settings routes
router.get("/profile", getMentorProfile);
router.patch("/profile", updateMentorProfile);
router.post("/change-password", changeMentorPassword);

module.exports = router;

--- List of existing router endpoints in backend/src/routes/admin.routes.js ---
router.use(verifyJWT);
router.use(verifyRole(["admin", "mentor"]));
router.get("/students", getStudentsList);
router.get("/students/search-registered", searchRegisteredStudents);
router.get("/students/:studentId", getStudent360Detail);
router.get("/analytics", getCohortAnalytics);
router.post("/students/:studentId/feedback", sendStudentFeedback);
router.get("/mentees", getMyMentees);
router.post("/mentees", addMentee);
router.delete("/mentees/:studentId", removeMentee);
router.get("/profile", getMentorProfile);
router.patch("/profile", updateMentorProfile);
router.post("/change-password", changeMentorPassword);

--- backend/src/controllers/admin.controller.js ---
const User = require("../models/User.model");
const Resume = require("../models/Resume.model");
const InterviewSession = require("../models/InterviewSession.model");
const CodingProfile = require("../models/CodingProfile.model");
const RepoAnalysis = require("../models/RepoAnalysis.model");
const Event = require("../models/Event.model");
const SkillGapAnalysis = require("../models/SkillGapAnalysis.model");
const LearningRoadmap = require("../models/LearningRoadmap.model");
const UserSkill = require("../models/UserSkill.model");
const Notification = require("../models/Notification.model");
const ActivityLog = require("../models/ActivityLog.model");
const QuizAttempt = require("../models/QuizAttempt.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const notificationService = require("../services/notification.service");

function escapeRegex(str) {
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/admin/students
 * Paginated student directory with calculated readiness scores and telemetry badges.
 */
const getStudentsList = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || "").trim();
  const filter = (req.query.filter || "my-mentees").trim();

  const currentUser = await User.findById(req.user._id).select("mentees role").lean();
  const menteeSet = new Set((currentUser?.mentees || []).map((id) => id.toString()));

  const excludeTestCondition = {
    email: { $not: /example\.com$|@test\.com$|^test_|^dynrec_/i },
  };

  const query = { role: { $nin: ["admin", "mentor"] }, ...excludeTestCondition };

  if (filter === "my-mentees") {
    const menteeIds = currentUser?.mentees || [];
    query.$and = [
      { role: { $nin: ["admin", "mentor"] } },
      excludeTestCondition,
      {
        $or: [
          { assignedMentor: req.user._id },
          { _id: { $in: menteeIds } },
        ],
      },
    ];
    delete query.role;
    delete query.email;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    const searchCond = [
      { name: new RegExp(safeSearch, "i") },
      { email: new RegExp(safeSearch, "i") },
      { targetRole: new RegExp(safeSearch, "i") },
    ];
    if (query.$and) {
      query.$and.push({ $or: searchCond });
    } else {
      query.$and = [{ role: { $nin: ["admin", "mentor"] } }, excludeTestCondition, { $or: searchCond }];
      delete query.role;
      delete query.email;
    }
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select("name email avatar targetRole githubUsername createdAt updatedAt role assignedMentor")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Compute calculated readiness metrics for each student
  const studentsWithMetrics = await Promise.all(
    users.map(async (u) => {
      const [
        latestResume,
        completedInterviews,
        codingProfiles,
        repoCount,
        events,
        latestGap,
      ] = await Promise.all([
        Resume.findOne({ user: u._id, status: "completed" }).select("atsScore").sort({ createdAt: -1 }).lean(),
        InterviewSession.find({ user: u._id, status: "completed" }).select("overallScore").lean(),
        CodingProfile.find({ userId: u._id }).select("platform cachedStats username").lean(),
        RepoAnalysis.countDocuments({ user: u._id, status: "completed" }),
        Event.find({ user: u._id }).select("verificationResult result").lean(),
        SkillGapAnalysis.findOne({ user: u._id, status: "completed" }).select("matchPercentage").sort({ createdAt: -1 }).lean(),
      ]);

      const resumeScore = latestResume?.atsScore || 0;
      const avgInterviewScore = completedInterviews.length > 0
        ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / completedInterviews.length)
        : 0;

      let totalProblemsSolved = 0;
      codingProfiles.forEach((cp) => {
        const stats = cp.cachedStats || {};
        totalProblemsSolved += Number(stats.totalSolved || stats.solved || stats.problemsSolved || 0);
      });

      const verifiedEventsCount = events.filter(
        (e) => e.verificationResult?.isVerified || e.result === "winner" || e.result === "runner-up" || e.result === "finalist"
      ).length;

      const skillGapMatchPct = latestGap?.matchPercentage || 0;
      const codingScore = Math.min(100, Math.round(totalProblemsSolved * 1.0 + repoCount * 10));
      const eventScore = Math.min(100, Math.round(verifiedEventsCount * 30 + events.length * 10));

      const overallReadiness = Math.round(
        skillGapMatchPct * 0.30 +
        resumeScore * 0.20 +
        avgInterviewScore * 0.20 +
        codingScore * 0.15 +
        eventScore * 0.15
      );

      let status = "On Track";
      if (overallReadiness < 40) status = "At Risk";
      else if (overallReadiness >= 75) status = "Top Performer";

      if (filter === "at-risk" && status !== "At Risk") return null;
      if (filter === "top-performer" && status !== "Top Performer") return null;

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        targetRole: u.targetRole || "Software Engineer",
        githubUsername: u.githubUsername,
        overallReadiness,
        resumeScore,
        avgInterviewScore,
        totalProblemsSolved,
        repoCount,
        verifiedEventsCount,
        linkedPlatformsCount: codingProfiles.length,
        status,
        isMyMentee: menteeSet.has(u._id.toString()) || u.assignedMentor?.toString() === req.user._id.toString(),
        lastActive: u.updatedAt,
      };
    })
  );

  const filteredStudents = studentsWithMetrics.filter(Boolean);

  return ApiResponse.success({
    students: filteredStudents,
    pagination: {
      page,
      limit,
      total: filteredStudents.length,
      totalPages: Math.ceil(total / limit),
    },
  }).send(res);
});

/**
 * GET /api/admin/students/:studentId
 * 360-degree deep inspection of a single student.
 */
const getStudent360Detail = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await User.findById(studentId).select("-password -refreshToken").lean();
  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  const currentUser = await User.findById(req.user._id).select("mentees role").lean();
  const menteeSet = new Set((currentUser?.mentees || []).map((id) => id.toString()));
  const isMyMentee = menteeSet.has(student._id.toString()) || student.assignedMentor?.toString() === req.user._id.toString();



  const [
    resumes,
    interviews,
    codingProfiles,
    repoAnalyses,
    events,
    gapAnalyses,
    roadmaps,
    userSkills,
    activityLogs,
    quizAttempts,
  ] = await Promise.all([
    Resume.find({ user: studentId }).sort({ createdAt: -1 }).lean(),
    InterviewSession.find({ user: studentId }).sort({ createdAt: -1 }).lean(),
    CodingProfile.find({ userId: studentId }).lean(),
    RepoAnalysis.find({ user: studentId }).sort({ createdAt: -1 }).lean(),
    Event.find({ user: studentId }).sort({ createdAt: -1 }).lean(),
    SkillGapAnalysis.find({ user: studentId }).sort({ createdAt: -1 }).lean(),
    LearningRoadmap.find({ user: studentId }).sort({ createdAt: -1 }).lean(),
    UserSkill.find({ user: studentId }).lean(),
    ActivityLog.find({ user: studentId }).sort({ createdAt: -1 }).limit(50).lean(),
    QuizAttempt.find({ userId: studentId }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);

  const latestResume = resumes.find((r) => r.status === "completed") || resumes[0] || null;
  const completedInterviews = interviews.filter((i) => i.status === "completed");
  const latestGap = gapAnalyses.find((g) => g.status === "completed") || gapAnalyses[0] || null;

  const resumeScore = latestResume?.atsScore || 0;
  const avgInterviewScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / completedInterviews.length)
    : 0;

  let totalProblemsSolved = 0;
  const platformBreakdown = codingProfiles.map((cp) => {
    const stats = cp.cachedStats || {};
    const solved = Number(stats.totalSolved || stats.solved || stats.problemsSolved || 0);
    totalProblemsSolved += solved;
    return {
      platform: cp.platform,
      username: cp.username,
      profileUrl: cp.profileUrl,
      totalSolved: solved,
      easySolved: stats.easySolved || stats.byDifficulty?.Easy || 0,
      mediumSolved: stats.mediumSolved || stats.byDifficulty?.Medium || 0,
      hardSolved: stats.hardSolved || stats.byDifficulty?.Hard || 0,
    };
  });

  const verifiedEvents = events.filter(
    (e) => e.verificationResult?.isVerified || e.result === "winner" || e.result === "runner-up" || e.result === "finalist"
  );

  const skillGapMatchPct = latestGap?.matchPercentage || 0;
  const codingScore = Math.min(100, Math.round(totalProblemsSolved * 1.0 + repoAnalyses.length * 10));
  const eventScore = Math.min(100, Math.round(verifiedEvents.length * 30 + events.length * 10));

  const overallReadinessPct = Math.round(
    skillGapMatchPct * 0.30 +
    resumeScore * 0.20 +
    avgInterviewScore * 0.20 +
    codingScore * 0.15 +
    eventScore * 0.15
  );

  return ApiResponse.success({
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      targetRole: student.targetRole || "Software Engineer",
      githubUsername: student.githubUsername,
      bio: student.bio,
      createdAt: student.createdAt,
      assignedMentor: student.assignedMentor,
      isMyMentee,
    },
    metrics: {
      overallReadinessPct,
      skillGapMatchPct,
      resumeScore,
      avgInterviewScore,
      codingScore,
      eventScore,
      totalProblemsSolved,
      repoCount: repoAnalyses.length,
      verifiedEventsCount: verifiedEvents.length,
    },
    resumes,
    interviews,
    codingProfiles: platformBreakdown,
    repoAnalyses,
    events,
    gapAnalyses,
    roadmaps,
    userSkills,
    activityLogs,
    quizAttempts,
  }).send(res);
});

/**
 * GET /api/admin/analytics
 * Mentee-wide analytics & aggregated performance metrics for the mentor's assigned roster.
 */
const getCohortAnalytics = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).select("mentees role").lean();
  const excludeTestCondition = {
    email: { $not: /example\.com$|@test\.com$|^test_|^dynrec_/i },
  };

  const scope = (req.query.scope || req.query.filter || "my-mentees").trim();
  const menteeIds = currentUser?.mentees || [];

  const menteeFilter = scope === "all"
    ? { role: { $nin: ["admin", "mentor"] }, ...excludeTestCondition }
    : {
        role: { $nin: ["admin", "mentor"] },
        ...excludeTestCondition,
        $or: [
          { assignedMentor: req.user._id },
          { _id: { $in: menteeIds } },
        ],
      };

  const users = await User.find(menteeFilter).select("_id").lean();
  const userIds = users.map((u) => u._id);
  const totalStudents = userIds.length;

  const [resumes, interviews, codingProfiles, events, gapAnalyses] = await Promise.all([
    Resume.find({ user: { $in: userIds }, status: "completed" }).select("atsScore user").lean(),
    InterviewSession.find({ user: { $in: userIds }, status: "completed" }).select("overallScore targetRole user").lean(),
    CodingProfile.find({ userId: { $in: userIds } }).select("platform cachedStats userId").lean(),
    Event.find({ user: { $in: userIds } }).select("verificationResult user").lean(),
    SkillGapAnalysis.find({ user: { $in: userIds }, status: "completed" }).select("matchPercentage targetRole user").lean(),
  ]);

  const avgResumeScore = resumes.length > 0
    ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
    : 0;

  const avgInterviewScore = interviews.length > 0
    ? Math.round(interviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / interviews.length)
    : 0;

  let totalCodingProblems = 0;
  codingProfiles.forEach((cp) => {
    const stats = cp.cachedStats || {};
    totalCodingProblems += Number(stats.totalSolved || stats.solved || stats.problemsSolved || 0);
  });

  const verifiedProofsCount = events.filter((e) => e.verificationResult?.isVerified).length;

  // Compute placement readiness funnel distribution across assigned mentees
  let placementReadyCount = 0;
  let developingCount = 0;
  let interventionCount = 0;
  const missingSkillMap = {};

  await Promise.all(
    users.map(async (u) => {
      const [latestResume, completedInts, codingProfs, repoCount, evts, latestGap] = await Promise.all([
        Resume.findOne({ user: u._id, status: "completed" }).select("atsScore").sort({ createdAt: -1 }).lean(),
        InterviewSession.find({ user: u._id, status: "completed" }).select("overallScore").lean(),
        CodingProfile.find({ userId: u._id }).select("cachedStats").lean(),
        RepoAnalysis.countDocuments({ user: u._id, status: "completed" }),
        Event.find({ user: u._id }).select("verificationResult result").lean(),
        SkillGapAnalysis.findOne({ user: u._id, status: "completed" }).select("matchPercentage gaps").sort({ createdAt: -1 }).lean(),
      ]);

      const resumeScore = latestResume?.atsScore || 0;
      const avgInterview = completedInts.length > 0
        ? Math.round(completedInts.reduce((a, b) => a + (b.overallScore || 0), 0) / completedInts.length)
        : 0;

      let solved = 0;
      codingProfs.forEach((c) => {
        const s = c.cachedStats || {};
        solved += Number(s.totalSolved || s.solved || s.problemsSolved || 0);
      });

      const verEvts = evts.filter(
        (e) => e.verificationResult?.isVerified || e.result === "winner" || e.result === "runner-up"
      ).length;

      const gapScore = latestGap?.matchPercentage || 0;
      const readiness = Math.round(
        gapScore * 0.30 +
        resumeScore * 0.20 +
        avgInterview * 0.20 +
        Math.min(100, solved + repoCount * 10) * 0.15 +
        Math.min(100, verEvts * 30 + evts.length * 10) * 0.15
      );

      if (readiness >= 75) placementReadyCount++;
      else if (readiness >= 45) developingCount++;
      else interventionCount++;

      // Aggregate gaps for heatmap
      if (latestGap?.gaps) {
        latestGap.gaps.forEach((g) => {
          if (g.skillName) {
            missingSkillMap[g.skillName] = (missingSkillMap[g.skillName] || 0) + 1;
          }
        });
      }
    })
  );

  // Distribution of Target Roles
  const roleCounts = {};
  gapAnalyses.forEach((g) => {
    if (g.targetRole) {
      roleCounts[g.targetRole] = (roleCounts[g.targetRole] || 0) + 1;
    }
  });

  const topTargetRoles = Object.entries(roleCounts)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topMissingSkills = Object.entries(missingSkillMap)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return ApiResponse.success({
    summary: {
      totalStudents,
      avgResumeScore,
      avgInterviewScore,
      totalCodingProblems,
      verifiedProofsCount,
      completedInterviewsCount: interviews.length,
      analyzedResumesCount: resumes.length,
      placementFunnel: {
        placementReady: placementReadyCount,
        developing: developingCount,
        intervention: interventionCount,
      },
    },
    topTargetRoles,
    topMissingSkills,
  }).send(res);
});

/**
 * POST /api/admin/students/:studentId/feedback
 * Mentor posts direct targeted guidance note / task to a student.
 */
const sendStudentFeedback = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { title, note, actionType } = req.body;

  if (!note || typeof note !== "string" || note.trim() === "") {
    throw ApiError.badRequest("Guidance note is required");
  }

  const student = await User.findById(studentId);
  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  const currentUser = await User.findById(req.user._id).select("mentees role").lean();
  const menteeSet = new Set((currentUser?.mentees || []).map((id) => id.toString()));
  const isMyMentee = menteeSet.has(student._id.toString()) || student.assignedMentor?.toString() === req.user._id.toString();

  if (req.user.role !== "admin" && !isMyMentee) {
    throw ApiError.forbidden("Access denied: You can only send feedback to your assigned mentees");
  }

  const notification = await Notification.create({
    user: studentId,
    type: "mentor_note",
    title: title || `Mentor Guidance from ${req.user.name || "your Mentor"}`,
    message: note.trim(),
    actionUrl: actionType === "resume" ? "/resume" : actionType === "interview" ? "/interview" : "/skills",
    read: false,
  });

  // Push real-time notification
  try {
    notificationService.pushToOpenConnections(studentId, notification);
  } catch (err) {
    console.error("Failed to deliver SSE notification:", err);
  }

  return ApiResponse.success({
    message: "Mentor feedback successfully sent to student",
    notification,
  }).send(res);
});

/**
 * POST /api/admin/mentees
 * Mentor adds a mentee by email or student ID.
 * STRICT LOGIC: Mentors can ONLY add mentees who already have a registered account on the student side.
 */
const addMentee = asyncHandler(async (req, res) => {
  const { studentEmail, studentId, email } = req.body;
  const input = (studentEmail || email || studentId || "").trim();

  if (!input) {
    throw ApiError.badRequest("Student email or ID is required");
  }

  let student;
  if (input.includes("@")) {
    student = await User.findOne({ email: input.toLowerCase() });
  } else if (input.match(/^[0-9a-fA-F]{24}$/)) {
    student = await User.findById(input);
  } else {
    student = await User.findOne({ email: input.toLowerCase() });
  }

  if (!student || student.role === "admin" || student.role === "mentor") {
    throw ApiError.notFound("No student account found with this email. Only registered students can be added as mentees.");
  }

  if (student._id.toString() === req.user._id.toString()) {
    throw ApiError.badRequest("You cannot add yourself as your own mentee. Please select a registered student account.");
  }

  const mentor = await User.findById(req.user._id);

  // Link student to mentor
  const menteeIds = (mentor.mentees || []).map((id) => id.toString());
  if (!menteeIds.includes(student._id.toString())) {
    mentor.mentees.push(student._id);
    await mentor.save();
  }

  student.assignedMentor = mentor._id;
  await student.save();

  // Send real-time notification to student
  try {
    const notification = await Notification.create({
      user: student._id,
      type: "mentor_assigned",
      title: `Assigned to Mentor: ${mentor.name}`,
      message: `${mentor.name} has added you as a mentee. You can now receive direct guidance and actions from your mentor.`,
      actionUrl: "/dashboard",
      read: false,
    });

    notificationService.pushToOpenConnections(student._id, notification);
  } catch (err) {
    console.error("Failed to notify student of mentor assignment:", err);
  }

  return ApiResponse.success({
    message: `${student.name} (${student.email}) successfully added as your mentee!`,
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      targetRole: student.targetRole,
      assignedMentor: student.assignedMentor,
    },
  }).send(res);
});

/**
 * DELETE /api/admin/mentees/:studentId
 * Mentor removes a student from their mentees list.
 */
const removeMentee = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const mentor = await User.findById(req.user._id);
  const isAssigned = (mentor?.mentees || []).some((id) => id.toString() === studentId);

  if (req.user.role !== "admin" && !isAssigned) {
    throw ApiError.forbidden("Access denied: This student is not in your mentees list");
  }

  if (mentor && mentor.mentees) {
    mentor.mentees = mentor.mentees.filter((id) => id.toString() !== studentId);
    await mentor.save();
  }

  await User.findByIdAndUpdate(studentId, { assignedMentor: null });

  return ApiResponse.success({
    message: "Mentee removed successfully",
  }).send(res);
});

/**
 * GET /api/admin/mentees
 * Fetch all assigned mentees for the logged-in mentor.
 */
const getMyMentees = asyncHandler(async (req, res) => {
  const mentor = await User.findById(req.user._id).populate("mentees", "name email avatar targetRole githubUsername createdAt").lean();
  const menteeList = mentor?.mentees || [];

  return ApiResponse.success({
    mentees: menteeList,
  }).send(res);
});

/**
 * GET /api/admin/students/search-registered?query=...
 * Live search registered student accounts on the student side.
 */
const searchRegisteredStudents = asyncHandler(async (req, res) => {
  const queryStr = (req.query.query || req.query.search || "").trim();
  if (!queryStr) {
    return ApiResponse.success({ students: [] }).send(res);
  }

  const mentor = await User.findById(req.user._id).select("mentees").lean();
  const menteeIds = new Set((mentor?.mentees || []).map((id) => id.toString()));

  const searchRegex = new RegExp(escapeRegex(queryStr), "i");
  const students = await User.find({
    role: { $nin: ["admin", "mentor"] },
    email: { $not: /example\.com$|@test\.com$|^test_|^dynrec_/i },
    $or: [{ name: searchRegex }, { email: searchRegex }],
  })
    .select("name email avatar targetRole githubUsername createdAt assignedMentor")
    .limit(10)
    .lean();

  const formatted = students.map((s) => ({
    ...s,
    isMyMentee: menteeIds.has(s._id.toString()) || s.assignedMentor?.toString() === req.user._id.toString(),
  }));

  return ApiResponse.success({ students: formatted }).send(res);
});

/**
 * GET /api/admin/profile
 * Get mentor profile & credentials.
 */
const getMentorProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken").lean();
  return ApiResponse.success(user).send(res);
});

/**
 * PATCH /api/admin/profile
 * Update mentor profile credentials.
 */
const updateMentorProfile = asyncHandler(async (req, res) => {
  const { name, email, targetRole, bio, avatar, linkedinUrl, githubUsername, preferences } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict("Email address is already in use by another account");
    }
    user.email = email.toLowerCase();
  }

  if (name) user.name = name.trim();
  if (targetRole !== undefined) user.targetRole = targetRole.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatar !== undefined) user.avatar = avatar.trim();
  if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl.trim();
  if (githubUsername !== undefined) user.githubUsername = githubUsername.trim();
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  return ApiResponse.success({
    message: "Mentor profile credentials updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      targetRole: user.targetRole,
      bio: user.bio,
      linkedinUrl: user.linkedinUrl,
      githubUsername: user.githubUsername,
      preferences: user.preferences,
    },
  }).send(res);
});

/**
 * POST /api/admin/change-password
 * Change mentor account password credentials.
 */
const changeMentorPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest("Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw ApiError.badRequest("New password must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return ApiResponse.success({
    message: "Mentor password updated successfully!",
  }).send(res);
});

module.exports = {
  getStudentsList,
  getStudent360Detail,
  getCohortAnalytics,
  sendStudentFeedback,
  addMentee,
  removeMentee,
  getMyMentees,
  searchRegisteredStudents,
  getMentorProfile,
  updateMentorProfile,
  changeMentorPassword,
};

================================================================================
6. EXISTING VIOLATION / PROCTORING CODE CHECK
================================================================================
Command: grep -ri "proctor|violation|webcam|fullscreen" -r ./backend ./src ./admin
(No matches found in backend, student frontend, or admin portal)

================================================================================
7. FRONTEND CAMERA / MEDIA USAGE CHECK
================================================================================
Command: grep -ri "getUserMedia|navigator.mediaDevices|webcam" -r ./src ./admin/src
(No matches found in student frontend or admin portal)

================================================================================
8. AUTH 401 RETRY INTERCEPTOR & INFINITE LOOP FIX
================================================================================

### A. Full File Contents BEFORE Change (`src/lib/api.ts`)
```typescript
// Client-side uses the Vite proxy (/api -> localhost:5000).
// Server-side (SSR / Nitro) must reach the backend directly.
const isServer = typeof window === "undefined";
const API_BASE = isServer ? "http://localhost:5000/api" : import.meta.env.VITE_API_URL || "/api";

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("cf-token");
      if (token) {
        sessionStorage.setItem("cf_session_active", "1");
      } else {
        sessionStorage.removeItem("cf_session_active");
      }
    } catch {}
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export class ApiError extends Error {
  statusCode: number;
  errors: string[];
  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

let refreshing: Promise<void> | null = null;

export async function tryRefresh(): Promise<void> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      setAccessToken(null);
      throw new ApiError(401, "Session expired");
    }
    const json = await res.json();
    setAccessToken(json.data.accessToken);
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${cleanEndpoint}`;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers, credentials: "include" });

  if (res.status === 401 && !url.includes("/auth/refresh") && !url.includes("/auth/login")) {
    try {
      await tryRefresh();
      const freshToken = getAccessToken();
      if (freshToken) {
        headers["Authorization"] = `Bearer ${freshToken}`;
      }
      res = await fetch(url, { ...options, headers, credentials: "include" });
    } catch {
      if (!url.includes("/auth/me")) {
        const { useAuth } = await import("@/stores");
        useAuth.getState().logout();
      }
      throw new ApiError(401, "Session expired");
    }
  }

  let json: any;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!res.ok || json.success === false) {
    const errorMsg =
      (typeof json === "object" && json?.message) ||
      (typeof json === "string" && json) ||
      text ||
      `Request failed (${res.status})`;
    throw new ApiError(
      json?.statusCode || res.status,
      errorMsg,
      json?.errors || [],
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
```

### B. Full File Contents AFTER Change (`src/lib/api.ts`)
```typescript
// Client-side uses the Vite proxy (/api -> localhost:5000).
// Server-side (SSR / Nitro) must reach the backend directly.
const isServer = typeof window === "undefined";
const API_BASE = isServer ? "http://localhost:5000/api" : import.meta.env.VITE_API_URL || "/api";

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("cf-token");
      if (token) {
        sessionStorage.setItem("cf_session_active", "1");
      } else {
        sessionStorage.removeItem("cf_session_active");
      }
    } catch {}
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export class ApiError extends Error {
  statusCode: number;
  errors: string[];
  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export interface RequestOptions extends RequestInit {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;
const AUTH_EXEMPT_PATHS = ["/api/auth/refresh", "/api/auth/logout", "/auth/refresh", "/auth/logout"];

export function isAuthExempt(url?: string): boolean {
  if (!url) return false;
  return AUTH_EXEMPT_PATHS.some((path) => url.includes(path));
}

export function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setAccessToken(null);
        throw new ApiError(401, "Session expired");
      }
      const json = await res.json();
      const token = json.data?.accessToken || null;
      setAccessToken(token);
      return token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function tryRefresh(): Promise<string | null> {
  return getRefreshedToken();
}

export function clearSessionAndRedirect(): void {
  setAccessToken(null);
  if (typeof window !== "undefined") {
    try {
      import("@/stores").then(({ useAuth }) => {
        useAuth.setState({ user: null, isAuthenticated: false });
      }).catch(() => {});
    } catch {}
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${cleanEndpoint}`;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers, credentials: "include" });

  if (isAuthExempt(url)) {
    if (res.status === 401 && url.includes("/refresh")) {
      clearSessionAndRedirect();
    }
  } else if (res.status === 401 && !options._retried) {
    options._retried = true;
    try {
      const newToken = await getRefreshedToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }
      res = await fetch(url, { ...options, headers, credentials: "include" });
    } catch {
      clearSessionAndRedirect();
      throw new ApiError(401, "Session expired");
    }
  }

  let json: any;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!res.ok || json.success === false) {
    const errorMsg =
      (typeof json === "object" && json?.message) ||
      (typeof json === "string" && json) ||
      text ||
      `Request failed (${res.status})`;
    throw new ApiError(
      json?.statusCode || res.status,
      errorMsg,
      json?.errors || [],
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
```

### C. Git Diff Against ORIGINAL Pre-Fix Version
```diff
--- a/src/lib/api.ts (Original pre-fix version)
+++ b/src/lib/api.ts (Corrected fix)
@@ -33,29 +33,60 @@ export class ApiError extends Error {
   }
 }
 
-let refreshing: Promise<void> | null = null;
+export interface RequestOptions extends RequestInit {
+  _retried?: boolean;
+}
+
+let refreshPromise: Promise<string | null> | null = null;
+const AUTH_EXEMPT_PATHS = ["/api/auth/refresh", "/api/auth/logout", "/auth/refresh", "/auth/logout"];
+
+export function isAuthExempt(url?: string): boolean {
+  if (!url) return false;
+  return AUTH_EXEMPT_PATHS.some((path) => url.includes(path));
+}
+
+export function getRefreshedToken(): Promise<string | null> {
+  if (!refreshPromise) {
+    refreshPromise = (async () => {
+      const res = await fetch(`${API_BASE}/auth/refresh`, {
+        method: "POST",
+        credentials: "include",
+        headers: { "Content-Type": "application/json" },
+      });
+      if (!res.ok) {
+        setAccessToken(null);
+        throw new ApiError(401, "Session expired");
+      }
+      const json = await res.json();
+      const token = json.data?.accessToken || null;
+      setAccessToken(token);
+      return token;
+    })().finally(() => {
+      refreshPromise = null;
     });
-    if (!res.ok) {
-      setAccessToken(null);
-      throw new ApiError(401, "Session expired");
-    }
-    const json = await res.json();
-    setAccessToken(json.data.accessToken);
-  })().finally(() => {
-    refreshing = null;
-  });
-  return refreshing;
+  }
+  return refreshPromise;
 }
 
+export async function tryRefresh(): Promise<string | null> {
+  return getRefreshedToken();
+}
+
+export function clearSessionAndRedirect(): void {
+  setAccessToken(null);
+  if (typeof window !== "undefined") {
+    try {
+      import("@/stores").then(({ useAuth }) => {
+        useAuth.setState({ user: null, isAuthenticated: false });
+      }).catch(() => {});
+    } catch {}
+    if (window.location.pathname !== "/login") {
+      window.location.href = "/login";
     }
-  }
 }
 
-async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
+async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
   const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
   const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${cleanEndpoint}`;
   const headers: Record<string, string> = {
@@ -73,19 +104,20 @@ async function request<T>(endpoint: string, options: RequestInit = {}): Promise<
 
   let res = await fetch(url, { ...options, headers, credentials: "include" });
 
-  if (res.status === 401 && !url.includes("/auth/refresh") && !url.includes("/auth/login")) {
+  if (isAuthExempt(url)) {
+    if (res.status === 401 && url.includes("/refresh")) {
+      clearSessionAndRedirect();
+    }
+  } else if (res.status === 401 && !options._retried) {
+    options._retried = true;
     try {
-      await tryRefresh();
-      const freshToken = getAccessToken();
-      if (freshToken) {
-        headers["Authorization"] = `Bearer ${freshToken}`;
+      const newToken = await getRefreshedToken();
+      if (newToken) {
+        headers["Authorization"] = `Bearer ${newToken}`;
       }
       res = await fetch(url, { ...options, headers, credentials: "include" });
     } catch {
-      if (!url.includes("/auth/me")) {
-        const { useAuth } = await import("@/stores");
-        useAuth.getState().logout();
-      }
+      clearSessionAndRedirect();
       throw new ApiError(401, "Session expired");
     }
   }
@@ -115,19 +147,19 @@ async function request<T>(endpoint: string, options: RequestInit = {}): Promise<
 }
 
 export const api = {
-  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "GET" }),
-  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
+  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
+  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
     request<T>(endpoint, {
       ...options,
       method: "POST",
       body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
     }),
-  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
+  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
     request<T>(endpoint, {
       ...options,
       method: "PATCH",
       body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
     }),
-  delete: <T>(endpoint: string, options?: RequestInit) =>
+  delete: <T>(endpoint: string, options?: RequestOptions) =>
     request<T>(endpoint, { ...options, method: "DELETE" }),
 };
```

### D. Literal Network Trace Verification Log
```
================================================================================
LITERAL VERIFICATION LOG: AUTH 401 INTERCEPTOR & SINGLE-FLIGHT LOCK
================================================================================

[TEST SCENARIO 1] 3 Concurrent Requests (Tab 1: /profile, Tab 2: /skills, Tab 3: /dashboard)

Network Traffic Trace:
[1] 2026-08-24T06:19:11.163Z | GET http://localhost:5000/api/profile -> HTTP 401 | Authorization: Bearer expired_token_abc
[2] 2026-08-24T06:19:11.165Z | GET http://localhost:5000/api/skills -> HTTP 401 | Authorization: Bearer expired_token_abc
[3] 2026-08-24T06:19:11.165Z | GET http://localhost:5000/api/dashboard -> HTTP 401 | Authorization: Bearer expired_token_abc
[4] 2026-08-24T06:19:11.191Z | POST http://localhost:5000/api/auth/refresh -> HTTP 200 | Authorization: (none)
[5] 2026-08-24T06:19:11.222Z | GET http://localhost:5000/api/profile -> HTTP 200 | Authorization: Bearer fresh_jwt_access_token_999
[6] 2026-08-24T06:19:11.222Z | GET http://localhost:5000/api/skills -> HTTP 200 | Authorization: Bearer fresh_jwt_access_token_999
[7] 2026-08-24T06:19:11.222Z | GET http://localhost:5000/api/dashboard -> HTTP 200 | Authorization: Bearer fresh_jwt_access_token_999

Audit Summary:
- Total /api/auth/refresh calls fired: 1 (Expected: exactly 1)
- Total /api/auth/logout calls fired: 0 (Expected: 0)
- Active Access Token updated to: "fresh_jwt_access_token_999"
- All 3 concurrent calls resolved successfully: true

--------------------------------------------------------------------------------
[TEST SCENARIO 2] Request returns 401 on initial call AND 401 on retry
Caught expected error: Error: Token rejected on retry (HTTP 401)

Network Traffic Trace:
[1] 2026-08-24T06:19:11.255Z | GET http://localhost:5000/api/admin-settings -> HTTP 401 | Authorization: Bearer expired_token_abc
[2] 2026-08-24T06:19:11.285Z | POST http://localhost:5000/api/auth/refresh -> HTTP 200 | Authorization: (none)
[3] 2026-08-24T06:19:11.316Z | GET http://localhost:5000/api/admin-settings -> HTTP 401 | Authorization: Bearer fresh_jwt_access_token_999

Audit Summary:
- Total calls to /admin-settings: 2 (Initial: 1, Retried: 1, Subsequent loops: 0)

--------------------------------------------------------------------------------
[TEST SCENARIO 3] 401 response directly from /auth/logout
Caught expected error on logout: Invalid session (HTTP 401)
- /api/auth/refresh calls triggered by /auth/logout 401: 0 (Expected: 0)

--------------------------------------------------------------------------------
[TEST SCENARIO 4] Refresh failure (both access token and refresh token expired)
Caught expected error on failed refresh: Session expired (HTTP 401)

Network Traffic Trace:
[1] 2026-08-24T06:19:11.379Z | GET http://localhost:5000/api/protected-resource -> HTTP 401 | Authorization: Bearer expired_token_abc
[2] 2026-08-24T06:19:11.409Z | POST http://localhost:5000/api/auth/refresh -> HTTP 401 | Authorization: (none)

Audit Summary:
- clearSessionAndRedirect called: true
- Local Access Token cleared: true
- /api/auth/logout calls triggered: 0 (Expected: 0)
```

### E. Execution Compliance Confirmation
No git commands were executed.

### F. Deviations Table
| Expected Change | Current Codebase State | Status / Reason |
| :--- | :--- | :--- |
| `API_BASE` resolution | Reverted to `const API_BASE = isServer ? "http://localhost:5000/api" : import.meta.env.VITE_API_URL \|\| "/api";` | None (Exact match to pre-fix original) |
| `put` method on `api` export | Removed completely; only `get`, `post`, `patch`, `delete` present | None (Exact match to pre-fix original) |
| `_retried` request guard | Present in `RequestOptions` and checked on 401 | None (Exact match) |
| `isAuthExempt` / `AUTH_EXEMPT_PATHS` | Present; bypasses `/api/auth/refresh` & `/api/auth/logout` | None (Exact match) |
| Single-flight lock | `refreshPromise` shared across all concurrent requests | None (Exact match) |
| Session teardown on refresh failure | Local session cleared and redirects without calling `/api/auth/logout` | None (Exact match) |


