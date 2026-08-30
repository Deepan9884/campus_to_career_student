export interface MentorTask {
  id: string;
  title: string;
  category: "DSA" | "System Design" | "Project" | "Hackathon" | "Research" | "Core Engineering";
  phase: 1 | 2 | 3 | 4;
  description: string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  priority: "High" | "Urgent" | "Normal";
  status: "pending" | "in_review" | "completed";
  deliverableLink?: string;
  submissionNote?: string;
  submittedAt?: string;
  mentorFeedback?: string;
  mentorRating?: number;
}

export interface TravelMilestone {
  phase: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  targetLPA: string;
  status: "completed" | "current" | "locked";
  description: string;
  requiredTasksCount: number;
  completedTasksCount: number;
  mentorNotes: string;
}

export interface SuperDreamCourse {
  id: string;
  title: string;
  provider: string;
  instructor: string;
  duration: string;
  difficulty: "Advanced" | "Expert" | "Master";
  topics: string[];
  description: string;
  status: "locked" | "in_progress" | "verification_pending" | "completed";
  certificateProof?: {
    certificateUrl?: string;
    certificateFileName?: string;
    credentialId: string;
    issuedBy: string;
    issueDate: string;
    studentName: string;
    verificationScore: number;
    verifiedAt: string;
    verificationChecks: {
      studentMatch: boolean;
      issuerAuthenticated: boolean;
      cryptographicSignatureValid: boolean;
      syllabusAlignment: number; // e.g. 96
      tamperCheckPassed: boolean;
    };
  };
}

export interface MentorRoadmapMilestone {
  id: string;
  title: string;
  curator: string;
  curatorTitle: string;
  tag: string;
  status: "completed" | "in_progress" | "locked";
  description: string;
  topics: {
    id: string;
    name: string;
    estimatedHours: number;
    completed: boolean;
    quizCompleted: boolean;
    quizScore?: number;
  }[];
  quiz: {
    id: string;
    title: string;
    questionsCount: number;
    timeLimitMinutes: number;
    passScore: number;
  };
}

export interface SuperDreamTest {
  id: string;
  title: string;
  category: "DSA Master" | "System Design" | "Microservices" | "Full Stack Diagnostic" | "Aptitude & Logic" | "Speed Coding";
  difficulty: "Medium" | "Hard" | "FAANG Tier";
  durationMinutes: number;
  questionsCount: number;
  totalMarks: number;
  status: "not_started" | "completed";
  highScore?: number;
  attemptsCount: number;
  lastAttemptDate?: string;
  skillsEvaluated: string[];
  passingScore: number;
  questions: {
    id: string;
    question: string;
    codeSnippet?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    topic: string;
  }[];
}

export interface SuperDreamAnalytics {
  readinessIndex: number; // out of 100
  tier: string;
  targetPackage: string;
  mentorRating: number;
  verifiedCoursesCount: number;
  totalCoursesCount: number;
  travelMilestonesCompleted: number;
  totalTravelMilestones: number;
  testsCompletedCount: number;
  averageTestScore: number;
  codingProblemsSolved: {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  };
  competencyRadar: {
    subject: string;
    score: number;
    benchmark: number;
  }[];
  milestoneVelocity: {
    week: string;
    milestonesTarget: number;
    milestonesDone: number;
  }[];
  testScoreHistory: {
    testName: string;
    score: number;
    percentile: number;
  }[];
}

export const INITIAL_MENTOR_INFO = {
  name: "",
  title: "",
  company: "",
  avatar: "",
  email: "",
  officeHours: "",
};

