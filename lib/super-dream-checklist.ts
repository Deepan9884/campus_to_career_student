export interface StudentProfile {
  id: string;
  name: string;
  registerNumber: string;
  department: string;
  batch: string;
  facultyMentor: string;
  currentSemester: string;
  avatar?: string;
  targetRole?: string;
  targetCompanyTier?: string;
}

export type SkillMasteryLevel = "Mastered" | "In Progress" | "Not Started";

export interface ProgrammingSkillItem {
  id: string;
  skill: string;
  target: string;
  status: SkillMasteryLevel;
  facultyRemarks: string;
  practiceNotes?: string;
  problemsSolved?: number;
  hoursSpent?: number;
  subtopicsMastered?: string[];
  visitedLinks?: string[];
  bestQuizScore?: number;
  quizPassed?: boolean;
  lastQuizDate?: string;
  quizIntegrityScore?: number;
}

export interface CsFundamentalItem {
  id: string;
  subject: string;
  rating: number; // 1 to 5
  completed: boolean;
  remarks: string;
}

export interface MetricItem {
  id: string;
  activity: string;
  target: number;
  current: number;
  unit?: string;
}

export interface DevDeliverableItem {
  id: string;
  projectNumber: number;
  activity: string;
  category?: string;
  description?: string;
  techStack?: string[];
  target: number;
  current: number;
  githubUrl?: string;
  repoUrl?: string; // alias for backwards compatibility
  screenshotUrl?: string;
  liveUrl?: string; // working link (optional)
  demoVideoUrl?: string; // video demo link (optional)
  verified: boolean;
}

export interface AiDeliverableItem {
  id: string;
  activity: string;
  target: number;
  current: number;
  modelType?: string;
  framework?: string;
  verified: boolean;
}

export interface CloudDeliverableItem {
  id: string;
  activity: string;
  target: number;
  current: number;
  cloudProvider?: "AWS" | "Azure" | "GCP" | "Multi-Cloud";
  verified: boolean;
}

export interface GithubPortfolioMetricItem {
  id: string;
  activity: string;
  target: number | string;
  targetDisplay?: string;
  targetValue?: number;
  current: number;
  currentDisplay?: string;
  isCompleted?: boolean;
  unit?: string;
  details?: string;
  category?: string;
  liveUrl?: string;
  verified?: boolean;
  breakdown?: { name: string; count: number; note?: string }[];
}

export interface IndustryCertItem {
  id: string;
  certification: string;
  issuer?: string;
  status: "Completed" | "In Progress" | "Not Started";
  credentialId?: string;
  credentialUrl?: string;
  certificatePdfName?: string;
  certificatePdfUrl?: string;
  issueDate?: string;
  verified: boolean;
}

export interface InterviewPrepItem {
  id: string;
  activity: string;
  target: number;
  current: number;
}

export interface CategoryScoreItem {
  key: string;
  category: string;
  categoryName?: string;
  maxMarks: number;
  obtained: number;
  obtainedMarks?: number;
}

export interface MentorEvaluation {
  strengths: string;
  areasForImprovement: string;
  actionPlanNextSemester: string;
  recommendedLearningPaths: string[];
  studentSignature: string;
  studentSignedDate: string;
  facultyMentorSignature: string;
  facultyMentorSignedDate: string;
  hodSignature: string;
  hodSignedDate: string;
  reviewDate: string;
}

export interface StudentChecklistData {
  profile: StudentProfile;
  section1Programming: ProgrammingSkillItem[];
  section2CsFundamentals: CsFundamentalItem[];
  section3CodingDsa: MetricItem[];
  section4SoftwareDev: DevDeliverableItem[];
  section5AiDataScience: AiDeliverableItem[];
  section6CloudDevOps: CloudDeliverableItem[];
  section7GithubPortfolio: GithubPortfolioMetricItem[];
  section8Certifications: IndustryCertItem[];
  section9InterviewPrep: InterviewPrepItem[];
  section10Evaluation: MentorEvaluation;
  overrideScores?: Partial<Record<string, number>>;
}

export interface SectionSummary {
  sectionId: number;
  title: string;
  subtitle: string;
  iconName: string;
  readinessScore: number;
  completedTasks: number;
  totalTasks: number;
  completionPercent: number;
  recommendedStatLabel: string;
  recommendedStatValue: string | number;
  recommendedStatSub: string;
  statusColor: string;
}

export const RECOMMENDED_LEARNING_PATHS_OPTIONS = [
  "DSA Intensive",
  "Full Stack Development",
  "AI & Generative AI",
  "Cloud & DevOps",
  "Cyber Security",
  "Data Engineering",
  "Mobile Development",
  "Competitive Programming",
];

export function getReadinessTier(score: number): {
  tierName: string;
  packageRange: string;
  badgeColor: string;
  starRating: number;
  recommendation: string;
} {
  if (score >= 95) {
    return {
      tierName: "Elite Product Company Ready",
      packageRange: "₹40–60+ LPA",
      badgeColor: "text-amber-300 bg-amber-500/15 border-amber-500/30",
      starRating: 5,
      recommendation: "Direct FAANG & Global Product Fast-Track Placement Recommended",
    };
  }
  if (score >= 90) {
    return {
      tierName: "Premium Product Company Ready",
      packageRange: "₹25–40 LPA",
      badgeColor: "text-indigo-300 bg-indigo-500/15 border-indigo-500/30",
      starRating: 4,
      recommendation: "Tier-1 Product & High-Scale Systems Drives Recommended",
    };
  }
  if (score >= 80) {
    return {
      tierName: "Strong Product/MNC Ready",
      packageRange: "₹15–25 LPA",
      badgeColor: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
      starRating: 3,
      recommendation: "High-Growth MNC & Fintech Engineering Placement",
    };
  }
  if (score >= 70) {
    return {
      tierName: "Good IT/Product Company Ready",
      packageRange: "₹8–15 LPA",
      badgeColor: "text-sky-300 bg-sky-500/15 border-sky-500/30",
      starRating: 2,
      recommendation: "Target Core IT & Growth Stage Startups",
    };
  }
  return {
    tierName: "Structured Improvement Plan Required",
    packageRange: "Foundational Tier (< ₹8 LPA)",
    badgeColor: "text-rose-300 bg-rose-500/15 border-rose-500/30",
    starRating: 1,
    recommendation: "Mandatory Mentor Remedial Plan in DSA & Fundamentals",
  };
}

