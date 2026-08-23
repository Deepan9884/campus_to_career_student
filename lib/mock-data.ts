export const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  targetRole: "Backend Developer",
  experience: "1-2 years",
  phone: "+1 555 0100",
  github: "johndoe",
  linkedin: "johndoe",
  joined: "2024-03-15",
};

export const mockReadiness = {
  overall: 64,
  resume: 75,
  interview: 55,
  projects: 60,
  skills: 65,
  lastUpdated: "2024-06-20",
};

export const mockActivities = [
  {
    id: 1,
    type: "resume",
    title: "Resume v3 analyzed",
    desc: "ATS score improved to 75",
    date: "2 hours ago",
  },
  {
    id: 2,
    type: "interview",
    title: "Technical Interview",
    desc: "Scored 72/100 on DSA",
    date: "Yesterday",
  },
  {
    id: 3,
    type: "project",
    title: "GitHub repo analyzed",
    desc: "ecommerce-api scored 82/100",
    date: "2 days ago",
  },
  {
    id: 4,
    type: "skill",
    title: "Completed Docker module",
    desc: "Phase 2 of roadmap",
    date: "3 days ago",
  },
  { id: 5, type: "interview", title: "HR Interview", desc: "Scored 68/100", date: "5 days ago" },
];

export const mockInterviews = [
  { id: 1, type: "Technical", domain: "DSA", score: 72, duration: 35, date: "2024-06-20" },
  { id: 2, type: "HR", domain: "Behavioral", score: 68, duration: 25, date: "2024-06-18" },
  {
    id: 3,
    type: "Technical",
    domain: "System Design",
    score: 65,
    duration: 40,
    date: "2024-06-15",
  },
  { id: 4, type: "Technical", domain: "Web Dev", score: 78, duration: 30, date: "2024-06-12" },
];

export const mockResumes = [
  { id: 1, name: "Resume_v3.pdf", score: 75, date: "2024-06-20" },
  { id: 2, name: "Resume_v2.pdf", score: 64, date: "2024-06-10" },
  { id: 3, name: "Resume_v1.pdf", score: 52, date: "2024-05-28" },
];

export const mockATSBreakdown = [
  { name: "Keywords", value: 22, max: 30 },
  { name: "Format", value: 16, max: 20 },
  { name: "Clarity", value: 15, max: 20 },
  { name: "Achievements", value: 14, max: 20 },
  { name: "Grammar", value: 8, max: 10 },
];

export const mockImprovements = [
  {
    priority: "critical",
    title: "Add quantifiable achievements",
    desc: "Use numbers and metrics to show impact (e.g., 'Reduced load time by 40%').",
  },
  {
    priority: "critical",
    title: "Missing key skills",
    desc: "Add Docker, Kubernetes, and AWS — common in backend job descriptions.",
  },
  {
    priority: "important",
    title: "Improve action verbs",
    desc: "Replace passive phrases with strong verbs like 'architected', 'shipped', 'led'.",
  },
  {
    priority: "important",
    title: "Tighten summary",
    desc: "Your summary is 5 lines — aim for 2-3 punchy sentences.",
  },
  {
    priority: "nice",
    title: "Add a portfolio link",
    desc: "A live link to your projects increases recruiter engagement.",
  },
];

export const mockMissingKeywords = [
  "Docker",
  "Kubernetes",
  "AWS",
  "CI/CD",
  "Microservices",
  "Redis",
  "GraphQL",
  "TDD",
];

export const mockRepos = [
  { name: "ecommerce-api", language: "TypeScript", stars: 124, updated: "3 days ago" },
  { name: "ml-pipeline", language: "Python", stars: 56, updated: "1 week ago" },
  { name: "portfolio-site", language: "TypeScript", stars: 18, updated: "2 weeks ago" },
  { name: "chat-realtime", language: "Go", stars: 89, updated: "1 month ago" },
];

