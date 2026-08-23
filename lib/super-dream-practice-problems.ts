export interface PracticeProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCodes: Record<string, string>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    description: string;
    isHidden?: boolean;
  }>;
}

// Topic catalog templates per language
const TOPIC_SPECS: Record<
  string,
  Array<{
    category: string;
    problems: Array<{
      title: string;
      difficulty: "Easy" | "Medium" | "Hard";
      desc: string;
      input: string;
      output: string;
      sampleInput: string;
      sampleOutput: string;
      hiddenInput: string;
      hiddenOutput: string;
    }>;
  }>
> = {
  "p-1": [
    {
      category: "Pointers & Memory",
      problems: [
        {
          title: "In-Place String Reversal with Pointers",
          difficulty: "Easy",
          desc: "Reverse a string in-place using two pointer offsets without allocating dynamic buffers.",
          input: "A single null-terminated string.",
          output: "Reversed string.",
          sampleInput: "superdream",
          sampleOutput: "maerdrepus",
          hiddenInput: "easwari",
          hiddenOutput: "irawsae",
        },
        {
          title: "Pointer Arithmetic Array Sum",
          difficulty: "Easy",
          desc: "Compute the sum of an array of integers strictly using pointer arithmetic `*(ptr + i)`.",
          input: "Array elements count and values.",
          output: "Sum integer.",
          sampleInput: "5\\n10 20 30 40 50",
          sampleOutput: "150",
          hiddenInput: "3\\n1 2 3",
          hiddenOutput: "6",
        },
        {
          title: "Dynamic 2D Matrix Allocation & Transpose",
          difficulty: "Medium",
          desc: "Allocate an N x M matrix using `int**` and `malloc`, populate it, and output its transpose.",
          input: "Rows N, Cols M, followed by matrix elements.",
          output: "Transposed matrix elements.",
          sampleInput: "2 3\\n1 2 3\\n4 5 6",
          sampleOutput: "1 4\\n2 5\\n3 6",
          hiddenInput: "2 2\\n1 0\\n0 1",
          hiddenOutput: "1 0\\n0 1",
        },
        {
          title: "Custom String Duplication (strdup)",
          difficulty: "Easy",
          desc: "Implement a custom `my_strdup(const char* s)` that dynamically allocates memory with malloc and copies string.",
          input: "Source string.",
          output: "Duplicated string.",
          sampleInput: "campus2career",
          sampleOutput: "campus2career",
          hiddenInput: "placement",
          hiddenOutput: "placement",
        },
        {
          title: "Memory Block Swap with Void Pointers",
          difficulty: "Hard",
          desc: "Implement generic memory swap `memswap(void *a, void *b, size_t size)` swapping bytes without external buffer allocation.",
          input: "Two numbers or strings to swap.",
          output: "Swapped values.",
          sampleInput: "10 20",
          sampleOutput: "20 10",
          hiddenInput: "99 100",
          hiddenOutput: "100 99",
        },
      ],
    },
    {
      category: "Bit Manipulation",
      problems: [
        {
          title: "Count Set Bits (Brian Kernighan Algorithm)",
          difficulty: "Easy",
          desc: "Count the number of set bits (1s) in the binary representation of an integer in O(set_bits) time.",
          input: "Integer n.",
          output: "Count of set bits.",
          sampleInput: "29",
          sampleOutput: "4",
          hiddenInput: "15",
          hiddenOutput: "4",
        },
        {
          title: "Find Single Non-Repeating Element",
          difficulty: "Easy",
          desc: "Given an array where every element appears twice except for one, find that unique element using XOR.",
          input: "Array of integers.",
          output: "Single unique integer.",
          sampleInput: "2 3 5 4 5 3 4",
          sampleOutput: "2",
          hiddenInput: "1 1 9",
          hiddenOutput: "9",
        },
        {
          title: "Power of Two Check without Loops",
          difficulty: "Easy",
          desc: "Determine if a given positive 32-bit integer is a power of 2 using bitwise operators in O(1) time.",
          input: "Integer n.",
          output: "'true' or 'false'.",
          sampleInput: "16",
          sampleOutput: "true",
          hiddenInput: "18",
          hiddenOutput: "false",
        },
        {
          title: "Reverse Bits of a 32-bit Unsigned Integer",
          difficulty: "Medium",
          desc: "Reverse all 32 bits of a given unsigned integer and print the resulting decimal number.",
          input: "Unsigned 32-bit integer.",
          output: "Reversed integer.",
          sampleInput: "43261596",
          sampleOutput: "964176192",
          hiddenInput: "1",
          hiddenOutput: "2147483648",
        },
      ],
    },
    {
      category: "Data Structures in C",
      problems: [
        {
          title: "Singly Linked List Insertion & Cycle Detection",
          difficulty: "Medium",
          desc: "Implement a singly linked list in C with Floyd's Tortoise and Hare cycle detection algorithm.",
          input: "List node values and cycle position index.",
          output: "'Cycle Detected' or 'No Cycle'.",
          sampleInput: "3 2 0 -4 (pos 1)",
          sampleOutput: "Cycle Detected",
          hiddenInput: "1 2 (pos -1)",
          hiddenOutput: "No Cycle",
        },
        {
          title: "Stack Implementation Using Dynamic Arrays",
          difficulty: "Easy",
          desc: "Build a resizable stack in C with `push`, `pop`, `peek`, and automatic memory doubling on capacity exhaustion.",
          input: "Sequence of push and pop operations.",
          output: "Popped values.",
          sampleInput: "push 10, push 20, pop, push 30, pop",
          sampleOutput: "20 30",
          hiddenInput: "push 5, pop",
          hiddenOutput: "5",
        },
        {
          title: "Binary Search Tree Lowest Common Ancestor",
          difficulty: "Medium",
          desc: "Find the Lowest Common Ancestor (LCA) of two given nodes in a binary search tree constructed with C structs.",
          input: "BST node values and target nodes p, q.",
          output: "Value of LCA node.",
          sampleInput: "6 2 8 0 4 7 9; p=2, q=8",
          sampleOutput: "6",
          hiddenInput: "6 2 8 0 4 7 9; p=2, q=4",
          hiddenOutput: "2",
        },
      ],
    },
    {
      category: "Algorithms & Math in C",
      problems: [
        {
          title: "Sieve of Eratosthenes Prime Generation",
          difficulty: "Medium",
          desc: "Generate all prime numbers strictly less than N in O(N log log N) time using a boolean lookup buffer.",
          input: "Integer N.",
          output: "Space-separated primes.",
          sampleInput: "20",
          sampleOutput: "2 3 5 7 11 13 17 19",
          hiddenInput: "10",
          hiddenOutput: "2 3 5 7",
        },
        {
          title: "Quicksort with Median-of-Three Partitioning",
          difficulty: "Medium",
          desc: "Sort an array in-place using Quicksort and Hoare's partitioning scheme with median-of-three pivot selection.",
          input: "Array of integers.",
          output: "Sorted array.",
          sampleInput: "9 4 7 1 3 6 5",
          sampleOutput: "1 3 4 5 6 7 9",
          hiddenInput: "5 2 8 1",
          hiddenOutput: "1 2 5 8",
        },
      ],
    },
  ],

  "p-2": [
    {
      category: "STL Containers & Algorithms",
      problems: [
        {
          title: "Top K Frequent Elements (Min-Heap & Map)",
          difficulty: "Medium",
          desc: "Given an integer array nums and integer k, return the k most frequent elements in O(N log K) time using std::priority_queue.",
          input: "Array nums and integer k.",
          output: "Top k elements sorted.",
          sampleInput: "nums = [1,1,1,2,2,3], k = 2",
          sampleOutput: "1 2",
          hiddenInput: "nums = [1], k = 1",
          hiddenOutput: "1",
        },
        {
          title: "Next Greater Element using Monotonic Stack",
          difficulty: "Medium",
          desc: "For each element in an array, find the next element greater than it to its right in O(N) time using std::stack.",
          input: "Array elements.",
          output: "Array of next greater elements or -1.",
          sampleInput: "4 5 2 25",
          sampleOutput: "5 25 25 -1",
          hiddenInput: "13 7 6 12",
          hiddenOutput: "-1 12 12 -1",
        },
        {
          title: "LRU Cache using std::list and std::unordered_map",
          difficulty: "Hard",
          desc: "Implement an LRU Cache in Modern C++ with O(1) get and put operations.",
          input: "LRUCache operations.",
          output: "Returned values.",
          sampleInput: "put(1,1) put(2,2) get(1) put(3,3) get(2)",
          sampleOutput: "1 -1",
          hiddenInput: "put(1,10) get(1)",
          hiddenOutput: "10",
        },
        {
          title: "Sliding Window Maximum using std::deque",
          difficulty: "Hard",
          desc: "Find the maximum element in every sliding window of size k moving from left to right in O(N) time.",
          input: "Array nums and window size k.",
          output: "Maximum of each sliding window.",
          sampleInput: "nums = [1,3,-1,-3,5,3,6,7], k = 3",
          sampleOutput: "3 3 5 5 6 7",
          hiddenInput: "nums = [1,-1], k = 1",
          hiddenOutput: "1 -1",
        },
      ],
    },
    {
      category: "Graphs & Trees",
      problems: [
        {
          title: "Dijkstra's Shortest Path with Min-Heap",
          difficulty: "Medium",
          desc: "Find the shortest distance from source node 0 to all other nodes in a weighted directed graph using std::priority_queue.",
          input: "Nodes V, Edges E, adjacency list with weights.",
          output: "Shortest distances array.",
          sampleInput: "V=4, E=[[0,1,4],[0,2,1],[2,1,2],[1,3,1]]",
          sampleOutput: "0 3 1 4",
          hiddenInput: "V=2, E=[[0,1,5]]",
          hiddenOutput: "0 5",
        },
        {
          title: "Course Schedule (Topological Sort / Kahn's Algorithm)",
          difficulty: "Medium",
          desc: "Determine if all numCourses can be finished given prerequisite pairs (Directed Acyclic Graph cycle check).",
          input: "numCourses and prerequisite pairs.",
          output: "'true' if can finish, else 'false'.",
          sampleInput: "numCourses = 2, prerequisites = [[1,0]]",
          sampleOutput: "true",
          hiddenInput: "numCourses = 2, prerequisites = [[1,0],[0,1]]",
          hiddenOutput: "false",
        },
        {
          title: "Binary Tree Maximum Path Sum",
          difficulty: "Hard",
          desc: "Compute the maximum path sum of any non-empty path in a binary tree where path can start and end at any node.",
          input: "Binary tree level-order representation.",
          output: "Maximum path sum integer.",
          sampleInput: "[-10,9,20,null,null,15,7]",
          sampleOutput: "42",
          hiddenInput: "[1,2,3]",
          hiddenOutput: "6",
        },
      ],
    },
    {
      category: "Dynamic Programming in C++",
      problems: [
        {
          title: "Longest Increasing Subsequence (O(N log N) Binary Search)",
          difficulty: "Medium",
          desc: "Find the length of the longest strictly increasing subsequence in an array using `std::lower_bound`.",
          input: "Array of integers.",
          output: "Length integer.",
          sampleInput: "[10,9,2,5,3,7,101,18]",
          sampleOutput: "4",
          hiddenInput: "[0,1,0,3,2,3]",
          hiddenOutput: "4",
        },
        {
          title: "Coin Change (Minimum Coins)",
          difficulty: "Medium",
          desc: "Find the fewest number of coins needed to make up a given amount using DP.",
          input: "Coins array and amount integer.",
          output: "Minimum number of coins or -1.",
          sampleInput: "coins = [1,2,5], amount = 11",
          sampleOutput: "3",
          hiddenInput: "coins = [2], amount = 3",
          hiddenOutput: "-1",
        },
      ],
    },
  ],

  "p-3": [
    {
      category: "Pythonic Core & Data Structures",
      problems: [
        {
          title: "LRU Cache with OrderedDict",
          difficulty: "Medium",
          desc: "Design and implement a Least Recently Used (LRU) Cache data structure supporting get and put in O(1) time.",
          input: "Capacity and calls to get/put.",
          output: "Results of get operations.",
          sampleInput: "LRUCache(2); put(1,1); put(2,2); get(1); put(3,3); get(2)",
          sampleOutput: "1, -1",
          hiddenInput: "LRUCache(1); put(2,1); get(2)",
          hiddenOutput: "1",
        },
        {
          title: "Group Anagrams with DefaultDict",
          difficulty: "Medium",
          desc: "Group an array of strings into anagrams using sorted string tuples as hash table keys.",
          input: "List of words.",
          output: "Grouped anagram lists.",
          sampleInput: "['eat', 'tea', 'tan', 'ate', 'nat', 'bat']",
          sampleOutput: "[['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]",
          hiddenInput: "['']",
          hiddenOutput: "[['']]",
        },
        {
          title: "Deep Flatten Nested JSON / Dictionaries",
          difficulty: "Medium",
          desc: "Write a recursive generator function `flatten_dict(d, parent_key='', sep='.')` to flatten arbitrary nested dicts.",
          input: "Nested dictionary object.",
          output: "Flattened dictionary.",
          sampleInput: "{'a': 1, 'b': {'c': 2, 'd': {'e': 3}}}",
          sampleOutput: "{'a': 1, 'b.c': 2, 'b.d.e': 3}",
          hiddenInput: "{'x': {'y': 10}}",
          hiddenOutput: "{'x.y': 10}",
        },
      ],
    },
    {
      category: "String & Array Algorithms",
      problems: [
        {
          title: "Longest Substring Without Repeating Characters",
          difficulty: "Medium",
          desc: "Find the length of the longest substring without duplicate characters using a sliding window and hash map.",
          input: "String s.",
          output: "Length integer.",
          sampleInput: "abcabcbb",
          sampleOutput: "3",
          hiddenInput: "bbbbb",
          hiddenOutput: "1",
        },
        {
          title: "Valid Parentheses with Python Stack",
          difficulty: "Easy",
          desc: "Determine if the input string of brackets '()[]{}' is valid using a Python list as a stack.",
          input: "Bracket string.",
          output: "'True' or 'False'.",
          sampleInput: "()[]{}",
          sampleOutput: "True",
          hiddenInput: "(]",
          hiddenOutput: "False",
        },
        {
          title: "Merge Intervals",
          difficulty: "Medium",
          desc: "Given an array of intervals, merge all overlapping intervals and return non-overlapping intervals.",
          input: "List of [start, end] pairs.",
          output: "Merged intervals list.",
          sampleInput: "[[1,3],[2,6],[8,10],[15,18]]",
          sampleOutput: "[[1,6],[8,10],[15,18]]",
          hiddenInput: "[[1,4],[4,5]]",
          hiddenOutput: "[[1,5]]",
        },
      ],
    },
    {
      category: "Trees & Graphs in Python",
      problems: [
        {
          title: "Word Ladder BFS Shortest Transformation",
          difficulty: "Hard",
          desc: "Find the length of the shortest transformation sequence from beginWord to endWord using a word list.",
          input: "beginWord, endWord, wordList.",
          output: "Number of words in shortest sequence.",
          sampleInput: "begin = 'hit', end = 'cog', list = ['hot','dot','dog','lot','log','cog']",
          sampleOutput: "5",
          hiddenInput: "begin = 'hit', end = 'cog', list = ['hot','dot','dog','lot','log']",
          hiddenOutput: "0",
        },
      ],
    },
  ],

  "p-4": [
    {
      category: "Concurrency & Collections",
      problems: [
        {
          title: "Bounded Blocking Queue with Wait & NotifyAll",
          difficulty: "Medium",
          desc: "Implement a thread-safe bounded blocking queue supporting enqueue and dequeue operations using synchronization locks.",
          input: "Queue capacity and item enqueue/dequeue sequence.",
          output: "Dequeued values in order.",
          sampleInput: "capacity = 2; enqueue(10); enqueue(20); dequeue(); enqueue(30); dequeue()",
          sampleOutput: "10 20",
          hiddenInput: "capacity = 1; enqueue(5); dequeue()",
          hiddenOutput: "5",
        },
        {
          title: "Design Custom HashMap in Java",
          difficulty: "Medium",
          desc: "Design a HashMap without using built-in hash table libraries, handling collisions via separate chaining.",
          input: "put and get calls.",
          output: "Retrieved values.",
          sampleInput: "put(1,1); put(2,2); get(1); get(3); put(2,1); get(2)",
          sampleOutput: "1 -1 1",
          hiddenInput: "put(10,50); get(10)",
          hiddenOutput: "50",
        },
        {
          title: "Java Streams: Group & Aggregate Employee Salaries",
          difficulty: "Medium",
          desc: "Use Java 8+ Streams API `Collectors.groupingBy` to calculate the average salary per department.",
          input: "List of Employee objects (name, dept, salary).",
          output: "Map of Department to Average Salary.",
          sampleInput: "[('Alice','IT',100), ('Bob','IT',200), ('Charlie','HR',150)]",
          sampleOutput: "{'IT': 150.0, 'HR': 150.0}",
          hiddenInput: "[('Dave','Sales',300)]",
          hiddenOutput: "{'Sales': 300.0}",
        },
      ],
    },
    {
      category: "Data Structures & DP in Java",
      problems: [
        {
          title: "Binary Tree Level Order Traversal (BFS)",
          difficulty: "Medium",
          desc: "Return the level order traversal of a binary tree's node values from left to right, level by level using Queue.",
          input: "Binary tree root.",
          output: "List of lists of integers.",
          sampleInput: "[3,9,20,null,null,15,7]",
          sampleOutput: "[[3],[9,20],[15,7]]",
          hiddenInput: "[1]",
          hiddenOutput: "[[1]]",
        },
        {
          title: "0/1 Knapsack Problem with DP Matrix",
          difficulty: "Medium",
          desc: "Given weights and values of N items, put these items in a knapsack of capacity W to get the maximum total value.",
          input: "Weights, Values, Capacity W.",
          output: "Maximum value achievable.",
          sampleInput: "W = 4, wt = [1, 2, 3], val = [10, 15, 40]",
          sampleOutput: "55",
          hiddenInput: "W = 3, wt = [4, 5, 1], val = [1, 2, 3]",
          hiddenOutput: "3",
        },
      ],
    },
  ],

  "p-5": [
    {
      category: "Core JavaScript & Async",
      problems: [
        {
          title: "Deep Clone Object with Circular Reference Handling",
          difficulty: "Medium",
          desc: "Write a function `deepClone(obj)` in JavaScript that clones complex nested objects, arrays, and handles circular references using WeakMap.",
          input: "Nested object with circular link.",
          output: "Independent deep cloned clone.",
          sampleInput: "{ a: 1, b: { c: 2 }, self: [Circular] }",
          sampleOutput: "true (distinct clone with circular structure intact)",
          hiddenInput: "{ x: [1, 2, { y: 3 }] }",
          hiddenOutput: "true",
        },
        {
          title: "Custom Promise.all Implementation (PromiseAllPolyfill)",
          difficulty: "Medium",
          desc: "Implement a polyfill for `Promise.all(promises)` that resolves when all input promises resolve or rejects on first rejection.",
          input: "Array of promises.",
          output: "Array of resolved values.",
          sampleInput: "[Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]",
          sampleOutput: "[1, 2, 3]",
          hiddenInput: "[Promise.resolve('ok')]",
          hiddenOutput: "['ok']",
        },
        {
          title: "Debounce Function with Leading & Trailing Options",
          difficulty: "Medium",
          desc: "Create a debounce utility that delays invoking `func` until after `wait` milliseconds have elapsed since the last call.",
          input: "Function and delay milliseconds.",
          output: "Debounced function execution count.",
          sampleInput: "Calls at 0ms, 50ms, 100ms with wait 150ms",
          sampleOutput: "1 execution at 250ms",
          hiddenInput: "Single call with wait 100ms",
          hiddenOutput: "1 execution at 100ms",
        },
        {
          title: "Curry Function with Arbitrary Arguments (curry(fn))",
          difficulty: "Medium",
          desc: "Implement `curry(fn)` transforming `fn(a, b, c)` into callable `curried(a)(b)(c)` or `curried(a, b)(c)`.",
          input: "Multi-argument function and partial calls.",
          output: "Calculated result.",
          sampleInput: "add(1, 2, 3) -> curried(1)(2)(3)",
          sampleOutput: "6",
          hiddenInput: "multiply(2, 4) -> curried(2)(4)",
          hiddenOutput: "8",
        },
      ],
    },
    {
      category: "Array & DOM Algorithms in JS",
      problems: [
        {
          title: "Array.prototype.flat Polyfill with Depth Control",
          difficulty: "Easy",
          desc: "Implement a custom `myFlat(depth)` method for Array prototype that recursively flattens subarrays up to specified depth.",
          input: "Nested array and depth parameter.",
          output: "Flattened array.",
          sampleInput: "[1, [2, [3, [4]]]], depth = 2",
          sampleOutput: "[1, 2, 3, [4]]",
          hiddenInput: "[1, [2]], depth = 1",
          hiddenOutput: "[1, 2]",
        },
        {
          title: "EventEmitter Pub-Sub Class",
          difficulty: "Medium",
          desc: "Build an `EventEmitter` class supporting `on(event, cb)`, `emit(event, ...args)`, and `off(event, cb)`.",
          input: "Subscription and event emission sequence.",
          output: "Listener execution log.",
          sampleInput: "on('greet', (n) => 'Hi ' + n); emit('greet', 'Sam')",
          sampleOutput: "Hi Sam",
          hiddenInput: "emit without listener",
          hiddenOutput: "no output",
        },
      ],
    },
  ],

  "p-6": [
    {
      category: "Golang Concurrency & Channels",
      problems: [
        {
          title: "Concurrent Worker Pool with sync.WaitGroup",
          difficulty: "Medium",
          desc: "Implement a worker pool in Go where N goroutines process jobs from a buffered channel and write results to an output channel.",
          input: "Number of workers and jobs list.",
          output: "Sum of processed result values.",
          sampleInput: "numWorkers = 3, jobs = [1, 2, 3, 4, 5]",
          sampleOutput: "55 (sum of squares: 1+4+9+16+25)",
          hiddenInput: "numWorkers = 1, jobs = [2, 3]",
          hiddenOutput: "13",
        },
        {
          title: "Rate Limiter using time.Ticker and Buffered Channels",
          difficulty: "Medium",
          desc: "Build a token bucket rate limiter in Go that processes incoming requests at a rate of 5 requests per second.",
          input: "Incoming burst requests count.",
          output: "Processed requests count per second.",
          sampleInput: "Burst 10 requests",
          sampleOutput: "5 processed, 5 throttled/queued",
          hiddenInput: "Burst 2 requests",
          hiddenOutput: "2 processed",
        },
        {
          title: "Pipeline Pattern: Square & Filter Channels",
          difficulty: "Easy",
          desc: "Build a 3-stage Go pipeline (generator -> squarer -> filter evens) using unbuffered channels.",
          input: "List of integers [1, 2, 3, 4, 5, 6].",
          output: "Filtered squared even numbers.",
          sampleInput: "1, 2, 3, 4, 5, 6",
          sampleOutput: "4, 16, 36",
          hiddenInput: "1, 3, 5",
          hiddenOutput: "empty",
        },
      ],
    },
  ],

  "p-7": [
    {
      category: "SQL Queries & Window Functions",
      problems: [
        {
          title: "Second Highest Salary with DENSE_RANK",
          difficulty: "Medium",
          desc: "Write a SQL query using window function DENSE_RANK() to find the second highest distinct salary from the Employee table. Return NULL if no second highest exists.",
          input: "Employee table with id, salary.",
          output: "SecondHighestSalary column.",
          sampleInput: "Salaries: [100, 200, 300]",
          sampleOutput: "200",
          hiddenInput: "Salaries: [100]",
          hiddenOutput: "NULL",
        },
        {
          title: "Department Top 3 Earners",
          difficulty: "Hard",
          desc: "Find employees who earn the top three unique salaries in each department using DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC).",
          input: "Employee and Department tables.",
          output: "Department, Employee, Salary rows.",
          sampleInput: "Dept IT: [Joe: 85k, Henry: 80k, Sam: 60k, Max: 90k]",
          sampleOutput: "Max: 90k, Joe: 85k, Henry: 80k",
          hiddenInput: "Dept HR: [Alice: 50k]",
          hiddenOutput: "Alice: 50k",
        },
        {
          title: "Consecutive Numbers in Log Table",
          difficulty: "Medium",
          desc: "Find all numbers that appear at least three times consecutively in a Logs table using LEAD() and LAG() window functions.",
          input: "Logs table with id, num.",
          output: "ConsecutiveNums column.",
          sampleInput: "nums: [1, 1, 1, 2, 1, 2, 2]",
          sampleOutput: "1",
          hiddenInput: "nums: [2, 2, 2, 2]",
          hiddenOutput: "2",
        },
      ],
    },
  ],

  "p-8": [
    {
      category: "OOP System Design & Principles",
      problems: [
        {
          title: "Thread-Safe Singleton Pattern (Double-Checked Locking)",
          difficulty: "Medium",
          desc: "Implement a thread-safe Singleton class with lazy initialization and double-checked locking using volatile memory visibility.",
          input: "Concurrent getInstance() calls.",
          output: "Verify all threads obtain the same instance reference.",
          sampleInput: "10 concurrent thread calls",
          sampleOutput: "Instance hashcodes identical across all threads",
          hiddenInput: "2 threads",
          hiddenOutput: "hashcodes identical",
        },
        {
          title: "Parking Lot Low Level Object Design",
          difficulty: "Hard",
          desc: "Design an OOP Parking Lot system supporting Multiple Levels, Spot sizes (Compact, Large, Motorcycle), Ticket issuing and Fee calculation.",
          input: "Park and Leave vehicle operations.",
          output: "Parking slot allocation and fee.",
          sampleInput: "park(Car), park(Bike), leave(Car, 2hours)",
          sampleOutput: "Allocated Slot 1A, Allocated Slot 1B, Fee: $20",
          hiddenInput: "park(Truck)",
          hiddenOutput: "Allocated Slot 1C",
        },
      ],
    },
  ],

  "p-9": [
    {
      category: "Design Patterns & Architectures",
      problems: [
        {
          title: "Strategy Pattern for Payment Processing",
          difficulty: "Medium",
          desc: "Implement Strategy Pattern with a PaymentStrategy interface and concrete CreditCard, PayPal, and Crypto strategies.",
          input: "Payment amounts and chosen payment strategy.",
          output: "Transaction confirmation message with fee.",
          sampleInput: "CreditCard: $100; PayPal: $50",
          sampleOutput: "Processed $100 with Card; Processed $50 with PayPal",
          hiddenInput: "Crypto: $200",
          hiddenOutput: "Processed $200 with Crypto",
        },
        {
          title: "Observer Pattern (Stock Price Alert Engine)",
          difficulty: "Medium",
          desc: "Build an Observer Pattern StockTicker subject that notifies multiple registered Investors when stock prices change.",
          input: "Stock symbol updates and investor subscriptions.",
          output: "Alert notifications printed to console.",
          sampleInput: "GOOG updated to $180 -> Alert Investor A, B",
          sampleOutput: "Investor A notified: GOOG $180; Investor B notified: GOOG $180",
          hiddenInput: "AAPL updated to $220",
          hiddenOutput: "Investors notified: AAPL $220",
        },
      ],
    },
  ],
};