export function calculateStudentChecklistScores(data: StudentChecklistData) {
  // 1. Programming Skills (15 max)
  const pSkills = data.section1Programming;
  const pMastered = pSkills.filter((s) => s.status === "Mastered").length;
  const pInProgress = pSkills.filter((s) => s.status === "In Progress").length;
  const pScoreCalculated = Math.min(15, Math.round(((pMastered * 1 + pInProgress * 0.5) / pSkills.length) * 15 * 10) / 10);
  const pScore = data.overrideScores?.["Programming Skills"] ?? pScoreCalculated;

  // 2. Core CS Subjects (15 max)
  const csSubjects = data.section2CsFundamentals;
  const totalRating = csSubjects.reduce((acc, curr) => acc + (curr.rating || 0), 0);
  const maxPossibleRating = csSubjects.length * 5;
  const csScoreCalculated = Math.min(15, Math.round((totalRating / maxPossibleRating) * 15 * 10) / 10);
  const csScore = data.overrideScores?.["Core CS Subjects"] ?? csScoreCalculated;

  // 3. Coding & DSA (10 max)
  const dsa = data.section3CodingDsa;
  const dsaRatios = dsa.map((item) => Math.min(1.2, item.current / (item.target || 1)));
  const avgDsaRatio = dsaRatios.reduce((a, b) => a + b, 0) / dsa.length;
  const dsaScoreCalculated = Math.min(10, Math.round(Math.min(1, avgDsaRatio) * 10 * 10) / 10);
  const dsaScore = data.overrideScores?.["Coding & DSA"] ?? dsaScoreCalculated;

  // 4. Software Development (10 max)
  const dev = data.section4SoftwareDev;
  const devRatios = dev.map((item) => Math.min(1.2, item.current / (item.target || 1)));
  const avgDevRatio = devRatios.reduce((a, b) => a + b, 0) / dev.length;
  const devScoreCalculated = Math.min(10, Math.round(Math.min(1, avgDevRatio) * 10 * 10) / 10);
  const devScore = data.overrideScores?.["Software Development"] ?? devScoreCalculated;

  // 5. AI & Data Science (10 max)
  const ai = data.section5AiDataScience;
  const aiRatios = ai.map((item) => Math.min(1.2, item.current / (item.target || 1)));
  const avgAiRatio = aiRatios.reduce((a, b) => a + b, 0) / ai.length;
  const aiScoreCalculated = Math.min(10, Math.round(Math.min(1, avgAiRatio) * 10 * 10) / 10);
  const aiScore = data.overrideScores?.["AI & Data Science"] ?? aiScoreCalculated;

  // 6. Cloud & DevOps (10 max)
  const cloud = data.section6CloudDevOps;
  const cloudRatios = cloud.map((item) => Math.min(1.2, item.current / (item.target || 1)));
  const avgCloudRatio = cloudRatios.reduce((a, b) => a + b, 0) / cloud.length;
  const cloudScoreCalculated = Math.min(10, Math.round(Math.min(1, avgCloudRatio) * 10 * 10) / 10);
  const cloudScore = data.overrideScores?.["Cloud & DevOps"] ?? cloudScoreCalculated;

  // 7. Projects & GitHub (10 max)
  const gh = data.section7GithubPortfolio;
  const ghRatios = gh.map((item) => {
    if (item.id === "gh-7" || item.activity === "Portfolio Website" || item.target === "Completed") {
      return item.isCompleted || item.current >= 1 ? 1 : 0;
    }
    const targetVal = typeof item.target === "number" ? item.target : (item.targetValue || 1);
    return Math.min(1.2, item.current / (targetVal || 1));
  });
  const avgGhRatio = ghRatios.reduce((a, b) => a + b, 0) / (gh.length || 1);
  const ghScoreCalculated = Math.min(10, Math.round(Math.min(1, avgGhRatio) * 10 * 10) / 10);
  const ghScore = data.overrideScores?.["Projects & GitHub"] ?? ghScoreCalculated;

  // 8. Industry Certifications
  const certs = data.section8Certifications;
  const certsCompleted = certs.filter((c) => c.status === "Completed").length;

  // 9. Communication & Leadership (10 max)
  const commCalculated = Math.min(10, Math.round((Math.min(1, (certsCompleted + pMastered) / 16) * 10) * 10) / 10);
  const commScore = data.overrideScores?.["Communication & Leadership"] ?? commCalculated;

  // 10. Interview Readiness (10 max)
  const iv = data.section9InterviewPrep;
  const ivRatios = iv.map((item) => Math.min(1.2, item.current / (item.target || 1)));
  const avgIvRatio = ivRatios.reduce((a, b) => a + b, 0) / iv.length;
  const ivScoreCalculated = Math.min(10, Math.round(Math.min(1, avgIvRatio) * 10 * 10) / 10);
  const ivScore = data.overrideScores?.["Interview Readiness"] ?? ivScoreCalculated;

  const categoryScores: CategoryScoreItem[] = [
    { key: "Programming Skills", category: "Programming Skills", categoryName: "Programming Skills", maxMarks: 15, obtained: pScore, obtainedMarks: pScore },
    { key: "Core CS Subjects", category: "Core CS Subjects", categoryName: "Core CS Subjects", maxMarks: 15, obtained: csScore, obtainedMarks: csScore },
    { key: "Coding & DSA", category: "Coding & DSA", categoryName: "Coding & DSA", maxMarks: 10, obtained: dsaScore, obtainedMarks: dsaScore },
    { key: "Software Development", category: "Software Development", categoryName: "Software Development", maxMarks: 10, obtained: devScore, obtainedMarks: devScore },
    { key: "AI & Data Science", category: "AI & Data Science", categoryName: "AI & Data Science", maxMarks: 10, obtained: aiScore, obtainedMarks: aiScore },
    { key: "Cloud & DevOps", category: "Cloud & DevOps", categoryName: "Cloud & DevOps", maxMarks: 10, obtained: cloudScore, obtainedMarks: cloudScore },
    { key: "Projects & GitHub", category: "Projects & GitHub", categoryName: "Projects & GitHub", maxMarks: 10, obtained: ghScore, obtainedMarks: ghScore },
    { key: "Communication & Leadership", category: "Communication & Leadership", categoryName: "Communication & Leadership", maxMarks: 10, obtained: commScore, obtainedMarks: commScore },
    { key: "Interview Readiness", category: "Interview Readiness", categoryName: "Interview Readiness", maxMarks: 10, obtained: ivScore, obtainedMarks: ivScore },
  ];

  const totalObtained = Math.min(100, Math.round(categoryScores.reduce((sum, item) => sum + item.obtained, 0)));
  const tier = getReadinessTier(totalObtained);

  // Calculate summaries for all 10 sections
  const summaries: SectionSummary[] = [
    {
      sectionId: 1,
      title: "1. Programming Languages",
      subtitle: "C, C++, Python, Java, JS, Go/Rust, SQL, OOP, Design Patterns",
      iconName: "Code",
      readinessScore: Math.round((pScore / 15) * 100),
      completedTasks: pMastered,
      totalTasks: pSkills.length,
      completionPercent: Math.round((pMastered / pSkills.length) * 100),
      recommendedStatLabel: "Target Level Match",
      recommendedStatValue: `${Math.round(((pMastered + pInProgress * 0.5) / pSkills.length) * 100)}%`,
      recommendedStatSub: "Advanced Mastery Ratio",
      statusColor: "#6366F1",
    },
    {
      sectionId: 2,
      title: "2. Computer Science Fundamentals",
      subtitle: "DS, Algorithms, OS, Networks, DBMS, Compilers, Distributed Systems",
      iconName: "Cpu",
      readinessScore: Math.round((csScore / 15) * 100),
      completedTasks: csSubjects.filter((s) => s.completed).length,
      totalTasks: csSubjects.length,
      completionPercent: Math.round((csSubjects.filter((s) => s.completed).length / csSubjects.length) * 100),
      recommendedStatLabel: "Average Rating",
      recommendedStatValue: (totalRating / csSubjects.length).toFixed(1),
      recommendedStatSub: "Out of 5.0 Star Scale",
      statusColor: "#3B82F6",
    },
    {
      sectionId: 3,
      title: "3. Coding & Problem Solving",
      subtitle: "LeetCode 900, HackerRank 450, Contests, DP, Trees, Graphs, Hard 110",
      iconName: "Binary",
      readinessScore: Math.round((dsaScore / 10) * 100),
      completedTasks: dsa.filter((d) => d.current >= d.target).length,
      totalTasks: dsa.length,
      completionPercent: Math.round(Math.min(100, avgDsaRatio * 100)),
      recommendedStatLabel: "LeetCode Contest Rating",
      recommendedStatValue: dsa.find((d) => d.id === "dsa-10")?.current || 1845,
      recommendedStatSub: "Target: 1800+ (Knight/Guardian)",
      statusColor: "#10B981",
    },
    {
      sectionId: 4,
      title: "4. Software Development",
      subtitle: "Full Stack, Backend, Cloud, Team Projects, 50 REST APIs, Docker, K8s",
      iconName: "Layers",
      readinessScore: Math.round((devScore / 10) * 100),
      completedTasks: dev.filter((d) => d.current >= d.target).length,
      totalTasks: dev.length,
      completionPercent: Math.round(Math.min(100, avgDevRatio * 100)),
      recommendedStatLabel: "REST APIs & Microservices",
      recommendedStatValue: `${(dev.find((d) => d.id === "dev-8")?.current || 0) + (dev.find((d) => d.id === "dev-9")?.current || 0)}`,
      recommendedStatSub: "Shipped in Production",
      statusColor: "#06B6D4",
    },
    {
      sectionId: 5,
      title: "5. Artificial Intelligence & Data Science",
      subtitle: "ML, Deep Learning, CV, NLP, GenAI, AI Agents, RAG, Kaggle 20",
      iconName: "BrainCircuit",
      readinessScore: Math.round((aiScore / 10) * 100),
      completedTasks: ai.filter((a) => a.current >= a.target).length,
      totalTasks: ai.length,
      completionPercent: Math.round(Math.min(100, avgAiRatio * 100)),
      recommendedStatLabel: "GenAI & Agent Apps",
      recommendedStatValue: `${(ai.find((a) => a.id === "ai-5")?.current || 0) + (ai.find((a) => a.id === "ai-6")?.current || 0)}`,
      recommendedStatSub: "Deployed LLM Pipelines",
      statusColor: "#8B5CF6",
    },
    {
      sectionId: 6,
      title: "6. Cloud & DevOps",
      subtitle: "AWS 25, Azure 20, GCP 15, Terraform 15, Monitoring 10, IaC 10",
      iconName: "Cloud",
      readinessScore: Math.round((cloudScore / 10) * 100),
      completedTasks: cloud.filter((c) => c.current >= c.target).length,
      totalTasks: cloud.length,
      completionPercent: Math.round(Math.min(100, avgCloudRatio * 100)),
      recommendedStatLabel: "Cloud Coverage",
      recommendedStatValue: `${(cloud.find((c) => c.id === "c-1")?.current || 0) + (cloud.find((c) => c.id === "c-2")?.current || 0) + (cloud.find((c) => c.id === "c-3")?.current || 0)} Services`,
      recommendedStatSub: "AWS / Azure / GCP",
      statusColor: "#EC4899",
    },
    {
      sectionId: 7,
      title: "7. GitHub Portfolio",
      subtitle: "30 Repos, 3000+ Commits, 30 PRs, Open Source 15, 75 Stars, 60 Docs, Portfolio Completed",
      iconName: "Github",
      readinessScore: Math.round((ghScore / 10) * 100),
      completedTasks: gh.filter((g) => {
        if (g.id === "gh-7" || g.activity === "Portfolio Website" || g.target === "Completed") {
          return g.isCompleted || g.current >= 1;
        }
        const targetVal = typeof g.target === "number" ? g.target : (g.targetValue || 1);
        return g.current >= targetVal;
      }).length,
      totalTasks: gh.length,
      completionPercent: Math.round(Math.min(100, avgGhRatio * 100)),
      recommendedStatLabel: "Total GitHub Commits",
      recommendedStatValue: `${gh.find((g) => g.id === "gh-2")?.current || 0}+`,
      recommendedStatSub: "Target: 3000+ Commits",
      statusColor: "#F59E0B",
    },
    {
      sectionId: 8,
      title: "8. Industry Certifications",
      subtitle: "Python, Java, AWS, Azure, Docker, K8s, TensorFlow, Oracle, Linux, SQL",
      iconName: "Award",
      readinessScore: Math.round((certsCompleted / certs.length) * 100),
      completedTasks: certsCompleted,
      totalTasks: certs.length,
      completionPercent: Math.round((certsCompleted / certs.length) * 100),
      recommendedStatLabel: "Verified Badges",
      recommendedStatValue: `${certs.filter((c) => c.verified).length} / ${certs.length}`,
      recommendedStatSub: "Cryptographically Verified",
      statusColor: "#14B8A6",
    },
    {
      sectionId: 9,
      title: "9. Interview Preparation",
      subtitle: "Mock Tech 40, HR 25, Aptitude 45, Resume Reviews 8, System Design 25",
      iconName: "Mic",
      readinessScore: Math.round((ivScore / 10) * 100),
      completedTasks: iv.filter((i) => i.current >= i.target).length,
      totalTasks: iv.length,
      completionPercent: Math.round(Math.min(100, avgIvRatio * 100)),
      recommendedStatLabel: "Mock Technical Rounds",
      recommendedStatValue: `${iv.find((i) => i.id === "iv-1")?.current || 0} / ${iv.find((i) => i.id === "iv-1")?.target || 40}`,
      recommendedStatSub: "FAANG Bar Raiser standard",
      statusColor: "#F43F5E",
    },
    {
      sectionId: 10,
      title: "10. Placement Readiness Score",
      subtitle: "Evaluated 100 Marks, 5 Tier Classification, Mentor Strengths & Plan",
      iconName: "Crown",
      readinessScore: totalObtained,
      completedTasks: categoryScores.filter((c) => c.obtained >= c.maxMarks * 0.8).length,
      totalTasks: categoryScores.length,
      completionPercent: totalObtained,
      recommendedStatLabel: "Placement Target Tier",
      recommendedStatValue: tier.packageRange,
      recommendedStatSub: tier.tierName,
      statusColor: "#F59E0B",
    },
  ];

  return {
    categoryScores,
    totalObtained,
    tier,
    summaries,
  };
}

