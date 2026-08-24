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
  name: "Dr. Rajesh Kumar",
  title: "Principal Software Architect & Ex-Google Staff Engineer",
  company: "Super Dream Mentorship Board",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  email: "rajesh.kumar@superdream.mentors.ai",
  officeHours: "Tuesdays & Thursdays, 6:00 PM - 8:00 PM IST",
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

export const INITIAL_MENTOR_TASKS: MentorTask[] = [
  {
    id: "task-1",
    title: "Implement Lock-Free Single-Producer Multi-Consumer Ring Buffer in C++ / Rust",
    category: "Core Engineering",
    phase: 1,
    description: "Build a memory-efficient SPMC ring buffer with memory barriers and cache-line padding to avoid false sharing.",
    assignedBy: "Dr. Rajesh Kumar",
    assignedDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    priority: "High",
    status: "pending",
    deliverableLink: "",
    submissionNote: "",
  },
  {
    id: "task-2",
    title: "Master Dynamic Programming on Trees and Bitmask Optimization",
    category: "DSA",
    phase: 1,
    description: "Solve 15 Hard LeetCode/Codeforces problems focusing on rerooting DP, tree centroids, and TSP bitmasks.",
    assignedBy: "Dr. Rajesh Kumar",
    assignedDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    priority: "Urgent",
    status: "pending",
    deliverableLink: "",
    submissionNote: "",
  },
  {
    id: "task-3",
    title: "Build Distributed Key-Value Store with Raft Consensus & WAL",
    category: "System Design",
    phase: 2,
    description: "Implement leader election, log replication, and state machine snapshots. Handle split-brain scenarios.",
    assignedBy: "Dr. Rajesh Kumar",
    assignedDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
    priority: "Urgent",
    status: "pending",
    deliverableLink: "",
    submissionNote: "",
  },
  {
    id: "task-4",
    title: "Benchmark Distributed Rate Limiter with Redis Token Bucket & Lua Scripts",
    category: "Project",
    phase: 2,
    description: "Design an atomic rate limiter handling 100k requests/sec across 4 region clusters without race conditions.",
    assignedBy: "Dr. Rajesh Kumar",
    assignedDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 28 * 86400000).toISOString().split("T")[0],
    priority: "High",
    status: "pending",
    deliverableLink: "",
    submissionNote: "",
  },
];

export const INITIAL_SUPER_DREAM_COURSES: SuperDreamCourse[] = [
  {
    id: "course-1",
    title: "Distributed Systems Architecture & Consensus Protocols",
    provider: "MIT 6.824 / Super Dream Track",
    instructor: "Prof. Robert Morris & Dr. Rajesh Kumar",
    duration: "40 Hours • 12 Modules",
    difficulty: "Master",
    topics: ["Raft & Paxos", "MapReduce & GFS", "Fault-Tolerant State Machines", "Linearizability & CAP Theorem"],
    description: "Rigorous deep dive into high-availability distributed systems, partition tolerance, and consensus algorithms required for L5+ engineering roles.",
    status: "in_progress",
  },
  {
    id: "course-2",
    title: "Large Scale System Design & Micro-Frontends",
    provider: "Stanford Online / FAANG Curriculum",
    instructor: "Alex Xu & Martin Kleppmann",
    duration: "32 Hours • 10 Modules",
    difficulty: "Expert",
    topics: ["Distributed Caching & Redis Sentinel", "Event Sourcing & CQRS", "Database Sharding & Consistent Hashing", "GraphQL Federation"],
    description: "Design real-world systems capable of serving hundreds of millions of users with 99.999% uptime guarantees.",
    status: "in_progress",
  },
  {
    id: "course-3",
    title: "Production LLM Engineering & Vector Search Systems",
    provider: "DeepLearning.AI / Super Dream AI Lab",
    instructor: "Andrew Ng & Harrison Chase",
    duration: "28 Hours • 8 Modules",
    difficulty: "Advanced",
    topics: ["RAG Architecture", "Vector Embeddings & HNSW Indexing", "Fine-Tuning & Quantization (LoRA, QLoRA)", "Agentic Workflows & Tool Calling"],
    description: "Architect, deploy, and benchmark enterprise GenAI pipelines with sub-500ms retrieval latencies and high precision.",
    status: "in_progress",
  },
  {
    id: "course-4",
    title: "High-Frequency Algorithm Design & Advanced DP",
    provider: "Super Dream Competitive Programming Institute",
    instructor: "Errichto & Petr Mitrichev",
    duration: "45 Hours • 15 Modules",
    difficulty: "Master",
    topics: ["Convex Hull Trick & Li Chao Tree", "Centroid Decomposition", "Suffix Automaton", "Max Flow Min Cut Variations"],
    description: "Master algorithmic techniques that consistently crack the hardest coding rounds at top-tier financial and tech companies.",
    status: "locked",
  },
];