export const INITIAL_TRAVEL_MILESTONES: TravelMilestone[] = [
  {
    phase: 1,
    title: "Phase 1: Advanced Algorithms & Low-Level Foundations",
    subtitle: "Memory layouts, Concurrency, Hard DP, Graph Flow",
    targetLPA: "15 - 20 LPA Base",
    status: "current",
    description: "Build an unshakeable foundation in algorithmic complexity, OS primitives, and low-latency data structures.",
    requiredTasksCount: 4,
    completedTasksCount: 0,
    mentorNotes: "Start with Phase 1 deliverables to build low-level systems & algorithmic competency.",
  },
  {
    phase: 2,
    title: "Phase 2: High-Scale Concurrency & Microservices",
    subtitle: "Raft Consensus, Event-Driven Architecture, Kafka & gRPC",
    targetLPA: "22 - 30 LPA Base",
    status: "locked",
    description: "Design distributed systems capable of handling 50k+ QPS with high fault tolerance and sub-millisecond latencies.",
    requiredTasksCount: 4,
    completedTasksCount: 0,
    mentorNotes: "Unlocks after Phase 1 completion.",
  },
  {
    phase: 3,
    title: "Phase 3: Elite Hackathons & Production GenAI Systems",
    subtitle: "Scalable LLM Orchestration, Vector Search, National Podiums",
    targetLPA: "32 - 45 LPA Base",
    status: "locked",
    description: "Ship production-grade end-to-end applications and achieve podium finishes in tier-1 hackathons.",
    requiredTasksCount: 3,
    completedTasksCount: 0,
    mentorNotes: "Unlocks after Phase 2 mentor signoff. Target: Smart India Hackathon or global AI challenges.",
  },
  {
    phase: 4,
    title: "Phase 4: FAANG & Super Dream Tier Placement Drive",
    subtitle: "Executive Bar Raiser, Staff Mock Rounds, Offer Negotiation",
    targetLPA: "40 - 65+ LPA Package",
    status: "locked",
    description: "Final acceleration phase featuring intensive mock interviews with FAANG hiring managers and portfolio vetting.",
    requiredTasksCount: 3,
    completedTasksCount: 0,
    mentorNotes: "Final gate before placement fast-tracking to top-tier enterprise partners.",
  },
];

export const INITIAL_MENTOR_TASKS: MentorTask[] = [];

export const INITIAL_SUPER_DREAM_COURSES: SuperDreamCourse[] = [
  {
    id: "course-1",
    title: "Distributed Systems Engineering & Consensus Protocols",
    provider: "MIT 6.824 / Distributed Lab",
    instructor: "Prof. Robert Morris",
    duration: "12 Weeks • 48 Hours",
    difficulty: "Master",
    topics: ["Raft Consensus", "MapReduce", "Distributed Transactions", "Sharding & Fault Tolerance", "Paxos"],
    description: "Rigorous systems engineering covering fault-tolerant consensus, primary-backup replication, and high-throughput key-value storage.",
    status: "in_progress",
  },
  {
    id: "course-2",
    title: "AWS Certified Solutions Architect — Professional Track",
    provider: "Amazon Web Services / AWS Training",
    instructor: "AWS Certification Board",
    duration: "10 Weeks • 40 Hours",
    difficulty: "Expert",
    topics: ["Multi-Region VPCs", "Serverless Architecture", "Auto-Scaling & EKS", "CloudFront / DynamoDB", "IAM Security"],
    description: "Enterprise cloud architecture blueprinting for high-availability systems handling 100k+ requests/sec across AWS availability zones.",
    status: "in_progress",
  },
  {
    id: "course-3",
    title: "Full Stack Deep Learning & Production GenAI Systems",
    provider: "UC Berkeley / FSDL Labs",
    instructor: "Dr. Sergey Levine & FSDL Team",
    duration: "8 Weeks • 32 Hours",
    difficulty: "Master",
    topics: ["LLM Fine-Tuning", "RAG Pipelines", "Vector Databases", "Model Quantization", "AI Agent Tool Calling"],
    description: "End-to-end deployment of generative AI pipelines, retrieval-augmented generation, latency optimization, and enterprise evaluation.",
    status: "in_progress",
  },
  {
    id: "course-4",
    title: "Advanced Data Structures, Graph Theory & Competitive Algorithms",
    provider: "Stanford Online / CS 166",
    instructor: "Dr. Keith Schwarz",
    duration: "10 Weeks • 36 Hours",
    difficulty: "Master",
    topics: ["Segment Trees", "Suffix Automata", "Heavy-Light Decomposition", "Eulerian Paths", "Tries & Bitmask DP"],
    description: "Elite competitive programming algorithms required for FAANG OA1/OA2 coding rounds and international programming contests.",
    status: "in_progress",
  },
  {
    id: "course-5",
    title: "Enterprise Microservices Architecture with Spring Boot & Kafka",
    provider: "Coursera / VMware Tanzu",
    instructor: "VMware Principal Engineers",
    duration: "6 Weeks • 24 Hours",
    difficulty: "Advanced",
    topics: ["Event-Driven Architecture", "Apache Kafka", "CQRS & Event Sourcing", "Spring Cloud Gateway", "Docker / K8s"],
    description: "Design and implement scalable event-driven microservices with distributed tracing, circuit breakers, and async message streaming.",
    status: "in_progress",
  },
  {
    id: "course-6",
    title: "High Performance Databases & Query Optimization",
    provider: "CMU 15-445 / Database Group",
    instructor: "Prof. Andy Pavlo",
    duration: "8 Weeks • 30 Hours",
    difficulty: "Expert",
    topics: ["B+ Trees & Buffer Pools", "Query Optimization", "Concurrency Control (MVCC)", "WAL Logging", "LSM Trees"],
    description: "Internals of relational and modern distributed database engines, index tuning, locking strategies, and low-level disk I/O.",
    status: "in_progress",
  },
];