export function createDefaultChecklist(studentName = "Student", regNo = "", dept = "Computer Science & Engineering"): StudentChecklistData {
  return {
    profile: {
      id: "std-primary",
      name: studentName,
      registerNumber: regNo,
      department: dept,
      batch: "2023 - 2027",
      facultyMentor: "",
      currentSemester: "Semester 6",
      targetRole: "",
      targetCompanyTier: "",
    },
    section1Programming: [
      { id: "p-1", skill: "C Programming", target: "Advanced", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
      { id: "p-2", skill: "C++", target: "Advanced", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
      { id: "p-3", skill: "Python", target: "Advanced", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
      { id: "p-4", skill: "Java", target: "Advanced", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
      { id: "p-5", skill: "JavaScript", target: "Advanced", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
      { id: "p-6", skill: "Go (Golang)", target: "Intermediate to Advanced", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
      { id: "p-7", skill: "SQL", target: "Advanced", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
      { id: "p-8", skill: "Object-Oriented Programming", target: "Excellent", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
      { id: "p-9", skill: "Design Patterns", target: "Working Knowledge", status: "Not Started", facultyRemarks: "", problemsSolved: 0, hoursSpent: 0, subtopicsMastered: [], visitedLinks: [], bestQuizScore: 0, quizPassed: false },
    ],
    section2CsFundamentals: [
      { id: "cs-1", subject: "Data Structures", rating: 0, completed: false, remarks: "" },
      { id: "cs-2", subject: "Algorithms", rating: 0, completed: false, remarks: "" },
      { id: "cs-3", subject: "Operating Systems", rating: 0, completed: false, remarks: "" },
      { id: "cs-4", subject: "Computer Networks", rating: 0, completed: false, remarks: "" },
      { id: "cs-5", subject: "DBMS", rating: 0, completed: false, remarks: "" },
      { id: "cs-6", subject: "Computer Organization", rating: 0, completed: false, remarks: "" },
      { id: "cs-7", subject: "Software Engineering", rating: 0, completed: false, remarks: "" },
      { id: "cs-8", subject: "Compiler Design", rating: 0, completed: false, remarks: "" },
      { id: "cs-9", subject: "Distributed Systems", rating: 0, completed: false, remarks: "" },
      { id: "cs-10", subject: "System Design", rating: 0, completed: false, remarks: "" },
      { id: "cs-11", subject: "Computer Architecture", rating: 0, completed: false, remarks: "" },
      { id: "cs-12", subject: "Object-Oriented Design", rating: 0, completed: false, remarks: "" },
    ],
    section3CodingDsa: [
      { id: "dsa-1", activity: "LeetCode Problems", target: 900, current: 0 },
      { id: "dsa-2", activity: "HackerRank Problems", target: 450, current: 0 },
      { id: "dsa-3", activity: "Codeforces Contests", target: 45, current: 0 },
      { id: "dsa-4", activity: "Coding Contests Participated", target: 75, current: 0 },
      { id: "dsa-5", activity: "Dynamic Programming Problems", target: 150, current: 0 },
      { id: "dsa-6", activity: "Graph Problems", target: 120, current: 0 },
      { id: "dsa-7", activity: "Tree Problems", target: 120, current: 0 },
      { id: "dsa-8", activity: "Hard Problems Solved", target: 110, current: 0 },
      { id: "dsa-9", activity: "Weekly Coding Hours", target: 15, current: 0 },
      { id: "dsa-10", activity: "Maximum LeetCode Contest Rating", target: 1800, current: 0 },
    ],
    section4SoftwareDev: [
      { id: "dev-1", projectNumber: 1, activity: "Full Stack Projects", target: 3, current: 0, verified: false },
      { id: "dev-2", projectNumber: 2, activity: "Backend Projects", target: 5, current: 0, verified: false },
      { id: "dev-3", projectNumber: 3, activity: "Frontend Projects", target: 5, current: 0, verified: false },
      { id: "dev-4", projectNumber: 4, activity: "Mobile Applications", target: 3, current: 0, verified: false },
      { id: "dev-5", projectNumber: 5, activity: "Cloud Deployments", target: 3, current: 0, verified: false },
      { id: "dev-6", projectNumber: 6, activity: "Team Projects", target: 3, current: 0, verified: false },
      { id: "dev-7", projectNumber: 7, activity: "Open Source Projects", target: 3, current: 0, verified: false },
      { id: "dev-8", projectNumber: 8, activity: "REST APIs Developed", target: 50, current: 0, verified: false },
      { id: "dev-9", projectNumber: 9, activity: "Microservices Developed", target: 10, current: 0, verified: false },
      { id: "dev-10", projectNumber: 10, activity: "CI/CD Pipelines", target: 15, current: 0, verified: false },
      { id: "dev-11", projectNumber: 11, activity: "Docker Containers", target: 30, current: 0, verified: false },
      { id: "dev-12", projectNumber: 12, activity: "Kubernetes Deployments", target: 20, current: 0, verified: false },
    ],
    section5AiDataScience: [
      { id: "ai-1", activity: "Machine Learning Models", target: 25, current: 0, modelType: "XGBoost, Random Forest, SVM", verified: false },
      { id: "ai-2", activity: "Deep Learning Models", target: 15, current: 0, framework: "PyTorch & TensorFlow", verified: false },
      { id: "ai-3", activity: "Computer Vision Projects", target: 10, current: 0, framework: "YOLOv8 & OpenCV", verified: false },
      { id: "ai-4", activity: "NLP Projects", target: 10, current: 0, framework: "BERT & RoBERTa", verified: false },
      { id: "ai-5", activity: "Generative AI Applications", target: 15, current: 0, framework: "LangChain & Gemini Pro", verified: false },
      { id: "ai-6", activity: "AI Agent Applications", target: 10, current: 0, framework: "CrewAI & AutoGen", verified: false },
      { id: "ai-7", activity: "RAG Applications", target: 10, current: 0, framework: "Qdrant / Milvus + LlamaIndex", verified: false },
      { id: "ai-8", activity: "Kaggle Competitions", target: 20, current: 0, verified: false },
    ],
    section6CloudDevOps: [
      { id: "c-1", activity: "AWS Services Practiced", target: 25, current: 0, cloudProvider: "AWS", verified: false },
      { id: "c-2", activity: "Azure Services Practiced", target: 20, current: 0, cloudProvider: "Azure", verified: false },
      { id: "c-3", activity: "Google Cloud Services", target: 15, current: 0, cloudProvider: "GCP", verified: false },
      { id: "c-4", activity: "Terraform Projects", target: 15, current: 0, verified: false },
      { id: "c-5", activity: "Monitoring Dashboards", target: 10, current: 0, verified: false },
      { id: "c-6", activity: "Infrastructure-as-Code Projects", target: 10, current: 0, verified: false },
    ],
    section7GithubPortfolio: [
      {
        id: "gh-1",
        activity: "GitHub Repositories",
        target: 30,
        targetDisplay: "30",
        targetValue: 30,
        current: 0,
        unit: "Repositories",
        details: "Clean repository structures, modular architecture, unit tests, and production READMEs.",
        verified: false,
        breakdown: [],
      },
      {
        id: "gh-2",
        activity: "Total Commits",
        target: "3000+",
        targetDisplay: "3000+",
        targetValue: 3000,
        current: 0,
        unit: "Commits",
        details: "Consistent daily coding rhythm with conventional git commits.",
        verified: false,
        breakdown: [],
      },
      {
        id: "gh-3",
        activity: "Pull Requests",
        target: 30,
        targetDisplay: "30",
        targetValue: 30,
        current: 0,
        unit: "Pull Requests",
        details: "Feature branches, code reviews, automated CI checks, and clean merge histories.",
        verified: false,
        breakdown: [],
      },
      {
        id: "gh-4",
        activity: "Open Source Contributions",
        target: 15,
        targetDisplay: "15",
        targetValue: 15,
        current: 0,
        unit: "Contributions",
        details: "Merged upstream contributions to recognized public repositories and bug fixes.",
        verified: false,
        breakdown: [],
      },
      {
        id: "gh-5",
        activity: "GitHub Stars",
        target: 75,
        targetDisplay: "75",
        targetValue: 75,
        current: 0,
        unit: "Stars",
        details: "Developer engagement and stars accumulated across public repositories.",
        verified: false,
        breakdown: [],
      },
      {
        id: "gh-6",
        activity: "Technical Documentation",
        target: 60,
        targetDisplay: "60",
        targetValue: 60,
        current: 0,
        unit: "Articles / Specs",
        details: "README files, architecture flows, OpenAPI Swagger docs, and engineering blog posts.",
        verified: false,
        breakdown: [],
      },
      {
        id: "gh-7",
        activity: "Portfolio Website",
        target: "Completed",
        targetDisplay: "Completed",
        targetValue: 1,
        current: 0,
        isCompleted: false,
        unit: "Live Web App",
        liveUrl: "",
        details: "Personal portfolio showcasing projects, live demos, resume, and tech stack.",
        verified: false,
        breakdown: [],
      },
    ],
    section8Certifications: [
      { id: "cert-1", certification: "Python", issuer: "Python Institute (PCAP)", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-2", certification: "Java", issuer: "Oracle University", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-3", certification: "AWS Cloud Practitioner", issuer: "Amazon Web Services", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-4", certification: "Azure Fundamentals", issuer: "Microsoft Azure (AZ-900)", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-5", certification: "Docker", issuer: "Docker Certified Associate", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-6", certification: "Kubernetes", issuer: "Linux Foundation (CKA)", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-7", certification: "TensorFlow", issuer: "Google TensorFlow Developer", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-8", certification: "Oracle Java", issuer: "Oracle Certified Professional", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-9", certification: "Linux", issuer: "Linux Foundation (LFCS)", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-10", certification: "Git/GitHub", issuer: "GitHub Official Certifications", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-11", certification: "SQL", issuer: "PostgreSQL Professional Assoc.", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
      { id: "cert-12", certification: "DevOps", issuer: "DevOps Institute", status: "Not Started", credentialId: "", certificatePdfName: "", verified: false },
    ],
    section9InterviewPrep: [
      { id: "iv-1", activity: "Mock Technical Interviews", target: 40, current: 0 },
      { id: "iv-2", activity: "Technical Interview Practice", target: 30, current: 0 },
      { id: "iv-3", activity: "HR Interview Practice", target: 25, current: 0 },
      { id: "iv-4", activity: "Aptitude Tests", target: 45, current: 0 },
      { id: "iv-5", activity: "Resume Reviews", target: 8, current: 0 },
      { id: "iv-6", activity: "System Design Interviews", target: 25, current: 0 },
      { id: "iv-7", activity: "Behavioral Interviews", target: 20, current: 0 },
    ],
    section10Evaluation: {
      strengths: "",
      areasForImprovement: "",
      actionPlanNextSemester: "",
      recommendedLearningPaths: [],
      studentSignature: "",
      studentSignedDate: "",
      facultyMentorSignature: "",
      facultyMentorSignedDate: "",
      hodSignature: "",
      hodSignedDate: "",
      reviewDate: "",
    },
  };
}

export interface CompanyReadinessProfile {
  id: string;
  name: string;
  role: string;
  packageLPA: string;
  tier: "Super Dream" | "Dream" | "Core Product";
  minOverallScore: number;
  minCategoryScores: {
    programming: number; // /15
    csFundamentals: number; // /15
    codingDsa: number; // /10
    softwareDev: number; // /10
    cloudDevOps?: number; // /10
    interviewPrep: number; // /10
  };
  domainTags: string[];
  logoBg: string;
  hiringFocus: string;
  rounds: string[];
}

export const SUPER_DREAM_COMPANIES: CompanyReadinessProfile[] = [
  {
    id: "comp-google",
    name: "Google",
    role: "Software Engineer (L3 / Early Career)",
    packageLPA: "₹45–58 LPA",
    tier: "Super Dream",
    minOverallScore: 92,
    minCategoryScores: {
      programming: 14,
      csFundamentals: 13.5,
      codingDsa: 9.2,
      softwareDev: 8.5,
      interviewPrep: 8.5,
    },
    domainTags: ["Hard Algorithms", "Distributed Systems", "Concurrency"],
    logoBg: "bg-red-500/10 text-red-400 border-red-500/30",
    hiringFocus: "Deep algorithmic mastery in Graph/Tree DP, low-latency concurrent systems, Googliness & scale.",
    rounds: ["Online Assessment (2 Hard DSA)", "Phone Screen (DSA)", "3x Onsite Technical (DSA + LLD)", "Googliness & Leadership"],
  },
  {
    id: "comp-de-shaw",
    name: "D. E. Shaw & Co",
    role: "Member Technical (Software Development)",
    packageLPA: "₹55–75 LPA",
    tier: "Super Dream",
    minOverallScore: 95,
    minCategoryScores: {
      programming: 14.5,
      csFundamentals: 14,
      codingDsa: 9.5,
      softwareDev: 8.5,
      interviewPrep: 9.0,
    },
    domainTags: ["Low-Latency C++", "OS Internals", "Advanced DP"],
    logoBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    hiringFocus: "High quantitative precision, kernel-level OS concepts, custom memory allocators, fast DP solutions.",
    rounds: ["Quant & Coding Screen", "2x Core DSA & Math", "Systems & OS Deep Dive", "Director Cultural Fit"],
  },
  {
    id: "comp-atlassian",
    name: "Atlassian",
    role: "Associate Software Engineer",
    packageLPA: "₹52–68 LPA",
    tier: "Super Dream",
    minOverallScore: 93,
    minCategoryScores: {
      programming: 14,
      csFundamentals: 13.5,
      codingDsa: 9.0,
      softwareDev: 9.0,
      interviewPrep: 8.5,
    },
    domainTags: ["Full Stack", "Distributed Systems", "Clean Craft"],
    logoBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    hiringFocus: "End-to-end full-stack craft, modular React/Node microservices, clean GitHub portfolio, values alignment.",
    rounds: ["HackerRank Coding OA", "Data Structures & Problem Solving", "System Architecture & APIs", "Values & Behavioral Loop"],
  },
  {
    id: "comp-microsoft",
    name: "Microsoft",
    role: "Software Engineer (SDE-1)",
    packageLPA: "₹42–50 LPA",
    tier: "Super Dream",
    minOverallScore: 90,
    minCategoryScores: {
      programming: 13.5,
      csFundamentals: 13,
      codingDsa: 8.8,
      softwareDev: 8.5,
      interviewPrep: 8.0,
    },
    domainTags: ["Data Structures", "OOP Design Patterns", "Azure / Cloud"],
    logoBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    hiringFocus: "Clean modular OOP, memory layout understanding, robust exception handling, multi-threading.",
    rounds: ["Online Assessment (3 Codility Tasks)", "2x Technical DS & Algorithms", "Low-Level Design & System Design", "As-Appropriate (AA) Bar Raiser"],
  },
  {
    id: "comp-uber",
    name: "Uber",
    role: "Software Engineer-1",
    packageLPA: "₹48–62 LPA",
    tier: "Super Dream",
    minOverallScore: 92,
    minCategoryScores: {
      programming: 14,
      csFundamentals: 13,
      codingDsa: 9.0,
      softwareDev: 8.8,
      interviewPrep: 8.5,
    },
    domainTags: ["Real-Time Systems", "Kafka / Microservices", "High Scale"],
    logoBg: "bg-slate-700/40 text-slate-200 border-slate-600",
    hiringFocus: "Real-time stream processing, graph algorithms (shortest path variations), high-concurrency microservices.",
    rounds: ["Codesignal OA", "2x Complex Algorithmic Coding", "Machine Coding / LLD Round", "Engineering Leadership"],
  },
  {
    id: "comp-amazon",
    name: "Amazon",
    role: "Software Development Engineer (SDE-1)",
    packageLPA: "₹38–46 LPA",
    tier: "Super Dream",
    minOverallScore: 88,
    minCategoryScores: {
      programming: 13,
      csFundamentals: 12.5,
      codingDsa: 8.5,
      softwareDev: 8.0,
      interviewPrep: 8.5,
    },
    domainTags: ["16 Leadership Principles", "Tree/Graph/DP", "AWS Deployments"],
    logoBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    hiringFocus: "Customer Obsession, Ownership, Bias for Action, fast LeetCode Medium/Hard mastery, AWS deployments.",
    rounds: ["Online Assessment (2 Coding + Work Simulation)", "3x SDE Technical Rounds (DSA + OOD)", "Bar Raiser Interview"],
  },
  {
    id: "comp-adobe",
    name: "Adobe",
    role: "Member Technical Staff",
    packageLPA: "₹36–44 LPA",
    tier: "Super Dream",
    minOverallScore: 89,
    minCategoryScores: {
      programming: 13.5,
      csFundamentals: 13,
      codingDsa: 8.5,
      softwareDev: 8.5,
      interviewPrep: 8.0,
    },
    domainTags: ["C++ / WebAssembly", "Algorithms & Geometry", "Cloud APIs"],
    logoBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    hiringFocus: "High performance rendering, modern C++, distributed cloud architectures, mathematical optimization.",
    rounds: ["OA (DSA + Aptitude + CS MCQs)", "Technical DSA (Trees/Graphs)", "System Architecture & Core CS", "Director HR & Techno-managerial"],
  },
  {
    id: "comp-goldman",
    name: "Goldman Sachs",
    role: "Engineering Analyst (FinTech)",
    packageLPA: "₹28–35 LPA",
    tier: "Dream",
    minOverallScore: 84,
    minCategoryScores: {
      programming: 12.5,
      csFundamentals: 12,
      codingDsa: 8.0,
      softwareDev: 7.5,
      interviewPrep: 7.5,
    },
    domainTags: ["Java / Spring", "Distributed DBs", "Financial Computing"],
    logoBg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    hiringFocus: "Core CS, database isolation levels, Java collections & concurrency, resilient financial microservices.",
    rounds: ["HackerRank OA (Coding + Math/Stats)", "Technical DS & Algorithms", "Core CS (OS, DBMS, Networks)", "Senior MD Fitment"],
  },
  {
    id: "comp-cisco",
    name: "Cisco Systems",
    role: "Software Engineer (Networking & Cloud)",
    packageLPA: "₹22–28 LPA",
    tier: "Dream",
    minOverallScore: 80,
    minCategoryScores: {
      programming: 12,
      csFundamentals: 12.5,
      codingDsa: 7.5,
      softwareDev: 7.5,
      interviewPrep: 7.5,
    },
    domainTags: ["Computer Networks", "Linux Kernel", "Docker & K8s"],
    logoBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    hiringFocus: "TCP/IP, routing algorithms, socket programming, Linux system programming, container orchestration.",
    rounds: ["Technical OA (Networks + Coding)", "Technical Round 1 (Networks & OS)", "Technical Round 2 (DSA & Projects)", "Managerial & HR"],
  },
  {
    id: "comp-oracle",
    name: "Oracle Cloud (OCI)",
    role: "Software Developer-1",
    packageLPA: "₹24–32 LPA",
    tier: "Dream",
    minOverallScore: 82,
    minCategoryScores: {
      programming: 12.5,
      csFundamentals: 12,
      codingDsa: 8.0,
      softwareDev: 7.5,
      interviewPrep: 7.5,
    },
    domainTags: ["Database Internals", "Distributed Storage", "Java / Go"],
    logoBg: "bg-red-600/10 text-red-300 border-red-600/30",
    hiringFocus: "Distributed database internals, ACID semantics, consensus protocols, OCI cloud infrastructure.",
    rounds: ["Coding OA", "2x Technical Coding & Systems", "Core Database & Cloud Arch", "Hiring Manager Review"],
  },
  {
    id: "comp-freshworks",
    name: "Freshworks",
    role: "Product Software Engineer",
    packageLPA: "₹15–22 LPA",
    tier: "Core Product",
    minOverallScore: 78,
    minCategoryScores: {
      programming: 11.5,
      csFundamentals: 11,
      codingDsa: 7.0,
      softwareDev: 8.0,
      interviewPrep: 7.0,
    },
    domainTags: ["Multi-Tenant SaaS", "REST APIs", "Modern Frontend/Backend"],
    logoBg: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    hiringFocus: "Production full-stack development, multi-tenant databases, clean REST API design, fast iteration.",
    rounds: ["Online Assessment", "Machine Coding Round", "System Design & Code Review", "Culture & Fitment"],
  },
  {
    id: "comp-zoho",
    name: "Zoho Corporation",
    role: "Member Technical Staff (Core Product)",
    packageLPA: "₹12–18 LPA",
    tier: "Core Product",
    minOverallScore: 74,
    minCategoryScores: {
      programming: 12,
      csFundamentals: 11,
      codingDsa: 7.0,
      softwareDev: 7.5,
      interviewPrep: 7.0,
    },
    domainTags: ["Zero-Dependency C/Java", "Data Structures", "Design Patterns"],
    logoBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    hiringFocus: "Raw problem solving without third-party frameworks, custom memory structures, core logic depth.",
    rounds: ["Written Basic Programming & Aptitude", "Advanced Programming (Complex Implementation)", "Design Round (OOP)", "HR & Technical Fit"],
  },
];

export interface CompanyMatchResult {
  company: CompanyReadinessProfile;
  matchScore: number; // 0 to 100%
  isQualified: boolean;
  status: "Direct Fit" | "Near Target" | "Bridge Gap";
  gapDetails: string[];
}

export function calculateCompanyMatches(categoryScores: CategoryScoreItem[], totalScore: number): CompanyMatchResult[] {
  const scoreMap: Record<string, number> = {};
  categoryScores.forEach((c) => {
    scoreMap[c.key] = c.obtained;
  });

  const pScore = scoreMap["Programming Skills"] || 0;
  const csScore = scoreMap["Core CS Subjects"] || 0;
  const dsaScore = scoreMap["Coding & DSA"] || 0;
  const devScore = scoreMap["Software Development"] || 0;
  const ivScore = scoreMap["Interview Readiness"] || 0;

  return SUPER_DREAM_COMPANIES.map((company) => {
    const gaps: string[] = [];

    const overallPct = Math.min(100, Math.round((totalScore / company.minOverallScore) * 100));

    if (totalScore < company.minOverallScore) {
      gaps.push(`Overall Score: ${totalScore} / ${company.minOverallScore} (Need +${Math.round(company.minOverallScore - totalScore)} pts)`);
    }

    if (pScore < company.minCategoryScores.programming) {
      gaps.push(`Programming: ${pScore.toFixed(1)} / ${company.minCategoryScores.programming}`);
    }
    if (csScore < company.minCategoryScores.csFundamentals) {
      gaps.push(`CS Fundamentals: ${csScore.toFixed(1)} / ${company.minCategoryScores.csFundamentals}`);
    }
    if (dsaScore < company.minCategoryScores.codingDsa) {
      gaps.push(`DSA & Problem Solving: ${dsaScore.toFixed(1)} / ${company.minCategoryScores.codingDsa}`);
    }
    if (devScore < company.minCategoryScores.softwareDev) {
      gaps.push(`Software Dev Deliverables: ${devScore.toFixed(1)} / ${company.minCategoryScores.softwareDev}`);
    }
    if (ivScore < company.minCategoryScores.interviewPrep) {
      gaps.push(`Interview Readiness: ${ivScore.toFixed(1)} / ${company.minCategoryScores.interviewPrep}`);
    }

    const isQualified = gaps.length === 0 && totalScore >= company.minOverallScore;
    const matchScore = Math.min(100, Math.max(10, Math.round((1 - gaps.length * 0.12) * overallPct)));

    let status: CompanyMatchResult["status"] = "Bridge Gap";
    if (isQualified || matchScore >= 95) {
      status = "Direct Fit";
    } else if (matchScore >= 80) {
      status = "Near Target";
    }

    return {
      company,
      matchScore,
      isQualified,
      status,
      gapDetails: gaps,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export interface PlacementSWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  sprintPlan: {
    week: string;
    focus: string;
    actionItems: string[];
  }[];
}

export function generatePlacementSWOT(data: StudentChecklistData, categoryScores: CategoryScoreItem[], totalScore: number): PlacementSWOT {
  const pMastered = data.section1Programming.filter((p) => p.status === "Mastered").length;
  const csHigh = data.section2CsFundamentals.filter((c) => c.rating >= 4).length;
  const dsaLeetcode = data.section3CodingDsa.find((d) => d.id === "dsa-1")?.current || 0;
  const devVerified = data.section4SoftwareDev.filter((d) => d.verified).length;
  const certsCount = data.section8Certifications.filter((c) => c.status === "Completed").length;
  const ivMocks = data.section9InterviewPrep.find((i) => i.id === "iv-1")?.current || 0;
  const ghCommits = data.section7GithubPortfolio.find((g) => g.id === "gh-2")?.current || 0;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  if (pMastered >= 4) {
    strengths.push(`Multi-language versatility with ${pMastered} languages mastered at advanced level.`);
  } else {
    weaknesses.push(`Only ${pMastered} programming languages mastered. Target at least 4 languages.`);
  }

  if (csHigh >= 8) {
    strengths.push(`Strong theoretical foundations with ${csHigh}/12 CS subjects rated 4+ stars.`);
  } else {
    weaknesses.push(`CS Fundamentals depth is moderate (${csHigh}/12 subjects rated 4+ stars).`);
  }

  if (dsaLeetcode >= 400) {
    strengths.push(`Solid competitive coding track record with ${dsaLeetcode}+ problems solved.`);
  } else {
    weaknesses.push(`DSA volume (${dsaLeetcode} problems) is below the 600+ Super Dream target benchmark.`);
  }

  if (devVerified >= 4) {
    strengths.push(`Verified production software deliverables (${devVerified} verified repositories & deployments).`);
  } else {
    weaknesses.push(`Only ${devVerified} verified software projects. Expand full-stack and microservices portfolio.`);
  }

  if (certsCount >= 4) {
    strengths.push(`Recognized industry credentials with ${certsCount} certifications verified.`);
  }

  if (ivMocks < 15) {
    weaknesses.push(`Mock interview frequency (${ivMocks} mocks completed) needs acceleration for Bar Raiser rounds.`);
  } else {
    strengths.push(`High mock interview conditioning (${ivMocks} technical rounds simulated).`);
  }

  // Opportunities
  opportunities.push("Direct eligibility for FAANG & Tier-1 Global Product on-campus and off-campus fast-track drives.");
  opportunities.push("Leverage verified GitHub commit footprint (" + ghCommits + "+ commits) for resume shortlisting.");
  opportunities.push("Target high-compensation distributed systems & AI/ML engineering roles in FinTech and Cloud Unicorns.");

  // Threats
  threats.push("Rising industry bar in live system design and low-level concurrency machine coding.");
  threats.push("High rejection risk if CS fundamental concepts (OS Memory, DBMS Transactions, Computer Networks) are superficial.");

  // 4-Week Sprint Plan
  const sprintPlan = [
    {
      week: "Week 1: Algorithmic Rigor & Speed",
      focus: "Hard DSA Patterns & Contest Conditioning",
      actionItems: [
        "Solve 25 LeetCode Medium/Hard DP & Graph problems under 25-minute timer constraint.",
        "Attempt 2 proctored live coding contest simulations on Codeforces / LeetCode.",
        "Review Disjoint Set Union, Segment Trees, and Trie data structures.",
      ],
    },
    {
      week: "Week 2: Low-Level & High-Level System Design",
      focus: "Scalability, Caching & Distributed Consensus",
      actionItems: [
        "Draft and review architecture for 3 systems: Distributed Rate Limiter, TinyURL with Sharding, and Ride-Hailing Geo-Index.",
        "Practice LLD state machines and Factory / Strategy / Observer design patterns in Java / C++.",
        "Inspect database isolation anomalies (Dirty Read, Phantom Read) and index optimizations.",
      ],
    },
    {
      week: "Week 3: Production Portfolio & Cloud Deployments",
      focus: "Live Working Links, CI/CD & Kubernetes",
      actionItems: [
        "Deploy 2 microservices with Docker and automated GitHub Actions CI/CD to AWS/Azure.",
        "Ensure all GitHub repository READMEs contain architecture diagrams, Swagger API specs, and setup instructions.",
        "Audit personal portfolio website and verify SSL/HTTPS certificate.",
      ],
    },
    {
      week: "Week 4: Mock Bar Raiser & Institutional Signoff",
      focus: "FAANG Bar Raiser Simulations & HR Behavioral",
      actionItems: [
        "Conduct 3 AI-proctored mock technical interviews with instant feedback scoring.",
        "Refine STAR-format behavioral responses for Amazon Leadership Principles & Conflict Resolution.",
        "Obtain Faculty Mentor and HoD signoff endorsement on the official Placement Dossier.",
      ],
    },
  ];

  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
    sprintPlan,
  };
}