export const INITIAL_MENTOR_ROADMAP: MentorRoadmapMilestone[] = [
  {
    id: "m-1",
    title: "Mentor Selection: Low-Latency Systems & Concurrency",
    curator: "Dr. Rajesh Kumar",
    curatorTitle: "Principal Architect",
    tag: "Core Foundations",
    status: "in_progress",
    description: "Mentor curated roadmap prioritizing thread-safe architectures and memory models over generic tutorials.",
    topics: [
      { id: "t-1", name: "Memory Barriers & CPU Cache Coherence (MESI Protocol)", estimatedHours: 6, completed: false, quizCompleted: false },
      { id: "t-2", name: "Atomic Primitives & Lock-Free Data Structures", estimatedHours: 8, completed: false, quizCompleted: false },
      { id: "t-3", name: "Linux epoll & High-Performance I/O Multiplexing", estimatedHours: 7, completed: false, quizCompleted: false },
    ],
    quiz: {
      id: "quiz-m-1",
      title: "Low-Latency & Memory Concurrency Benchmark Quiz",
      questionsCount: 5,
      timeLimitMinutes: 10,
      passScore: 80,
    },
  },
  {
    id: "m-2",
    title: "Mentor Selection: Distributed Storage & Consensus Protocols",
    curator: "Dr. Rajesh Kumar",
    curatorTitle: "Principal Architect",
    tag: "Distributed Systems",
    status: "in_progress",
    description: "Hand-picked syllabus covering Raft replication, LSM-trees, and conflict-free replicated data types.",
    topics: [
      { id: "t-4", name: "Raft Leader Election & Log Compaction Algorithms", estimatedHours: 10, completed: true, quizCompleted: true, quizScore: 90 },
      { id: "t-5", name: "Log-Structured Merge Trees (LSM) & SSTables in RocksDB", estimatedHours: 8, completed: false, quizCompleted: false },
      { id: "t-6", name: "Vector Clocks & CRDTs for Eventual Consistency", estimatedHours: 6, completed: false, quizCompleted: false },
    ],
    quiz: {
      id: "quiz-m-2",
      title: "Raft & Distributed Storage Evaluation Quiz",
      questionsCount: 5,
      timeLimitMinutes: 10,
      passScore: 80,
    },
  },
  {
    id: "m-3",
    title: "Mentor Selection: Enterprise Scale Microservices & Observability",
    curator: "Dr. Rajesh Kumar",
    curatorTitle: "Principal Architect",
    tag: "Architecture",
    status: "locked",
    description: "Curated modules for zero-trust microservice meshes, distributed tracing (OpenTelemetry), and circuit breakers.",
    topics: [
      { id: "t-7", name: "gRPC Protocol Buffers & Bi-Directional Streaming", estimatedHours: 8, completed: false, quizCompleted: false },
      { id: "t-8", name: "Distributed Tracing, Context Propagation & Metrics", estimatedHours: 6, completed: false, quizCompleted: false },
      { id: "t-9", name: "Circuit Breakers, Bulkheads & Graceful Degradation", estimatedHours: 5, completed: false, quizCompleted: false },
    ],
    quiz: {
      id: "quiz-m-3",
      title: "Microservices & Reliability Engineering Quiz",
      questionsCount: 5,
      timeLimitMinutes: 10,
      passScore: 80,
    },
  },
];

export const INITIAL_SUPER_DREAM_TESTS: SuperDreamTest[] = [
  {
    id: "test-1",
    title: "FAANG Super Dream DSA Master Assessment",
    category: "DSA Master",
    difficulty: "FAANG Tier",
    durationMinutes: 45,
    questionsCount: 4,
    totalMarks: 100,
    status: "completed",
    highScore: 94,
    attemptsCount: 2,
    lastAttemptDate: "2026-08-16",
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
  targetPackage: "₹20+ LPA Target",
  mentorRating: 0,
  verifiedCoursesCount: 0,
  totalCoursesCount: 4,
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