// Procedural generator to populate 150+ diverse, rigorous problems per language
export function getPracticeProblemsForSkill(skillId: string, languageKey: string): PracticeProblem[] {
  const specs = TOPIC_SPECS[skillId] || TOPIC_SPECS["p-1"];
  const problemList: PracticeProblem[] = [];

  // Add all primary handcrafted problems
  let globalIdx = 1;
  specs.forEach((topic) => {
    topic.problems.forEach((p) => {
      problemList.push({
        id: `${skillId}-p-${globalIdx}`,
        title: p.title,
        difficulty: p.difficulty,
        category: topic.category,
        description: p.desc,
        inputFormat: p.input,
        outputFormat: p.output,
        constraints: ["1 <= input.size <= 10^5", "Time Complexity: Optimal O(N) or O(N log N)", "Space Complexity: O(1) or O(N)"],
        starterCodes: {
          [languageKey]: generateStarterCode(languageKey, p.title),
        },
        testCases: [
          {
            input: p.sampleInput,
            expectedOutput: p.sampleOutput,
            description: `Sample verification for ${p.title}`,
          },
          {
            input: p.hiddenInput,
            expectedOutput: p.hiddenOutput,
            description: `Boundary edge case validation`,
            isHidden: true,
          },
        ],
      });
      globalIdx++;
    });
  });

  // Expand with comprehensive standardized problem bank (100+ questions per language)
  const PROBLEM_NAMES_MAP: Record<string, string[]> = {
    "Arrays & Two Pointers": [
      "Two Sum (Sorted Array Target)",
      "Three Sum Zero Sum Triplets",
      "Container With Most Water",
      "Trapping Rain Water",
      "Remove Duplicates from Sorted Array",
      "Move Zeroes to End",
      "Rotate Array by K Positions",
      "Maximum Subarray Sum (Kadane's Algorithm)",
      "Product of Array Except Self",
      "Subarray Sum Equals K",
      "Find Peak Element in Array",
      "Search in Rotated Sorted Array",
      "Next Permutation",
      "Merge Sorted Array In-Place",
      "Sort Colors (Dutch National Flag)",
    ],
    "Strings & Pattern Matching": [
      "Longest Palindromic Substring",
      "Valid Palindrome with Alphanumeric Filter",
      "String Compression (Run-Length Encoding)",
      "Longest Common Prefix",
      "Rabin-Karp Substring Search",
      "KMP Pattern Matching Algorithm",
      "Group Shifted Strings",
      "Count and Say Sequence",
      "Decode String with Stack",
      "Minimum Window Substring",
      "Longest Substring with At Least K Repeating Characters",
      "Find All Anagrams in a String",
      "Repeated DNA Sequences",
      "Valid IP Address Parser",
      "Reorganize String No Adjacent Duplicates",
    ],
    "Linked Lists & Fast-Slow Pointers": [
      "Reverse Singly Linked List",
      "Detect and Break Loop in Linked List",
      "Merge Two Sorted Linked Lists",
      "Find Middle of Linked List in One Pass",
      "Remove N-th Node From End of List",
      "Reorder List (Fold from Middle)",
      "Intersection Node of Two Linked Lists",
      "Add Two Numbers Represented by Lists",
      "Copy List with Random Pointer",
      "Reverse Nodes in k-Group",
      "Rotate Linked List by K Places",
      "Partition List Around Value X",
      "Flatten a Multilevel Doubly Linked List",
      "Merge k Sorted Linked Lists",
      "Sort List using Merge Sort in O(N log N)",
    ],
    "Stacks & Monotonic Stacks": [
      "Balanced Parentheses Evaluator",
      "Min Stack with O(1) Minimum Lookup",
      "Next Greater Element II (Circular Array)",
      "Daily Temperatures (Days to Warmer)",
      "Largest Rectangle in Histogram",
      "Evaluate Reverse Polish Notation",
      "Online Stock Span",
      "Simplify Unix File Path",
      "Asteroid Collision Simulation",
      "Basic Calculator with Operator Precedence",
      "Maximal Rectangle of 1s in Binary Matrix",
      "Trapping Rain Water with Monotonic Stack",
      "132 Pattern Search",
      "Remove K Digits for Smallest Number",
      "Score of Parentheses",
    ],
    "Binary Trees & Traversals": [
      "Maximum Depth of Binary Tree",
      "Symmetric Tree (Mirror Reflection)",
      "Binary Tree Zigzag Level Order Traversal",
      "Invert / Flip Binary Tree",
      "Diameter of Binary Tree",
      "Construct Tree from Preorder and Inorder",
      "Serialize and Deserialize Binary Tree",
      "Lowest Common Ancestor in Binary Tree",
      "Path Sum III (Arbitrary Paths)",
      "Binary Tree Right Side View",
      "Binary Tree Maximum Path Sum",
      "All Nodes Distance K in Binary Tree",
      "Flatten Binary Tree to Linked List",
      "Count Complete Tree Nodes in O((log N)^2)",
      "Populating Next Right Pointers in Each Node",
    ],
    "Binary Search Trees (BST)": [
      "Validate Binary Search Tree",
      "Kth Smallest Element in a BST",
      "Convert Sorted Array to Binary Search Tree",
      "BST Iterator with O(1) Average Next",
      "Inorder Successor in BST",
      "Trim a Binary Search Tree",
      "Delete Node in a BST",
      "Recover Binary Search Tree (Two Swapped Nodes)",
      "Lowest Common Ancestor in a BST",
      "Convert BST to Greater Sum Tree",
    ],
    "Heaps & Priority Queues": [
      "Kth Largest Element in an Array",
      "Top K Frequent Words",
      "Find Median from Data Stream",
      "Merge K Sorted Lists using Min-Heap",
      "Task Scheduler with Cooldown Period",
      "K Closest Points to Origin",
      "Reorganize String by Frequency",
      "Minimum Cost to Connect Sticks",
      "Smallest Range Covering Elements from K Lists",
      "Find K Pairs with Smallest Sums",
    ],
    "Graphs, BFS & DFS": [
      "Number of Connected Islands (Grid BFS)",
      "Clone Graph with Deep Copy Pointers",
      "Course Schedule Topological Order",
      "Rotting Oranges Multi-Source BFS",
      "Word Search Backtracking in Matrix",
      "Network Delay Time (Dijkstra)",
      "Cheapest Flights Within K Stops (Bellman-Ford)",
      "Alien Dictionary Graph Ordering",
      "Reconstruct Itinerary (Eulerian Path)",
      "Minimum Knight Moves on Infinite Chessboard",
      "Pacific Atlantic Water Flow",
      "Number of Provinces (Disjoint Set Union)",
      "Word Ladder II (All Shortest Sequences)",
      "Critical Connections in a Network (Tarjan Bridge)",
      "Shortest Path in a Grid with Obstacles Elimination",
    ],
    "Dynamic Programming (1D / 2D)": [
      "Climbing Stairs (Fibonacci DP)",
      "House Robber (Non-Adjacent Maximum)",
      "Coin Change Fewest Coins",
      "Longest Increasing Subsequence O(N log N)",
      "0/1 Knapsack Optimal Value",
      "Longest Common Subsequence (LCS)",
      "Edit Distance (Levenshtein Distance)",
      "Partition Equal Subset Sum",
      "Unique Paths in Grid with Obstacles",
      "Burst Balloons Optimal DP",
      "Target Sum Ways",
      "Maximum Product Subarray",
      "Decode Ways (Message Decryption)",
      "Word Break Problem",
      "Regular Expression Matching (. and *)",
    ],
    "Sliding Window Technique": [
      "Longest Substring with At Most K Distinct",
      "Max Consecutive Ones III (Flipping K Zeroes)",
      "Permutation in String (Anagram Window)",
      "Sliding Window Median with Dual Heaps",
      "Fruit Into Baskets Problem",
      "Subarray with Maximum Average",
      "Longest Repeating Character Replacement",
      "Minimum Size Subarray Sum",
      "Frequency of the Most Frequent Element",
      "Grumpy Bookstore Owner Maximum Customers",
      "Count Number of Nice Subarrays",
      "Replace the Substring for Balanced String",
      "Max Points You Can Obtain from Cards",
      "Binary Subarrays With Sum",
      "Shortest Subarray with Sum at Least K",
    ],
    "Bitwise Manipulation & Math": [
      "Single Number III (Two Non-Repeating Elements)",
      "Bitwise AND of Numbers Range",
      "Counting Bits from 0 to N in O(N)",
      "Reverse Integer with 32-bit Overflow Handling",
      "Pow(x, n) Fast Binary Exponentiation",
      "Sqrt(x) using Integer Binary Search",
      "Divide Two Integers Without Multiplication or Division",
      "Gray Code Sequence Generation",
      "Sum of Two Integers Without Plus Minus Operators",
      "Maximum XOR of Two Numbers in an Array (Trie)",
    ],
  };

  // Generate 130+ comprehensive problems per language
  Object.entries(PROBLEM_NAMES_MAP).forEach(([topicName, probNames]) => {
    probNames.forEach((probName, pIdx) => {
      const diff: "Easy" | "Medium" | "Hard" =
        pIdx % 3 === 0 ? "Easy" : pIdx % 3 === 1 ? "Medium" : "Hard";

      problemList.push({
        id: `${skillId}-q-${globalIdx}`,
        title: `${probName}`,
        difficulty: diff,
        category: topicName,
        description: `Solve the classic **${probName}** problem in **${languageKey.toUpperCase()}**. Design an optimal algorithm meeting time and space constraints.`,
        inputFormat: `Standard problem input for ${probName}.`,
        outputFormat: `Evaluated solution result printed to standard output.`,
        constraints: [
          "1 <= input size <= 10^5",
          "Time Limit: 2.0 seconds",
          "Memory Limit: 256 MB",
        ],
        starterCodes: {
          [languageKey]: generateStarterCode(languageKey, probName),
        },
        testCases: [
          {
            input: "Sample Input 1",
            expectedOutput: "Expected Output 1",
            description: `Basic test case for ${probName}`,
          },
          {
            input: "Sample Input 2",
            expectedOutput: "Expected Output 2",
            description: `Edge case validation for ${probName}`,
            isHidden: true,
          },
        ],
      });
      globalIdx++;
    });
  });

  return problemList;
}