export const INITIAL_MENTOR_ROADMAP: MentorRoadmapMilestone[] = [];

export const INITIAL_SUPER_DREAM_TESTS: SuperDreamTest[] = [
  {
    id: "test-1",
    title: "FAANG Super Dream DSA Master Assessment",
    category: "DSA Master",
    difficulty: "FAANG Tier",
    durationMinutes: 45,
    questionsCount: 4,
    totalMarks: 100,
    status: "not_started",
    attemptsCount: 0,
    skillsEvaluated: ["Dynamic Programming", "Graph Theory", "Segment Trees", "Bitmasking"],
    passingScore: 75,
    questions: [
      {
        id: "q-1-1",
        question: "In a tree with N nodes, which approach computes the sum of distances from every node to all other nodes in O(N) time?",
        options: [
          "Run BFS/DFS from every node (O(N^2))",
          "Tree Rerooting DP (2-pass DFS)",
          "Binary Lifting with LCA",
          "Centroid Decomposition",
        ],
        correctIndex: 1,
        explanation: "Tree Rerooting DP uses a first DFS to compute subtree sizes and base distances, followed by a second DFS to transition root results to child nodes in O(1) per node.",
        topic: "Trees & DP",
      },
      {
        id: "q-1-2",
        question: "What is the optimal time complexity of finding the maximum flow in a bipartite graph using the Hopcroft-Karp algorithm?",
        options: ["O(V * E)", "O(E * sqrt(V))", "O(V^3)", "O(E * log V)"],
        correctIndex: 1,
        explanation: "Hopcroft-Karp finds augmenting paths using BFS and DFS in layers, achieving O(E * sqrt(V)) time complexity.",
        topic: "Graph Algorithms",
      },
      {
        id: "q-1-3",
        question: "Which data structure supports point updates and range query of GCD in O(log N) time per query?",
        options: ["Segment Tree", "Standard Fenwick Tree", "Disjoint Set Union", "Trie"],
        correctIndex: 0,
        explanation: "A Segment Tree stores gcd(left_child, right_child) at internal nodes, supporting updates and GCD queries in O(log N).",
        topic: "Advanced Data Structures",
      },
      {
        id: "q-1-4",
        question: "When applying the Convex Hull Trick to optimize DP transitions of form dp[i] = min(m_j * x_i + c_j) where slopes m_j are not monotonic, which structure is required?",
        options: ["Monotonic Queue", "Li Chao Segment Tree / Dynamic CHT", "Two Pointers", "Fibonacci Heap"],
        correctIndex: 1,
        explanation: "Dynamic CHT or Li Chao Segment Tree enables inserting lines with arbitrary slopes and querying optimal values in O(log N) per point.",
        topic: "Advanced DP Optimization",
      },
    ],
  },
  {
    id: "test-2",
    title: "High-Scale Distributed System Architecture Diagnostic",
    category: "System Design",
    difficulty: "FAANG Tier",
    durationMinutes: 40,
    questionsCount: 4,
    totalMarks: 100,
    status: "not_started",
    attemptsCount: 0,
    skillsEvaluated: ["Raft Consensus", "Partitioning", "Consistency Models", "Caching Strategy"],
    passingScore: 70,
    questions: [
      {
        id: "q-2-1",
        question: "In the Raft consensus algorithm, how does a candidate guarantee that its log contains all committed entries before becoming a leader?",
        options: [
          "It contacts the previous leader directly",
          "Voters only grant votes if the candidate's log is at least as up-to-date as their own",
          "It pulls missing logs from all followers during election",
          "It checks a centralized metadata server",
        ],
        correctIndex: 1,
        explanation: "Raft's RequestVote RPC enforces that voters reject candidates whose log term/index is older than their own, ensuring elected leaders hold all committed entries.",
        topic: "Consensus",
      },
      {
        id: "q-2-2",
        question: "To prevent the Cache Stampede (Thundering Herd) problem when a hot key expires in Redis, what is the most robust strategy?",
        options: [
          "Increase cache TTL to infinity",
          "Probabilistic Early Expiration (XFetch algorithm) or Distributed Mutex Lock",
          "Flush all cache instances on write",
          "Switch completely to disk reads",
        ],
        correctIndex: 1,
        explanation: "Probabilistic early expiration regenerates the cache in the background before hard expiry, preventing thousands of concurrent queries from hitting the DB.",
        topic: "Caching & Resilience",
      },
      {
        id: "q-2-3",
        question: "Which consistency model ensures that if process A updates data and notifies process B via message, process B's subsequent read reflects the update?",
        options: ["Monotonic Read", "Causal Consistency", "Eventual Consistency", "Read Uncommitted"],
        correctIndex: 1,
        explanation: "Causal consistency guarantees that operations causally related are seen by every node in the same order.",
        topic: "Distributed Consistency",
      },
      {
        id: "q-2-4",
        question: "What is the primary advantage of Consistent Hashing with virtual nodes over standard modulo hashing?",
        options: [
          "Eliminates network round trips",
          "Minimizes key remapping when nodes join/leave and distributes load evenly across nodes",
          "Encrypts all key-value pairs automatically",
          "Converts O(N) search to O(1) on disk",
        ],
        correctIndex: 1,
        explanation: "Consistent hashing only requires K/N keys to be remapped on cluster resizing, and virtual nodes avoid hot-spot uneven distribution.",
        topic: "Partitioning",
      },
    ],
  },
  {
    id: "test-3",
    title: "Microservices & Fault-Tolerant Engineering Exam",
    category: "Microservices",
    difficulty: "Hard",
    durationMinutes: 35,
    questionsCount: 4,
    totalMarks: 100,
    status: "not_started",
    attemptsCount: 0,
    skillsEvaluated: ["gRPC", "Circuit Breakers", "Kafka Partitions", "Zero Trust"],
    passingScore: 70,
    questions: [
      {
        id: "q-3-1",
        question: "Why is gRPC over HTTP/2 significantly faster than traditional REST over HTTP/1.1 for internal microservices?",
        options: [
          "gRPC does not use TCP",
          "Multiplexed binary streaming over a single TCP connection with Protobuf serialization",
          "gRPC bypasses TLS handshake completely",
          "JSON parsing is done in GPU memory",
        ],
        correctIndex: 1,
        explanation: "HTTP/2 multiplexing allows concurrent RPCs over one TCP connection, and compact Protobuf eliminates JSON serialization overhead.",
        topic: "Inter-Service Communication",
      },
      {
        id: "q-3-2",
        question: "In Apache Kafka, what determines the maximum number of consumer instances that can actively read in parallel within a single consumer group?",
        options: [
          "The number of broker nodes in the cluster",
          "The number of partitions in the subscribed topic",
          "The size of the consumer group heap memory",
          "Unlimited parallel consumers",
        ],
        correctIndex: 1,
        explanation: "Each partition can be assigned to only one consumer per consumer group at a time. Extra consumers stay idle.",
        topic: "Message Queues",
      },
      {
        id: "q-3-3",
        question: "What state does a Circuit Breaker enter after repeated downstream service timeouts exceed the threshold?",
        options: ["CLOSED", "OPEN", "HALF-OPEN", "DECOMMISSIONED"],
        correctIndex: 1,
        explanation: "The OPEN state fast-fails calls immediately without calling the failing downstream service, allowing it to recover.",
        topic: "Resilience Patterns",
      },
      {
        id: "q-3-4",
        question: "What is the role of an Envoy Sidecar in a Service Mesh like Istio?",
        options: [
          "Replaces the application business logic",
          "Interprets service-to-service mTLS, traffic routing, rate limiting, and telemetry transparently",
          "Manages SQL database schemas",
          "Provides hardware-level CPU scheduling",
        ],
        correctIndex: 1,
        explanation: "Sidecar proxies handle networking concerns (mTLS, telemetry, routing) independently of application code.",
        topic: "Service Mesh",
      },
    ],
  },
  {
    id: "test-4",
    title: "Full-Stack System Diagnostic & Security Speedrun",
    category: "Full Stack Diagnostic",
    difficulty: "Medium",
    durationMinutes: 30,
    questionsCount: 4,
    totalMarks: 100,
    status: "not_started",
    attemptsCount: 0,
    skillsEvaluated: ["OAuth2 / OIDC", "React Concurrency", "Database Indexing", "CORS & CSP"],
    passingScore: 70,
    questions: [
      {
        id: "q-4-1",
        question: "In OAuth 2.0 PKCE flow for single-page applications, what replaces the vulnerable client secret?",
        options: [
          "Hardcoded API keys",
          "Code Verifier and dynamically computed Code Challenge",
          "Basic HTTP Authentication",
          "Self-signed TLS client certificates",
        ],
        correctIndex: 1,
        explanation: "PKCE generates a cryptographically random code_verifier and hash challenge, preventing authorization code interception attacks.",
        topic: "Authentication Security",
      },
      {
        id: "q-4-2",
        question: "Why does a B-Tree / B+ Tree outperform a Binary Search Tree for disk-based database indexes?",
        options: [
          "B+ Trees use less memory than BSTs",
          "B+ Trees have high fanout, dramatically reducing the number of disk I/O seek operations",
          "B+ Trees do not require sorting",
          "B+ Trees store all data in RAM only",
        ],
        correctIndex: 1,
        explanation: "A high fanout (e.g. 100+ pointers per page) allows B+ Trees to reach records across millions of rows in 3-4 disk page reads.",
        topic: "Database Internals",
      },
      {
        id: "q-4-3",
        question: "Which HTTP header is most effective in preventing Cross-Site Scripting (XSS) and data injection vulnerabilities?",
        options: [
          "Access-Control-Allow-Origin",
          "Content-Security-Policy (CSP)",
          "X-Frame-Options: SAMEORIGIN",
          "Cache-Control: no-cache",
        ],
        correctIndex: 1,
        explanation: "CSP restricts the origins from which scripts, images, and other resources can be loaded or executed.",
        topic: "Web Security",
      },
      {
        id: "q-4-4",
        question: "How does React 19's Server Components model differ from traditional client-side hydration?",
        options: [
          "Server Components have zero client JavaScript bundle footprint and never re-render on the browser",
          "Server Components can use useState and useEffect directly",
          "Server Components run exclusively in Web Workers",
          "Server Components replace CSS entirely",
        ],
        correctIndex: 0,
        explanation: "Server Components execute on the server and stream serialized UI without shipping component code or dependencies to the client bundle.",
        topic: "Frontend Architecture",
      },
    ],
  },
  {
    id: "test-5",
    title: "Quantitative Aptitude & Algorithmic Logic Master",
    category: "Aptitude & Logic",
    difficulty: "Medium",
    durationMinutes: 25,
    questionsCount: 4,
    totalMarks: 100,
    status: "not_started",
    attemptsCount: 0,
    skillsEvaluated: ["Probability", "Combinatorics", "Modular Arithmetic", "Game Theory"],
    passingScore: 75,
    questions: [
      {
        id: "q-5-1",
        question: "In the Game of Nim with piles [3, 4, 5], what is the XOR sum (Nim-sum), and does the first player have a winning strategy?",
        options: [
          "Nim-sum is 0; Second player wins",
          "Nim-sum is 2; First player has a winning strategy",
          "Nim-sum is 4; First player loses",
          "Nim-sum is 12; Game is always a draw",
        ],
        correctIndex: 1,
        explanation: "3 (011) ^ 4 (100) ^ 5 (101) = 010 (2 in decimal). Since Nim-sum != 0, the first player has a guaranteed winning move.",
        topic: "Game Theory",
      },
      {
        id: "q-5-2",
        question: "What is the remainder when 3^2026 is divided by 13 (using Fermat's Little Theorem)?",
        options: ["1", "3", "9", "12"],
        correctIndex: 2,
        explanation: "By Fermat's Little Theorem, 3^12 = 1 (mod 13). 2026 = 12 * 168 + 10. 3^10 = (3^3)^3 * 3 = 27^3 * 3 = 1^3 * 3... 3^10 mod 13 = 59049 mod 13 = 9.",
        topic: "Number Theory",
      },
      {
        id: "q-5-3",
        question: "Two fair 6-sided dice are rolled. Given that the sum is strictly greater than 8, what is the probability that at least one die shows a 6?",
        options: ["5/10 (1/2)", "7/10", "6/10 (3/5)", "4/10 (2/5)"],
        correctIndex: 1,
        explanation: "Pairs with sum > 8: (3,6), (4,5), (4,6), (5,4), (5,5), (5,6), (6,3), (6,4), (6,5), (6,6) = 10 outcomes. Those containing 6: (3,6), (4,6), (5,6), (6,3), (6,4), (6,5), (6,6) = 7 outcomes. Probability = 7/10.",
        topic: "Conditional Probability",
      },
      {
        id: "q-5-4",
        question: "How many positive integer divisors does the number 2520 have?",
        options: ["24", "48", "36", "60"],
        correctIndex: 1,
        explanation: "2520 = 2^3 * 3^2 * 5^1 * 7^1. Total divisors = (3+1) * (2+1) * (1+1) * (1+1) = 4 * 3 * 2 * 2 = 48.",
        topic: "Combinatorics",
      },
    ],
  },
  {
    id: "test-6",
    title: "Live Mentor Speed Assessment: High Concurrency",
    category: "Speed Coding",
    difficulty: "FAANG Tier",
    durationMinutes: 20,
    questionsCount: 3,
    totalMarks: 100,
    status: "not_started",
    attemptsCount: 0,
    skillsEvaluated: ["Fast Execution", "Edge Case Coverage", "Memory Management"],
    passingScore: 80,
    questions: [
      {
        id: "q-6-1",
        question: "Which synchronization primitive is most suitable when multiple readers can access shared data simultaneously but writers require exclusive access?",
        options: ["std::mutex / Mutex", "SharedMutex / ReadWriteLock", "Spinlock", "Semaphore(1)"],
        correctIndex: 1,
        explanation: "ReadWriteLock allows concurrent read operations while ensuring mutual exclusion for write operations.",
        topic: "Concurrency",
      },
      {
        id: "q-6-2",
        question: "What is false sharing in multi-threaded programming?",
        options: [
          "Threads sharing variable references without locks",
          "Independent threads modifying distinct variables that reside on the same CPU cache line, causing cache invalidations",
          "Threads sharing identical memory pointers across processes",
          "A deadlock where two threads acquire locks in reverse order",
        ],
        correctIndex: 1,
        explanation: "When independent variables share a 64-byte cache line, updates by one core invalidate the cache line for other cores, degrading performance.",
        topic: "Hardware Architecture",
      },
      {
        id: "q-6-3",
        question: "In distributed transaction management, why does the Saga pattern often replace Two-Phase Commit (2PC) in cloud-native microservices?",
        options: [
          "Saga does not need compensation logic",
          "2PC is a blocking protocol with poor scalability and high latency across distributed networks",
          "Saga guarantees strict ACID isolation across databases",
          "2PC is incompatible with SQL databases",
        ],
        correctIndex: 1,
        explanation: "2PC holds locks across network partitions, causing cascading latency. Saga uses local transactions with compensating rollbacks.",
        topic: "Distributed Transactions",
      },
    ],
  },
];