export const mockGaps = {
  critical: [
    { skill: "System Design", current: "beginner", target: "intermediate", time: "4-6 weeks" },
    {
      skill: "Docker & Kubernetes",
      current: "beginner",
      target: "intermediate",
      time: "3-4 weeks",
    },
  ],
  important: [
    { skill: "AWS / Cloud", current: "beginner", target: "intermediate", time: "6-8 weeks" },
    { skill: "Microservices", current: "intermediate", target: "advanced", time: "4-5 weeks" },
  ],
  nice: [
    { skill: "GraphQL", current: "none", target: "beginner", time: "2 weeks" },
    { skill: "gRPC", current: "none", target: "beginner", time: "2 weeks" },
  ],
};

export const mockRoadmap = {
  title: "Backend Engineer in 12 Weeks",
  duration: "12 weeks",
  progress: 32,
  phases: [
    {
      n: 1,
      title: "Foundations",
      weeks: "Weeks 1-3",
      status: "completed",
      progress: 100,
      topics: ["Advanced JavaScript / TypeScript", "Node.js internals", "REST API design"],
    },
    {
      n: 2,
      title: "Databases & Caching",
      weeks: "Weeks 4-6",
      status: "in-progress",
      progress: 60,
      topics: ["PostgreSQL deep-dive", "Redis caching", "Query optimization"],
    },
    {
      n: 3,
      title: "System Design",
      weeks: "Weeks 7-9",
      status: "not-started",
      progress: 0,
      topics: ["Scalability patterns", "Microservices", "Message queues"],
    },
    {
      n: 4,
      title: "Cloud & DevOps",
      weeks: "Weeks 10-12",
      status: "not-started",
      progress: 0,
      topics: ["Docker & Kubernetes", "AWS fundamentals", "CI/CD pipelines"],
    },
  ],
};

export const resumeTrend = [
  { date: "May 28", score: 52 },
  { date: "Jun 03", score: 58 },
  { date: "Jun 10", score: 64 },
  { date: "Jun 16", score: 70 },
  { date: "Jun 20", score: 75 },
];

export const interviewTrend = [
  { name: "Int 1", score: 58, type: "Technical" },
  { name: "Int 2", score: 62, type: "HR" },
  { name: "Int 3", score: 65, type: "Technical" },
  { name: "Int 4", score: 68, type: "HR" },
  { name: "Int 5", score: 72, type: "Technical" },
  { name: "Int 6", score: 78, type: "Technical" },
];

export const featureUsage = [
  { name: "Resume", value: 25 },
  { name: "Interview", value: 35 },
  { name: "Projects", value: 15 },
  { name: "Skills", value: 20 },
  { name: "Other", value: 5 },
];

export const skillRadar = [
  { skill: "DSA", current: 65, target: 90 },
  { skill: "System Design", current: 40, target: 85 },
  { skill: "Databases", current: 70, target: 90 },
  { skill: "Cloud", current: 35, target: 80 },
  { skill: "Communication", current: 75, target: 90 },
  { skill: "Problem Solving", current: 72, target: 90 },
];

export const achievements = [
  { name: "First Resume", desc: "Uploaded your first resume", earned: true, tier: "bronze" },
  { name: "Interview Rookie", desc: "Completed first interview", earned: true, tier: "bronze" },
  {
    name: "5 Interviews",
    desc: "Complete 5 mock interviews",
    earned: false,
    progress: 80,
    tier: "silver",
  },
  {
    name: "Score Above 80",
    desc: "Reach an 80+ ATS score",
    earned: false,
    progress: 94,
    tier: "gold",
  },
  {
    name: "Streak Master",
    desc: "Maintain a 30-day streak",
    earned: false,
    progress: 17,
    tier: "platinum",
  },
  {
    name: "Project Pro",
    desc: "Analyze 10 GitHub repos",
    earned: false,
    progress: 30,
    tier: "silver",
  },
];

export const interviewQuestions = [
  "Explain how a HashMap works internally and discuss its time complexity.",
  "How would you design a URL shortener like bit.ly?",
  "What is the difference between SQL and NoSQL databases? When would you pick each?",
  "Walk me through your approach to debugging a slow API endpoint.",
  "Tell me about a project you're proud of and what you'd do differently.",
];
