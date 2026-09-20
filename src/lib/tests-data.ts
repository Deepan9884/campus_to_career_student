export interface CodingTestCase {
  input: string;
  expectedOutput: string;
  description: string;
  isHidden?: boolean;
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | "FAANG Tier";
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCodes: Record<string, string>;
  testCases: CodingTestCase[];
}

export interface ProctoredAssessment {
  id: string;
  title: string;
  category: "DSA & Algorithms" | "FAANG Tier-1" | "Languages & Core" | "Campus Placement" | "Speed Coding";
  difficulty: "Easy" | "Medium" | "Hard" | "FAANG Tier";
  durationMinutes: number;
  passingScore: number;
  questionsCount: number;
  skillsEvaluated: string[];
  description: string;
  supportedLanguages: string[];
  isProctored: boolean;
  proctorFeatures: string[];
  challenges: CodingChallenge[];
}

export const DEFAULT_STARTER_CODES: Record<string, string> = {
  python: "# write your code here\n",
  javascript: "// write your code here\n",
  java: "// write your code here\n",
  cpp: "// write your code here\n",
  sql: "-- write your code here\n",
};

export const OFFICIAL_CODING_ASSESSMENTS: ProctoredAssessment[] = [
  {
    id: "test-dsa-dp-greedy",
    title: "Dynamic Programming & Greedy Mastery",
    category: "DSA & Algorithms",
    difficulty: "Hard",
    durationMinutes: 60,
    passingScore: 70,
    questionsCount: 3,
    skillsEvaluated: ["Dynamic Programming", "Memoization", "Greedy Choice", "State Transitions"],
    description: "High-yield assessment testing optimal substructure identification, state-space reduction, and greedy algorithms.",
    supportedLanguages: ["python", "javascript", "java", "cpp"],
    isProctored: true,
    proctorFeatures: ["Live Webcam Feed", "Eye Gaze Tracking", "Fullscreen Lock", "Anti-Tab Switch", "Clipboard Sanitization"],
    challenges: [
      {
        id: "dp-1",
        title: "0/1 Knapsack Problem",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: `Given weights and values of **N** items, put these items in a knapsack of capacity **W** to get the maximum total value in the knapsack.

You cannot break an item; you must either pick the complete item or not pick it (0-1 property).

### Example 1:
\`\`\`
Input:
W = 4, wt = [1, 2, 3], val = [10, 15, 40]
Output:
55
Explanation:
Pick items with weights 1 and 3 (total weight 4), total value = 10 + 40 = 50. Best combination is item 1 and item 3 -> value 55.
\`\`\`

### Example 2:
\`\`\`
Input:
W = 3, wt = [4, 5, 1], val = [1, 2, 3]
Output:
3
Explanation:
Only item 3 (weight 1, value 3) fits in capacity 3.
\`\`\``,
        inputFormat: "First line: capacity W. Second line: space-separated weights. Third line: space-separated values.",
        outputFormat: "A single integer denoting the maximum value.",
        constraints: [
          "1 <= N <= 1000",
          "1 <= W <= 1000",
          "1 <= wt[i] <= 1000",
          "1 <= val[i] <= 1000",
        ],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "4\n1 2 3\n10 15 40",
            expectedOutput: "55",
            description: "Standard capacity 4 with 3 items",
            isHidden: false,
          },
          {
            input: "3\n4 5 1\n1 2 3",
            expectedOutput: "3",
            description: "Single fitting item",
            isHidden: false,
          },
          {
            input: "10\n2 3 4 5\n3 4 5 6",
            expectedOutput: "13",
            description: "Hidden capacity test case (25% weight)",
            isHidden: true,
          },
          {
            input: "5\n1 2 3 5\n1 6 10 16",
            expectedOutput: "17",
            description: "Optimal combination selection (25% weight)",
            isHidden: true,
          },
        ],
      },
      {
        id: "dp-2",
        title: "Coin Change (Fewest Coins)",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the *fewest number of coins* that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.

### Example 1:
\`\`\`
Input: coins = [1, 2, 5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1
\`\`\`

### Example 2:
\`\`\`
Input: coins = [2], amount = 3
Output: -1
\`\`\``,
        inputFormat: "First line: space-separated coin denominations. Second line: target amount.",
        outputFormat: "A single integer denoting minimum coins or -1.",
        constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "1 2 5\n11",
            expectedOutput: "3",
            description: "Denominations 1, 2, 5 for amount 11",
            isHidden: false,
          },
          {
            input: "2\n3",
            expectedOutput: "-1",
            description: "Impossible change case",
            isHidden: false,
          },
          {
            input: "1\n0",
            expectedOutput: "0",
            description: "Zero amount base case (25% weight)",
            isHidden: true,
          },
          {
            input: "1 5 10 25\n41",
            expectedOutput: "4",
            description: "Multiple coin denominations (25% weight)",
            isHidden: true,
          },
        ],
      },
      {
        id: "dp-3",
        title: "Activity Selection (Maximum Non-Overlapping Intervals)",
        difficulty: "Hard",
        category: "Greedy Algorithms",
        description: `You are given **N** activities with their start and finish times. Select the maximum number of activities that can be performed by a single person, assuming that a person can only work on a single activity at a time.

### Example:
\`\`\`
Input:
start = [1, 3, 2, 5], finish = [2, 4, 3, 6]
Output:
3
Explanation: A person can perform activities (1,2), (3,4) and (5,6).
\`\`\``,
        inputFormat: "First line: space-separated start times. Second line: space-separated finish times.",
        outputFormat: "A single integer denoting max non-overlapping activities count.",
        constraints: ["1 <= N <= 10^5", "0 <= start[i] < finish[i] <= 10^9"],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "1 3 2 5\n2 4 3 6",
            expectedOutput: "3",
            description: "Standard interval set",
            isHidden: false,
          },
          {
            input: "1 2 3\n2 3 4",
            expectedOutput: "3",
            description: "Contiguous non-overlapping intervals",
            isHidden: false,
          },
          {
            input: "1 2 4\n5 3 6",
            expectedOutput: "2",
            description: "Overlapping intervals edge case (25% weight)",
            isHidden: true,
          },
          {
            input: "10 12 20\n20 25 30",
            expectedOutput: "2",
            description: "Sparse intervals selection (25% weight)",
            isHidden: true,
          },
        ],
      },
    ],
  },
  {
    id: "test-faang-google-sde",
    title: "Google SDE Technical Coding Assessment",
    category: "FAANG Tier-1",
    difficulty: "FAANG Tier",
    durationMinutes: 90,
    passingScore: 75,
    questionsCount: 2,
    skillsEvaluated: ["Hash Map + Doubly Linked List", "Min-Heap / Priority Queue", "O(1) Time Guarantee", "Pointers"],
    description: "Benchmark FAANG level coding round testing high performance system primitives and multi-way merge data structures.",
    supportedLanguages: ["python", "javascript", "java", "cpp"],
    isProctored: true,
    proctorFeatures: ["Live Webcam Feed", "Eye Gaze Tracking", "Fullscreen Lock", "Anti-Tab Switch", "Clipboard Sanitization"],
    challenges: [
      {
        id: "faang-1",
        title: "LRU Cache (O(1) Get and Put)",
        difficulty: "Hard",
        category: "Data Structures",
        description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) Cache**.

Implement the \`LRUCache\` operations:
- \`put key value\` :Update or insert the key-value pair. If capacity exceeded, evict the least recently used key.
- \`get key\` : Return the value if exists, else \`-1\`.

Both \`get\` and \`put\` must run in **O(1)** average time complexity.

### Example:
\`\`\`
Input:
capacity = 2
put 1 1
put 2 2
get 1
put 3 3
get 2
Output:
1
-1
\`\`\``,
        inputFormat: "First line: capacity. Subsequent lines: operations 'put k v' or 'get k'.",
        outputFormat: "Outputs of all 'get' operations on separate lines.",
        constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4", "0 <= value <= 10^5"],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2",
            expectedOutput: "1\n-1",
            description: "LRU basic eviction check",
            isHidden: false,
          },
          {
            input: "1\nput 2 1\nget 2\nput 3 2\nget 2\nget 3",
            expectedOutput: "1\n-1\n2",
            description: "Capacity 1 eviction",
            isHidden: false,
          },
          {
            input: "2\nget 2\nput 2 6\nget 1\nput 1 5\nput 1 2\nget 1\nget 2",
            expectedOutput: "-1\n-1\n2\n6",
            description: "Overwriting existing key (25% weight)",
            isHidden: true,
          },
          {
            input: "3\nput 1 1\nput 2 2\nput 3 3\nput 4 4\nget 4\nget 3\nget 2\nget 1",
            expectedOutput: "4\n3\n2\n-1",
            description: "Capacity 3 sequence eviction (25% weight)",
            isHidden: true,
          },
        ],
      },
      {
        id: "faang-2",
        title: "Merge K Sorted Linked Lists",
        difficulty: "Hard",
        category: "Heap / Divide & Conquer",
        description: `You are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.

*Merge all the linked-lists into one sorted linked-list and return it.*

### Example:
\`\`\`
Input:
k = 3
1 4 5
1 3 4
2 6
Output:
1 1 2 3 4 4 5 6
\`\`\``,
        inputFormat: "First line: k. Next k lines: space-separated integers for each list.",
        outputFormat: "Space-separated integers of the merged sorted sequence.",
        constraints: ["0 <= k <= 10^4", "0 <= total elements <= 10^5", "-10^4 <= node.val <= 10^4"],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "3\n1 4 5\n1 3 4\n2 6",
            expectedOutput: "1 1 2 3 4 4 5 6",
            description: "3 sorted lists merged",
            isHidden: false,
          },
          {
            input: "1\n1 2 3",
            expectedOutput: "1 2 3",
            description: "Single list identity",
            isHidden: false,
          },
          {
            input: "2\n-2 0 4\n-3 1 5",
            expectedOutput: "-3 -2 0 1 4 5",
            description: "Negative numbers merged (25% weight)",
            isHidden: true,
          },
          {
            input: "3\n1\n0\n2",
            expectedOutput: "0 1 2",
            description: "Single element lists (25% weight)",
            isHidden: true,
          },
        ],
      },
    ],
  },
  {
    id: "test-campus-placement-all",
    title: "Campus Placement Technical Drive (TCS / Infosys / Wipro / Cognizant)",
    category: "Campus Placement",
    difficulty: "Medium",
    durationMinutes: 75,
    passingScore: 65,
    questionsCount: 3,
    skillsEvaluated: ["Two Pointers", "Monotonic Stack", "Sliding Window", "String Manipulation"],
    description: "Standard technical coding round used across Tier-1 and Tier-2 product and service mass recruitment campus drives.",
    supportedLanguages: ["python", "javascript", "java", "cpp"],
    isProctored: true,
    proctorFeatures: ["Live Webcam Feed", "Eye Gaze Tracking", "Fullscreen Lock", "Anti-Tab Switch", "Clipboard Sanitization"],
    challenges: [
      {
        id: "campus-1",
        title: "Trapping Rain Water",
        difficulty: "Hard",
        category: "Two Pointers",
        description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Example:
\`\`\`
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
\`\`\``,
        inputFormat: "Space-separated non-negative integers representing elevation bars.",
        outputFormat: "A single integer denoting total units of trapped rain water.",
        constraints: ["1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "0 1 0 2 1 0 1 3 2 1 2 1",
            expectedOutput: "6",
            description: "Standard elevation map",
            isHidden: false,
          },
          {
            input: "4 2 0 3 2 5",
            expectedOutput: "9",
            description: "V-shaped elevation",
            isHidden: false,
          },
          {
            input: "3 0 2 0 4",
            expectedOutput: "7",
            description: "Deep valleys elevation (25% weight)",
            isHidden: true,
          },
          {
            input: "1 2 3 4 5",
            expectedOutput: "0",
            description: "Ascending slope (25% weight)",
            isHidden: true,
          },
        ],
      },
      {
        id: "campus-2",
        title: "Next Greater Element",
        difficulty: "Medium",
        category: "Monotonic Stack",
        description: `Given an array \`arr\` of size \`N\`, find the next greater element for each element of the array in order of their appearance.
If no greater element exists, output \`-1\`.

### Example:
\`\`\`
Input:
4
1 3 2 4
Output:
3 4 4 -1
\`\`\``,
        inputFormat: "First line: N. Second line: space-separated array elements.",
        outputFormat: "Space-separated integers representing next greater elements.",
        constraints: ["1 <= N <= 10^5", "1 <= arr[i] <= 10^9"],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "4\n1 3 2 4",
            expectedOutput: "3 4 4 -1",
            description: "Standard array elements",
            isHidden: false,
          },
          {
            input: "3\n6 8 0",
            expectedOutput: "8 -1 -1",
            description: "Trailing elements without greater items",
            isHidden: false,
          },
          {
            input: "5\n1 2 3 4 5",
            expectedOutput: "2 3 4 5 -1",
            description: "Strictly increasing sequence (25% weight)",
            isHidden: true,
          },
          {
            input: "4\n5 4 3 2",
            expectedOutput: "-1 -1 -1 -1",
            description: "Strictly decreasing sequence (25% weight)",
            isHidden: true,
          },
        ],
      },
      {
        id: "campus-3",
        title: "Longest Substring Without Repeating Characters",
        difficulty: "Medium",
        category: "Sliding Window",
        description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

### Example 1:
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
\`\`\`

### Example 2:
\`\`\`
Input: s = "bbbbb"
Output: 1
\`\`\``,
        inputFormat: "A single line containing string s.",
        outputFormat: "A single integer denoting length of longest unique substring.",
        constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "abcabcbb",
            expectedOutput: "3",
            description: "Repeated character groups",
            isHidden: false,
          },
          {
            input: "bbbbb",
            expectedOutput: "1",
            description: "All duplicate characters",
            isHidden: false,
          },
          {
            input: "pwwkew",
            expectedOutput: "3",
            description: "Subsequence vs substring distinction (25% weight)",
            isHidden: true,
          },
          {
            input: "au",
            expectedOutput: "2",
            description: "Short distinct string (25% weight)",
            isHidden: true,
          },
        ],
      },
    ],
  },
  {
    id: "test-languages-core",
    title: "JavaScript & Full Stack Core Proficiency",
    category: "Languages & Core",
    difficulty: "Medium",
    durationMinutes: 45,
    passingScore: 70,
    questionsCount: 2,
    skillsEvaluated: ["Event Loop & Async Microtasks", "Deep Cloning", "EventEmitter Pattern", "Closures"],
    description: "Deep dive technical test on core JavaScript runtime semantics, prototypal inheritance, and asynchronous execution models.",
    supportedLanguages: ["javascript", "python"],
    isProctored: true,
    proctorFeatures: ["Live Webcam Feed", "Eye Gaze Tracking", "Fullscreen Lock", "Anti-Tab Switch", "Clipboard Sanitization"],
    challenges: [
      {
        id: "lang-1",
        title: "Deep Object Clone & Cyclic Reference Handler",
        difficulty: "Medium",
        category: "JavaScript Core",
        description: `Implement a robust deep clone function that handles primitive values, arrays, nested objects, Date objects, and circular references.

### Example:
\`\`\`
Input:
{"a": 1, "b": {"c": 2}}
Output:
{"a":1,"b":{"c":2}}
\`\`\``,
        inputFormat: "JSON string representing input object.",
        outputFormat: "Serialized JSON string of the clone.",
        constraints: ["Input is valid JSON structure"],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: '{"a": 1, "b": {"c": 2}}',
            expectedOutput: '{"a":1,"b":{"c":2}}',
            description: "Nested dictionary clone",
            isHidden: false,
          },
          {
            input: '[1, [2, 3], {"x": 4}]',
            expectedOutput: '[1,[2,3],{"x":4}]',
            description: "Array with nested object",
            isHidden: false,
          },
          {
            input: '{"user": {"name": "Alice", "skills": ["React", "Node"]}}',
            expectedOutput: '{"user":{"name":"Alice","skills":["React","Node"]}}',
            description: "Deep user profile clone (25% weight)",
            isHidden: true,
          },
          {
            input: '{"active": true, "count": 0, "empty": null}',
            expectedOutput: '{"active":true,"count":0,"empty":null}',
            description: "Primitive and null values (25% weight)",
            isHidden: true,
          },
        ],
      },
      {
        id: "lang-2",
        title: "Event Emitter with Once & Wildcards",
        difficulty: "Medium",
        category: "Design Patterns",
        description: `Implement a publish-subscribe \`EventEmitter\` class that supports:
- \`on(eventName, listener)\`: Registers a callback
- \`emit(eventName, ...args)\`: Invokes all registered callbacks
- \`once(eventName, listener)\`: Registers a one-time callback
- \`off(eventName, listener)\`: Removes a registered callback`,
        inputFormat: "List of emitter instructions.",
        outputFormat: "Emitted log outputs.",
        constraints: ["1 <= events <= 1000"],
        starterCodes: DEFAULT_STARTER_CODES,
        testCases: [
          {
            input: "emit test hello",
            expectedOutput: "hello",
            description: "Basic emission",
            isHidden: false,
          },
          {
            input: "emit click 42",
            expectedOutput: "42",
            description: "Numeric payload",
            isHidden: false,
          },
          {
            input: "emit data ping",
            expectedOutput: "ping",
            description: "Data channel event (25% weight)",
            isHidden: true,
          },
          {
            input: "emit status OK",
            expectedOutput: "OK",
            description: "Status callback (25% weight)",
            isHidden: true,
          },
        ],
      },
    ],
  },
];