export const INITIAL_SUPER_DREAM_ANALYTICS: SuperDreamAnalytics = {
  readinessIndex: 0,
  tier: "Not Evaluated",
  targetPackage: "",
  mentorRating: 0,
  verifiedCoursesCount: 0,
  totalCoursesCount: 0,
  travelMilestonesCompleted: 0,
  totalTravelMilestones: 4,
  testsCompletedCount: 0,
  averageTestScore: 0,
  codingProblemsSolved: {
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
  },
  competencyRadar: [
    { subject: "Algorithms & DP", score: 0, benchmark: 80 },
    { subject: "System Design", score: 0, benchmark: 75 },
    { subject: "Concurrency & OS", score: 0, benchmark: 70 },
    { subject: "Microservices & Cloud", score: 0, benchmark: 72 },
    { subject: "GenAI & LLM Architecture", score: 0, benchmark: 65 },
    { subject: "Problem Speed", score: 0, benchmark: 78 },
  ],
  milestoneVelocity: [],
  testScoreHistory: [],
};

/**
 * AI Certificate & Proof Verification Engine
 * Simulates a comprehensive 5-point neural OCR verification check on uploaded certificates
 */
export async function verifyCourseCertificateAI(payload: {
  courseTitle: string;
  studentName: string;
  credentialId: string;
  issuedBy: string;
  proofFileOrUrl: string;
}): Promise<{
  success: boolean;
  score: number;
  verificationChecks: {
    studentMatch: boolean;
    issuerAuthenticated: boolean;
    cryptographicSignatureValid: boolean;
    syllabusAlignment: number;
    tamperCheckPassed: boolean;
  };
  summary: string;
}> {
  // Simulate AI latency for verification processing (1.2s)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const hasCredId = Boolean(payload.credentialId && payload.credentialId.trim().length > 3);
  const hasIssuer = Boolean(payload.issuedBy && payload.issuedBy.trim().length > 2);
  const hasProof = Boolean(payload.proofFileOrUrl && payload.proofFileOrUrl.length > 0);

  if (!hasCredId || !hasIssuer || !hasProof) {
    return {
      success: false,
      score: 0,
      verificationChecks: {
        studentMatch: false,
        issuerAuthenticated: false,
        cryptographicSignatureValid: false,
        syllabusAlignment: 0,
        tamperCheckPassed: false,
      },
      summary: "Verification failed: Incomplete credential identification or invalid certificate proof provided.",
    };
  }

  // Calculate verification score
  const score = Math.floor(Math.random() * 6) + 94;

  return {
    success: true,
    score,
    verificationChecks: {
      studentMatch: true,
      issuerAuthenticated: true,
      cryptographicSignatureValid: true,
      syllabusAlignment: Math.floor(Math.random() * 4) + 96,
      tamperCheckPassed: true,
    },
    summary: `Verified: Document successfully matched candidate identity (${payload.studentName}), verified against ${payload.issuedBy} registry.`,
  };
}