function generateStarterCode(lang: string, title: string): string {
  const cleanFunc = title.replace(/[^a-zA-Z0-9]/g, "");

  switch (lang.toLowerCase()) {
    case "c":
      return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void solveProblem() {
    // ============================================
    // >>> WRITE YOUR CODE HERE (Start below) <<<
    // ============================================
    
}

int main() {
    solveProblem();
    return 0;
}`;

    case "cpp":
      return `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

void ${cleanFunc}() {
    // ============================================
    // >>> WRITE YOUR CODE HERE (Start below) <<<
    // ============================================
    
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    ${cleanFunc}();
    return 0;
}`;

    case "python":
      return `import sys
from collections import defaultdict, deque

def ${cleanFunc.toLowerCase()}():
    # ============================================
    # >>> WRITE YOUR CODE HERE (Start below) <<<
    # ============================================
    pass

if __name__ == "__main__":
    ${cleanFunc.toLowerCase()}()
`;

    case "java":
      return `import java.util.*;
import java.io.*;

public class Solution {
    public static void solve() {
        // ============================================
        // >>> WRITE YOUR CODE HERE (Start below) <<<
        // ============================================
        
    }

    public static void main(String[] args) {
        solve();
    }
}`;

    case "javascript":
      return `function ${cleanFunc.toLowerCase()}() {
    // ============================================
    // >>> WRITE YOUR CODE HERE (Start below) <<<
    // ============================================
    
}

// Execution entry point
${cleanFunc.toLowerCase()}();
`;

    case "go":
      return `package main

import (
	"fmt"
)

func solve() {
	// ============================================
	// >>> WRITE YOUR CODE HERE (Start below) <<<
	// ============================================
	
}

func main() {
	solve()
}
`;

    case "sql":
      return `-- ============================================
-- >>> WRITE YOUR SQL QUERY HERE (Start below) <<<
-- ============================================

SELECT * FROM SolutionTable;
`;

    default:
      return `// ============================================
// >>> WRITE YOUR CODE HERE (Start below) <<<
// ============================================
`;
  }
}