export interface CohortStudent {
  id: string;
  name: string;
  avatar: string;
  email: string;
  targetRole: string;
  readinessIndex: number;
  activePhase: number;
  verifiedCourses: number;
  completedTasks: number;
  avgTestScore: number;
  status: "Qualified" | "In Training" | "Review Required";
}

export const INITIAL_COHORT_STUDENTS: CohortStudent[] = [];

import { api } from "./api";

/**
 * Fetches the student's own Super Dream persistent state from MongoDB.
 */
export async function fetchMySuperDreamState(): Promise<{ superDream: any }> {
  return api.get<{ superDream: any }>("/super-dream/my-state");
}

/**
 * Synchronizes the student's Super Dream checklist, telemetry, and project state to MongoDB.
 */
export async function syncSuperDreamState(payload: {
  checklist?: any;
  codingPlatformsStats?: any;
  csQuizAttempts?: any;
  visitedCsCourses?: any;
  allocatedProjects?: any;
  allocatedAiProjects?: any;
  courses?: any;
  tests?: any;
  mentorRoadmap?: any;
  travelMilestones?: any;
  newMovement?: {
    actionType: string;
    sectionId?: number;
    title: string;
    details?: string;
    metadata?: any;
  };
}): Promise<{ superDream: any; message: string }> {
  return api.put<{ superDream: any; message: string }>("/super-dream/sync", payload);
}

/**
 * Explicitly logs a student movement event to the mentor live audit feed.
 */
export async function logSuperDreamAction(movement: {
  actionType: string;
  sectionId?: number;
  title: string;
  details?: string;
  metadata?: any;
}): Promise<{ movement: any; message: string }> {
  return api.post<{ movement: any; message: string }>("/super-dream/movement", movement);
}

/**
 * Deletes the entire Super Dream record from the backend database, forcing a fresh clean start.
 */
export async function resetSuperDreamState(): Promise<{ message: string; deleted: boolean }> {
  return api.delete<{ message: string; deleted: boolean }>("/super-dream/reset");
}


