export interface LanguageLearningLinks {
  gfg: {
    title: string;
    url: string;
    description: string;
  };
  codechef: {
    title: string;
    url: string;
    description: string;
  };
  hackerrank: {
    title: string;
    url: string;
    description: string;
  };
  officialDocs: {
    title: string;
    url: string;
  };
}

export interface McqQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface CodingChallengeTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description: string;
  isHidden?: boolean;
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: "Medium" | "Hard";
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCode: string;
  solutionTemplate: string;
  testCases: CodingChallengeTestCase[];
}

export interface LanguageQuizData {
  languageKey: string;
  languageName: string;
  targetLevel: string;
  durationMinutes: number;
  passingScore: number;
  learningLinks: LanguageLearningLinks;
  subtopics: string[];
  section1Mcqs: McqQuestion[]; // Easy & Medium Conceptual MCQs
  section2Coding: CodingChallenge; // Respective Language Coding Challenge
  section3Mcqs: McqQuestion[]; // Hard MCQs (Internals, Memory, Concurrency, Edge Cases)
}

export const PROGRAMMING_LANGUAGES_CURRICULUM: Record<string, LanguageQuizData> = {
  "p-1": {
    languageKey: "c",
    languageName: "C Programming",
    targetLevel: "Advanced (Systems & Memory)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks C Programming Hub",
        url: "https://www.geeksforgeeks.org/c-programming-language/",
        description: "Complete free C tutorial, pointers, dynamic memory allocation & data structures.",
      },
      codechef: {
        title: "CodeChef Learn C Track",
        url: "https://www.codechef.com/learn/c",
        description: "Free interactive C problems, practice contests, and memory debugging exercises.",
      },
      hackerrank: {
        title: "HackerRank C Domain Track",
        url: "https://www.hackerrank.com/domains/c",
        description: "Standard C challenges, pointers, structs, conditional loops & 5-star skill badge.",
      },
      officialDocs: {
        title: "ISO C Standard Reference / cppreference (C)",
        url: "https://en.cppreference.com/w/c",
      },
    },
    subtopics: [
      "Pointers & Pointer Arithmetic",
      "Dynamic Memory Allocation (malloc, calloc, realloc, free)",
      "Bitwise Operations & Masking",
      "Structures, Unions & Memory Alignment",
      "File I/O & Low-level System Calls",
    ],
    section1Mcqs: [
      {
        id: "c-s1-q1",
        question: "What is the output of the following C code snippet?",
        codeSnippet: `#include <stdio.h>
int main() {
    int arr[] = {10, 20, 30, 40};
    int *ptr = arr;
    printf("%d", *(ptr + 2));
    return 0;
}`,
        options: ["10", "20", "30", "40"],
        correctIndex: 2,
        explanation: "ptr points to arr[0]. Pointer arithmetic *(ptr + 2) accesses the element at index 2, which is 30.",
        difficulty: "Easy",
      },
      {
        id: "c-s1-q2",
        question: "Which of the following functions dynamically allocates memory without initializing the allocated space to zero?",
        options: ["calloc()", "malloc()", "realloc() with zero size", "memset()"],
        correctIndex: 1,
        explanation: "malloc() allocates raw uninitialized heap memory containing garbage values, whereas calloc() zeroes out the allocated memory.",
        difficulty: "Easy",
      },
      {
        id: "c-s1-q3",
        question: "What happens when you free a pointer and then attempt to dereference it without reassigning it?",
        codeSnippet: `int *p = (int*)malloc(sizeof(int));
*p = 42;
free(p);
printf("%d", *p);`,
        options: [
          "It always prints 0",
          "It results in undefined behavior (dangling pointer dereference)",
          "Compiler throws a syntax error",
          "Memory is automatically re-allocated",
        ],
        correctIndex: 1,
        explanation: "Dereferencing freed memory is a classic dangling pointer bug leading to undefined behavior and potential security exploits (Use-After-Free).",
        difficulty: "Medium",
      },
      {
        id: "c-s1-q4",
        question: "What is the purpose of the volatile keyword in C variable declarations?",
        options: [
          "To store the variable in CPU registers for fast access",
          "To tell the compiler that the variable's value may be modified by external hardware or concurrent threads without direct program intervention",
          "To ensure the variable is thread-locked automatically",
          "To make the variable immutable (read-only)",
        ],
        correctIndex: 1,
        explanation: "The volatile qualifier prevents the compiler from optimizing away reads or caching the variable in registers because its value can change unexpectedly (e.g., MMIO, ISR).",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "c-coding-challenge",
      title: "Custom String Reversal & Memory Buffer",
      difficulty: "Medium",
      problemStatement:
        "Write a C function reverseString(char *str) that reverses the order of characters in a given string in-place without allocating extra heap buffers. Your implementation must preserve all original characters and terminate correctly with '\\0'.",
      inputFormat: "A single null-terminated string str.",
      outputFormat: "The reversed string printed to standard output.",
      constraints: ["1 <= strlen(str) <= 1000", "Must operate in-place: O(1) auxiliary space."],
      starterCode: `#include <stdio.h>
#include <string.h>

void reverseString(char *str) {
    // ============================================
    // >>> WRITE YOUR CODE HERE (Start below) <<<
    // ============================================
    
    
}

int main() {
    char input[256] = "superdream";
    reverseString(input);
    printf("%s", input);
    return 0;
}`,
      solutionTemplate: `#include <stdio.h>
#include <string.h>

void reverseString(char *str) {
    int i = 0, j = strlen(str) - 1;
    while (i < j) {
        char t = str[i];
        str[i] = str[j];
        str[j] = t;
        i++;
        j--;
    }
}

int main() {
    char s[] = "superdream";
    reverseString(s);
    printf("%s\\n", s);
    return 0;
}`,
      testCases: [
        {
          id: "tc-c-1",
          input: "superdream",
          expectedOutput: "maerdrepus",
          description: "Standard alphabetic string reversal",
        },
        {
          id: "tc-c-2",
          input: "easwari",
          expectedOutput: "irawsae",
          description: "Odd length string reversal",
        },
        {
          id: "tc-c-3",
          input: "12345",
          expectedOutput: "54321",
          description: "Numeric characters sequence",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "c-s3-q1",
        question: "Consider struct padding in a 64-bit architecture. What is the sizeof(struct Test)?",
        codeSnippet: `struct Test {
    char a;
    int b;
    char c;
};`,
        options: ["6 bytes", "8 bytes", "12 bytes", "16 bytes"],
        correctIndex: 2,
        explanation: "Due to 4-byte natural alignment for int: 'a' takes 1 byte + 3 bytes padding, 'b' takes 4 bytes, 'c' takes 1 byte + 3 bytes trailing padding to match largest member alignment = 12 bytes.",
        difficulty: "Hard",
      },
      {
        id: "c-s3-q2",
        question: "What does the declaration int (*(*fp)(int))[5]; represent in C?",
        options: [
          "A pointer to an array of 5 function pointers",
          "fp is a function pointer taking an int and returning a pointer to an array of 5 ints",
          "An array of 5 functions returning integer pointers",
          "A function taking a 5-element array and returning an int pointer",
        ],
        correctIndex: 1,
        explanation: "fp is a pointer to a function returning a pointer to an array of 5 integers.",
        difficulty: "Hard",
      },
      {
        id: "c-s3-q3",
        question: 'What happens when you attempt to modify a string literal in C (e.g. char *s = "hello"; s[0] = \'H\';)?',
        options: [
          "Modifies the string in heap memory successfully",
          "Causes undefined behavior / Segmentation fault (writing to read-only .rodata segment)",
          "Triggers a compile-time warning but runs safely",
          "Creates a copy of the string automatically",
        ],
        correctIndex: 1,
        explanation: "String literals are typically placed in read-only memory pages (.rodata). Writing to them invokes undefined behavior and immediate SIGSEGV on modern OSes.",
        difficulty: "Hard",
      },
      {
        id: "c-s3-q4",
        question: "What guarantees does setjmp and longjmp provide regarding local automatic variables when returning from longjmp?",
        options: [
          "All automatic variables retain their values unless marked volatile",
          "Automatic variables non-volatile modified between setjmp and longjmp have indeterminate values",
          "Automatic variables are completely preserved on the stack without any caveats",
          "Heap allocations are automatically freed",
        ],
        correctIndex: 1,
        explanation: "Standard C specifies that non-volatile automatic variables modified after setjmp have indeterminate values after a longjmp due to compiler register allocation.",
        difficulty: "Hard",
      },
    ],
  },

  "p-2": {
    languageKey: "cpp",
    languageName: "C++ (Modern C++ & STL)",
    targetLevel: "Advanced (Modern C++20 / STL / RAII)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks C++ Programming Hub",
        url: "https://www.geeksforgeeks.org/c-plus-plus/",
        description: "Modern C++, STL containers, algorithms, templates, lambda expressions & smart pointers.",
      },
      codechef: {
        title: "CodeChef Learn C++ Track",
        url: "https://www.codechef.com/learn/cpp",
        description: "Hands-on competitive programming in C++, fast I/O, vector operations, and map/set mastery.",
      },
      hackerrank: {
        title: "HackerRank C++ Domain Track",
        url: "https://www.hackerrank.com/domains/cpp",
        description: "C++ classes, inheritance, operator overloading, STL algorithms & badge certifications.",
      },
      officialDocs: {
        title: "cppreference.com (C++ Reference)",
        url: "https://en.cppreference.com/w/cpp",
      },
    },
    subtopics: [
      "RAII, Smart Pointers (std::unique_ptr, std::shared_ptr, std::weak_ptr)",
      "Move Semantics & Rvalue References (std::move, std::forward)",
      "STL Containers, Iterators & <algorithm>",
      "Templates, SFINAE & C++20 Concepts",
      "Multithreading, std::async, std::atomic & Memory Models",
    ],
    section1Mcqs: [
      {
        id: "cpp-s1-q1",
        question: "Which smart pointer in Modern C++ enforces exclusive ownership and cannot be copied?",
        options: ["std::shared_ptr", "std::unique_ptr", "std::weak_ptr", "std::auto_ptr"],
        correctIndex: 1,
        explanation: "std::unique_ptr has its copy constructor deleted to ensure sole ownership of the underlying resource. It can only be moved.",
        difficulty: "Easy",
      },
      {
        id: "cpp-s1-q2",
        question: "What is the average time complexity of element lookup in std::unordered_map vs std::map?",
        options: [
          "O(1) in unordered_map vs O(log N) in map",
          "O(log N) in unordered_map vs O(1) in map",
          "O(N) in both",
          "O(1) in both",
        ],
        correctIndex: 0,
        explanation: "std::unordered_map is implemented with a hash table yielding average O(1) lookup, whereas std::map is a Red-Black tree yielding O(log N) lookup.",
        difficulty: "Easy",
      },
      {
        id: "cpp-s1-q3",
        question: "What does std::move actually do under the hood?",
        options: [
          "Moves data across memory blocks immediately",
          "Unconditionally casts its argument to an rvalue reference (T&&)",
          "Allocates a new heap copy and deletes the old one",
          "Locks the thread during object transfer",
        ],
        correctIndex: 1,
        explanation: "std::move does not generate any machine code or move bits itself; it is simply a compile-time cast to an rvalue reference (static_cast<T&&>(arg)), enabling move constructors to trigger.",
        difficulty: "Medium",
      },
      {
        id: "cpp-s1-q4",
        question: "Why should a base class destructor always be declared virtual when polymorphism is used?",
        options: [
          "To allow multiple inheritance",
          "To prevent memory leaks by ensuring the derived class destructor is called when deleting via a base pointer",
          "To make the class abstract",
          "To speed up destructor execution",
        ],
        correctIndex: 1,
        explanation: "Deleting a derived class object through a base pointer without a virtual destructor causes undefined behavior and fails to invoke the derived destructor, leaking derived resources.",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "cpp-coding-challenge",
      title: "Top K Frequent Elements (STL Priority Queue)",
      difficulty: "Medium",
      problemStatement:
        "Given an integer vector nums and an integer k, implement a function vector<int> topKFrequent(vector<int>& nums, int k) returning the k most frequent elements using std::unordered_map and std::priority_queue.",
      inputFormat: "Array of numbers and integer k.",
      outputFormat: "Vector containing the top k frequent integers.",
      constraints: ["1 <= nums.length <= 10^5", "k is in range [1, unique elements]."],
      starterCode: `#include <iostream>
#include <vector>
#include <unordered_map>
#include <queue>
#include <algorithm>
using namespace std;

vector<int> topKFrequent(vector<int>& nums, int k) {
    unordered_map<int, int> countMap;
    for (int n : nums) countMap[n]++;
    
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> minHeap;
    for (auto& [val, freq] : countMap) {
        minHeap.push({freq, val});
        if (minHeap.size() > k) minHeap.pop();
    }
    
    vector<int> result;
    while (!minHeap.empty()) {
        result.push_back(minHeap.top().second);
        minHeap.pop();
    }
    sort(result.begin(), result.end());
    return result;
}

int main() {
    vector<int> nums = {1, 1, 1, 2, 2, 3};
    vector<int> res = topKFrequent(nums, 2);
    for (int x : res) cout << x << " ";
    return 0;
}`,
      solutionTemplate: `#include <iostream>
#include <vector>
#include <unordered_map>
#include <queue>
#include <algorithm>
using namespace std;

vector<int> topKFrequent(vector<int>& nums, int k) {
    unordered_map<int, int> counts;
    for (int x : nums) counts[x]++;
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    for (auto& p : counts) {
        pq.push({p.second, p.first});
        if (pq.size() > k) pq.pop();
    }
    vector<int> ans;
    while (!pq.empty()) {
        ans.push_back(pq.top().second);
        pq.pop();
    }
    sort(ans.begin(), ans.end());
    return ans;
}

int main() {
    vector<int> nums = {1, 1, 1, 2, 2, 3};
    vector<int> res = topKFrequent(nums, 2);
    for (int x : res) cout << x << " ";
    cout << endl;
    return 0;
}`,
      testCases: [
        {
          id: "tc-cpp-1",
          input: "[1,1,1,2,2,3], k=2",
          expectedOutput: "1 2",
          description: "Standard frequency test",
        },
        {
          id: "tc-cpp-2",
          input: "[4,4,4,4,5], k=1",
          expectedOutput: "4",
          description: "Dominant single frequent element",
        },
        {
          id: "tc-cpp-3",
          input: "[10, 20, 10, 20, 30, 10], k=2",
          expectedOutput: "10 20",
          description: "Multiple top frequencies",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "cpp-s3-q1",
        question: "What is Perfect Forwarding in C++ templates, and which standard utility achieves it?",
        options: [
          "std::move to unconditionally transfer ownership",
          "std::forward combined with universal/forwarding references (T&&) to preserve value category (lvalue vs rvalue)",
          "std::make_shared for atomic pointer creation",
          "std::launder to fix memory alignment",
        ],
        correctIndex: 1,
        explanation: "Perfect forwarding preserves whether an argument passed to a template function was an lvalue or rvalue by using forwarding references T&& with std::forward<T>(arg).",
        difficulty: "Hard",
      },
      {
        id: "cpp-s3-q2",
        question: "What is the key difference between std::memory_order_relaxed and std::memory_order_seq_cst in atomic operations?",
        options: [
          "Relaxed has no memory synchronization or ordering constraints beyond the atomic operation itself, whereas seq_cst enforces globally consistent total ordering across all threads",
          "Relaxed locks the operating system kernel mutex",
          "seq_cst is non-atomic while relaxed is atomic",
          "There is no performance difference on x86 architectures",
        ],
        correctIndex: 0,
        explanation: "memory_order_relaxed only guarantees atomicity of the single operation without memory barriers or ordering guarantees. memory_order_seq_cst enforces full sequential consistency with memory fences.",
        difficulty: "Hard",
      },
      {
        id: "cpp-s3-q3",
        question: "What is SFINAE (Substitution Failure Is Not An Error) in C++ template metaprogramming?",
        options: [
          "A compiler bug when generating template instances",
          "A rule where a failure to substitute a template parameter simply rejects the overload from the candidate set instead of aborting compilation",
          "An exception handler for runtime template errors",
          "A way to override private member access",
        ],
        correctIndex: 1,
        explanation: "SFINAE allows compile-time conditional function overload selection (e.g. via std::enable_if or C++20 concepts) without generating hard compiler errors when substitution fails.",
        difficulty: "Hard",
      },
      {
        id: "cpp-s3-q4",
        question: "What is the return value optimization (RVO) / copy elision guarantee in C++17 and later?",
        options: [
          "Copy and move constructors are guaranteed not to be called when returning a prvalue by value, directly constructing in-place",
          "Objects returned by value are converted to pointers automatically",
          "RVO only works in debug mode",
          "RVO requires explicit noexcept specifications",
        ],
        correctIndex: 0,
        explanation: "Since C++17, copy elision is mandatory for prvalues returning by value. The object is constructed directly in the storage allocated for the destination, bypassing both copy and move constructors.",
        difficulty: "Hard",
      },
    ],
  },

  "p-3": {
    languageKey: "python",
    languageName: "Python",
    targetLevel: "Advanced (Data Structures, Async & AI Scripting)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks Python Programming Hub",
        url: "https://www.geeksforgeeks.org/python-programming-language/",
        description: "Python 3 core, OOP, decorators, generators, asyncio, dunder methods & algorithms.",
      },
      codechef: {
        title: "CodeChef Learn Python Track",
        url: "https://www.codechef.com/learn/python",
        description: "Interactive Python practice, competitive programming with Python, list comprehensions & dicts.",
      },
      hackerrank: {
        title: "HackerRank Python Skill Track",
        url: "https://www.hackerrank.com/domains/python",
        description: "Basic to advanced Python challenges, regex, math, numpy, collections & gold star certification.",
      },
      officialDocs: {
        title: "Python 3 Official Documentation",
        url: "https://docs.python.org/3/",
      },
    },
    subtopics: [
      "Generators, Iterators & List/Dict Comprehensions",
      "Decorators, Closures & Context Managers (__enter__, __exit__)",
      "Asyncio & Asynchronous Event Loops",
      "GIL (Global Interpreter Lock) & Multiprocessing vs Multithreading",
      "Metaclasses, Descriptors & Dunder Magic Methods",
    ],
    section1Mcqs: [
      {
        id: "py-s1-q1",
        question: "What is the difference between a generator function and a regular Python function?",
        options: [
          "Generators use the yield keyword to return an iterator yielding values on-demand with O(1) memory state preservation",
          "Generators are always executed on multiple CPU cores",
          "Generators cannot take arguments",
          "Generators convert all variables to global scope",
        ],
        correctIndex: 0,
        explanation: "Generators pause execution at yield and maintain local state, returning values lazily one-by-one without holding the full sequence in memory.",
        difficulty: "Easy",
      },
      {
        id: "py-s1-q2",
        question: "What is the output of [i * 2 for i in range(5) if i % 2 == 0]?",
        options: ["[0, 4, 8]", "[0, 2, 4, 6, 8]", "[2, 6]", "[0, 2, 4]"],
        correctIndex: 0,
        explanation: "The even numbers in range(5) are 0, 2, 4. Multiplying each by 2 gives [0, 4, 8].",
        difficulty: "Easy",
      },
      {
        id: "py-s1-q3",
        question: "What does the *args and **kwargs syntax in Python function definitions signify?",
        options: [
          "*args collects positional arguments as a tuple, and **kwargs collects keyword arguments as a dictionary",
          "*args is for pointers and **kwargs is for double pointers",
          "*args requires integer parameters only",
          "They are deprecated syntax in Python 3",
        ],
        correctIndex: 0,
        explanation: "*args packs arbitrary positional parameters into a tuple, while **kwargs packs arbitrary keyword arguments into a dict.",
        difficulty: "Medium",
      },
      {
        id: "py-s1-q4",
        question: "What is the Global Interpreter Lock (GIL) in CPython?",
        options: [
          "A security lock preventing unauthorized script execution",
          "A mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes simultaneously in CPython",
          "A database transaction lock in SQLite",
          "A mechanism that speeds up mathematical loops",
        ],
        correctIndex: 1,
        explanation: "CPython's GIL is a process-level mutex ensuring thread-safe memory management (ref counting), allowing only one thread to execute Python bytecode at a given time.",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "py-coding-challenge",
      title: "LRU Cache Implementation (OrderedDict / Doubly Linked List)",
      difficulty: "Medium",
      problemStatement:
        "Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache. Implement LRUCache(capacity), get(key), and put(key, value) with O(1) average time complexity for both operations.",
      inputFormat: "Calls to get and put methods on LRUCache instance.",
      outputFormat: "Values returned from get calls.",
      constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4", "get and put in O(1) time."],
      starterCode: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        # ============================================
        # >>> WRITE YOUR CODE HERE (Start below) <<<
        # ============================================
        return -1

    def put(self, key: int, value: int) -> None:
        # ============================================
        # >>> WRITE YOUR CODE HERE (Start below) <<<
        # ============================================
        pass

if __name__ == "__main__":
    lru = LRUCache(2)
    lru.put(1, 1)
    lru.put(2, 2)
    print(lru.get(1))
    lru.put(3, 3)
    print(lru.get(2))
`,
      solutionTemplate: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

if __name__ == "__main__":
    lru = LRUCache(2)
    lru.put(1, 1)
    lru.put(2, 2)
    print(lru.get(1))
    lru.put(3, 3)
    print(lru.get(2))
`,
      testCases: [
        {
          id: "tc-py-1",
          input: "put(1,1), put(2,2), get(1), put(3,3), get(2)",
          expectedOutput: "1\n-1",
          description: "Eviction test for least recently accessed key",
        },
        {
          id: "tc-py-2",
          input: "put(1,10), put(1,20), get(1)",
          expectedOutput: "20",
          description: "Key update test",
        },
        {
          id: "tc-py-3",
          input: "put(2,1), get(1), put(1,5), get(2)",
          expectedOutput: "-1\n1",
          description: "Missing key returns -1",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "py-s3-q1",
        question: "How does Python handle cyclic reference memory deallocation in CPython?",
        options: [
          "Immediate reference counting frees all cycles automatically",
          "Reference counting handles non-cyclic objects immediately, and a generational cyclic Garbage Collector (gc) periodically detects and frees unreferenced reference cycles",
          "Cycles cannot be freed and always cause leaks",
          "Only when the process terminates",
        ],
        correctIndex: 1,
        explanation: "CPython uses reference counting as its primary memory mechanism. To solve circular references (A -> B -> A), it runs a generational cyclic GC using linked list tracking.",
        difficulty: "Hard",
      },
      {
        id: "py-s3-q2",
        question: "What happens when you define __slots__ = ('name', 'age') in a Python class?",
        options: [
          "It restricts the class to have only private variables",
          "It disables the default per-instance __dict__ dictionary, preventing dynamic attribute addition and significantly reducing memory footprint",
          "It creates SQL database tables automatically",
          "It converts the class to a Cython module",
        ],
        correctIndex: 1,
        explanation: "__slots__ replaces the instance dictionary (__dict__) with fixed-size descriptors, saving substantial RAM when instantiating millions of small objects.",
        difficulty: "Hard",
      },
      {
        id: "py-s3-q3",
        question: "What is the difference between asyncio.gather(*tasks) and asyncio.wait(tasks)?",
        options: [
          "gather takes an unpacked list and returns results in input order, while wait returns two sets (done, pending) with fine-grained control via return_when (e.g. FIRST_COMPLETED)",
          "gather runs in separate processes while wait runs on threads",
          "gather cannot handle exceptions",
          "They are identical aliases",
        ],
        correctIndex: 0,
        explanation: "asyncio.gather is a high-level helper aggregating results into a list, whereas asyncio.wait provides lower-level primitives returning (done_futures, pending_futures) with configurable wait triggers.",
        difficulty: "Hard",
      },
      {
        id: "py-s3-q4",
        question: "What is a Python Descriptor and which dunder methods must it implement?",
        options: [
          "An object that customizes attribute access by implementing at least one of __get__, __set__, or __delete__",
          "A module that parses docstrings",
          "A decorator for unit testing",
          "A class method that creates instances",
        ],
        correctIndex: 0,
        explanation: "Descriptors are the underlying protocol powering properties, methods, staticmethods, and classmethods in Python, defined by implementing __get__, __set__, or __delete__.",
        difficulty: "Hard",
      },
    ],
  },

  "p-4": {
    languageKey: "java",
    languageName: "Java",
    targetLevel: "Advanced (JVM Internals & Multithreading)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks Java Hub",
        url: "https://www.geeksforgeeks.org/java/",
        description: "Core Java, JVM architecture, Garbage Collection, Spring Boot basics, Collections & Concurrency.",
      },
      codechef: {
        title: "CodeChef Learn Java Track",
        url: "https://www.codechef.com/learn/java",
        description: "Interactive Java practice, fast I/O, OOP classes, Generics & competitive programming.",
      },
      hackerrank: {
        title: "HackerRank Java Domain Track",
        url: "https://www.hackerrank.com/domains/java",
        description: "Java strings, big numbers, data structures, exception handling & Java 5-star skill badge.",
      },
      officialDocs: {
        title: "Oracle Java SE Documentation",
        url: "https://docs.oracle.com/en/java/",
      },
    },
    subtopics: [
      "JVM Architecture (Classloader, Heap, Metaspace, Execution Engine)",
      "Garbage Collection Algorithms (G1, ZGC, Parallel GC)",
      "Java Memory Model (JMM), volatile, synchronized, and java.util.concurrent",
      "Java Streams API, Lambdas & Functional Interfaces",
      "Generics, Type Erasure & Reflection",
    ],
    section1Mcqs: [
      {
        id: "java-s1-q1",
        question: "In Java, what is the key difference between == and .equals() when comparing two String objects?",
        options: [
          "== compares reference memory addresses, while .equals() compares the actual string character sequence values",
          "== compares values, while .equals() compares memory addresses",
          "There is no difference in Java 17+",
          ".equals() only works on primitives",
        ],
        correctIndex: 0,
        explanation: "== checks if both references point to the exact same object in memory (or String Pool), whereas .equals() performs deep value-based comparison.",
        difficulty: "Easy",
      },
      {
        id: "java-s1-q2",
        question: "Which of the following interfaces is a Functional Interface in Java?",
        options: ["Runnable", "Callable<V>", "Consumer<T>", "All of the above"],
        correctIndex: 3,
        explanation: "A functional interface has exactly one abstract method. Runnable (run), Callable (call), and Consumer (accept) are all functional interfaces annotatable with @FunctionalInterface.",
        difficulty: "Easy",
      },
      {
        id: "java-s1-q3",
        question: "What is the underlying data structure of a HashMap in Java 8+ when hash collisions exceed the TREEIFY_THRESHOLD (8)?",
        options: [
          "Doubly Linked List",
          "Red-Black Balanced Binary Search Tree",
          "B+ Tree",
          "Skip List",
        ],
        correctIndex: 1,
        explanation: "Java 8 optimizes hash buckets with high collisions by transforming linked lists into balanced Red-Black Trees (TreeNode) when bucket size exceeds 8, improving worst-case search from O(N) to O(log N).",
        difficulty: "Medium",
      },
      {
        id: "java-s1-q4",
        question: "What does the volatile keyword guarantee in the Java Memory Model (JMM)?",
        options: [
          "It guarantees atomicity of compound operations like count++",
          "It guarantees visibility of variable updates across threads by forcing reads/writes directly to main memory and preventing instruction reordering",
          "It creates an immutable object",
          "It serializes thread access using an OS mutex",
        ],
        correctIndex: 1,
        explanation: "volatile guarantees happens-before visibility and prevents compiler instruction reordering, but does NOT guarantee atomicity for compound operations (like count++).",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "java-coding-challenge",
      title: "Concurrent Thread-Safe Bounded Blocking Queue",
      difficulty: "Medium",
      problemStatement:
        "Implement a simple thread-safe Bounded Blocking Queue with enqueue(int x) and dequeue() methods using synchronized blocks or ReentrantLock + Condition variables.",
      inputFormat: "Enqueue and dequeue operations sequence.",
      outputFormat: "Output from dequeue operations.",
      constraints: ["Queue capacity > 0", "Thread safe."],
      starterCode: `import java.util.LinkedList;
import java.util.Queue;

class BlockingQueue {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int capacity;

    public BlockingQueue(int capacity) {
        this.capacity = capacity;
    }

    public synchronized void enqueue(int item) throws InterruptedException {
        // ============================================
        // >>> WRITE YOUR CODE HERE (Start below) <<<
        // ============================================
        
    }

    public synchronized int dequeue() throws InterruptedException {
        // ============================================
        // >>> WRITE YOUR CODE HERE (Start below) <<<
        // ============================================
        return -1;
    }

    public static void main(String[] args) throws Exception {
        BlockingQueue bq = new BlockingQueue(2);
        bq.enqueue(10);
        bq.enqueue(20);
        System.out.println(bq.dequeue());
        bq.enqueue(30);
        System.out.println(bq.dequeue());
    }
}`,
      solutionTemplate: `import java.util.LinkedList;
import java.util.Queue;

class BlockingQueue {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int capacity;

    public BlockingQueue(int capacity) {
        this.capacity = capacity;
    }

    public synchronized void enqueue(int item) throws InterruptedException {
        while (queue.size() == capacity) {
            wait();
        }
        queue.add(item);
        notifyAll();
    }

    public synchronized int dequeue() throws InterruptedException {
        while (queue.isEmpty()) {
            wait();
        }
        int item = queue.poll();
        notifyAll();
        return item;
    }

    public static void main(String[] args) throws Exception {
        BlockingQueue bq = new BlockingQueue(2);
        bq.enqueue(10);
        bq.enqueue(20);
        System.out.println(bq.dequeue());
        bq.enqueue(30);
        System.out.println(bq.dequeue());
    }
}`,
      testCases: [
        {
          id: "tc-java-1",
          input: "enqueue(10), enqueue(20), dequeue(), enqueue(30), dequeue()",
          expectedOutput: "10\n20",
          description: "FIFO ordering with bounded buffer",
        },
        {
          id: "tc-java-2",
          input: "enqueue(5), dequeue()",
          expectedOutput: "5",
          description: "Single element buffer test",
        },
        {
          id: "tc-java-3",
          input: "enqueue(100), enqueue(200), dequeue(), dequeue()",
          expectedOutput: "100\n200",
          description: "Full dequeue test",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "java-s3-q1",
        question: "What is Generic Type Erasure in Java and what is its runtime consequence?",
        options: [
          "Generics are preserved as full types in the bytecode",
          "The compiler removes all generic type parameter information during compilation, replacing them with raw types/bounds, preventing new T() or instanceof T checks at runtime",
          "Generics cause memory leaks in Metaspace",
          "Type erasure only applies to interfaces",
        ],
        correctIndex: 1,
        explanation: "Java implements generics via type erasure for backward compatibility with pre-Java 5 bytecode. At runtime, List<String> and List<Integer> share the exact same bytecode class (List).",
        difficulty: "Hard",
      },
      {
        id: "java-s3-q2",
        question: "In the JVM memory model, where are Class metadata, Method bytecode, and Static primitive fields stored in Java 8+?",
        options: [
          "Permanent Generation (PermGen) inside JVM heap",
          "Metaspace (native off-heap memory) and static variables on the Heap",
          "CPU L1 Cache only",
          "Stack frame exclusively",
        ],
        correctIndex: 1,
        explanation: "Java 8 completely removed PermGen and replaced it with Metaspace in native memory for class metadata, while static variables and interned strings were moved to the Java Heap.",
        difficulty: "Hard",
      },
      {
        id: "java-s3-q3",
        question: "What is the difference between CompletableFuture.supplyAsync() and ForkJoinPool.commonPool()?",
        options: [
          "supplyAsync defaults to executing asynchronous tasks on ForkJoinPool.commonPool unless a custom Executor is explicitly passed",
          "supplyAsync creates an unmanaged OS thread for each call",
          "ForkJoinPool cannot handle return values",
          "They belong to different Java programming languages",
        ],
        correctIndex: 0,
        explanation: "By default, CompletableFuture uses ForkJoinPool.commonPool() for asynchronous stage execution, which scales based on available CPU cores.",
        difficulty: "Hard",
      },
      {
        id: "java-s3-q4",
        question: "How does the Z Garbage Collector (ZGC) achieve sub-millisecond maximum pause times on multi-terabyte heaps?",
        options: [
          "By stopping all application threads and using GPU processing",
          "By performing concurrent marking and relocation using colored pointers and load barriers with no Stop-The-World compaction phases",
          "By disabling garbage collection entirely until JVM shutdown",
          "By storing all objects off-heap",
        ],
        correctIndex: 1,
        explanation: "ZGC achieves ultra-low pause times (< 1ms) regardless of heap size by doing all heavy work (marking, relocation, reference processing) concurrently with mutator threads using colored 64-bit pointers and hardware load barriers.",
        difficulty: "Hard",
      },
    ],
  },

  "p-5": {
    languageKey: "javascript",
    languageName: "JavaScript / TypeScript",
    targetLevel: "Advanced (Event Loop, Async, V8 Engine)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks JavaScript Hub",
        url: "https://www.geeksforgeeks.org/javascript/",
        description: "Core JS, ES6+, Promises, Async/Await, Prototypes, Event Loop & DOM / Node.js.",
      },
      codechef: {
        title: "CodeChef Learn JavaScript Track",
        url: "https://www.codechef.com/learn/javascript",
        description: "Interactive JS coding, array methods, map/filter/reduce, and algorithmic problem solving.",
      },
      hackerrank: {
        title: "HackerRank JavaScript (10 Days of JS)",
        url: "https://www.hackerrank.com/domains/tutorials/10-days-of-javascript",
        description: "Comprehensive 10-day JS challenge series, closures, bitwise operators & certifications.",
      },
      officialDocs: {
        title: "MDN Web Docs (JavaScript Guide)",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      },
    },
    subtopics: [
      "Event Loop, Call Stack, Microtasks (Promise/queueMicrotask) vs Macrotasks (setTimeout)",
      "Closures, Lexical Scoping & Execution Contexts",
      "Prototypes, Prototypal Inheritance & ES6 Class Transpilation",
      "TypeScript Type System: Generics, Conditional Types, Keyof & Mapped Types",
      "Memory Management & V8 Hidden Classes / Inline Caches",
    ],
    section1Mcqs: [
      {
        id: "js-s1-q1",
        question: "What is the execution order of the following JavaScript code snippet?",
        codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
        options: [
          "1 -> 4 -> 3 -> 2",
          "1 -> 2 -> 3 -> 4",
          "1 -> 3 -> 4 -> 2",
          "1 -> 4 -> 2 -> 3",
        ],
        correctIndex: 0,
        explanation: "Synchronous code runs first ('1', '4'). Next, the microtask queue (Promise.then '3') empties before the macrotask queue (setTimeout '2') runs.",
        difficulty: "Easy",
      },
      {
        id: "js-s1-q2",
        question: "What is a Closure in JavaScript?",
        options: [
          "A function bundled together with references to its lexical environment, allowing it to access outer variables even after the outer function has finished executing",
          "A method to close browser tabs",
          "An HTML tag closure",
          "A private class keyword",
        ],
        correctIndex: 0,
        explanation: "A closure retains access to its lexical scope (variables from enclosing functions) even when invoked outside that scope.",
        difficulty: "Easy",
      },
      {
        id: "js-s1-q3",
        question: "In TypeScript, what does the utility type Readonly<T> do?",
        options: [
          "Sets all properties of type T to readonly, making them immutable to reassignment",
          "Deletes all properties",
          "Converts all properties to optional",
          "Makes the object a frozen JSON string",
        ],
        correctIndex: 0,
        explanation: "Readonly<T> constructs a type with all properties of T marked as readonly, causing compile errors if properties are mutated.",
        difficulty: "Medium",
      },
      {
        id: "js-s1-q4",
        question: "What is the result of typeof NaN and NaN === NaN in JavaScript?",
        options: [
          "'number' and false",
          "'NaN' and true",
          "'undefined' and false",
          "'number' and true",
        ],
        correctIndex: 0,
        explanation: "In JS (IEEE 754 spec), NaN has type 'number', and NaN is the only value in JavaScript that is not equal to itself (NaN === NaN yields false).",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "js-coding-challenge",
      title: "Custom Deep Clone with Circular Reference Handling",
      difficulty: "Medium",
      problemStatement:
        "Implement a JavaScript function deepClone(obj) that deep clones nested objects, arrays, and primitive values, using a WeakMap to gracefully handle circular references without causing stack overflow.",
      inputFormat: "An arbitrary nested object with potential circular references.",
      outputFormat: "A new deep cloned object structurally equal but referencing separate memory.",
      constraints: ["Object may contain circular references", "Preserve arrays and primitives."],
      starterCode: `function deepClone(obj, map = new WeakMap()) {
    // ============================================
    // >>> WRITE YOUR CODE HERE (Start below) <<<
    // ============================================
    
    return null;
}

// Verification
const original = { a: 1, b: { c: 2 } };
original.self = original;
const cloned = deepClone(original);
console.log(cloned && cloned.b && cloned.b.c === 2 && cloned !== original);
`,
      solutionTemplate: `function deepClone(obj, map = new WeakMap()) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (map.has(obj)) {
        return map.get(obj);
    }
    
    const clone = Array.isArray(obj) ? [] : {};
    map.set(obj, clone);
    
    for (const key of Object.keys(obj)) {
        clone[key] = deepClone(obj[key], map);
    }
    return clone;
}

const original = { a: 1, b: { c: 2 } };
original.self = original;
const cloned = deepClone(original);
console.log(cloned.b.c === 2 && cloned !== original && cloned.self === cloned);
`,
      testCases: [
        {
          id: "tc-js-1",
          input: "{ a: 1, b: { c: 2 } }",
          expectedOutput: "true",
          description: "Deep clone with nested object independence",
        },
        {
          id: "tc-js-2",
          input: "Circular reference object",
          expectedOutput: "true",
          description: "Circular reference handled without stack overflow",
        },
        {
          id: "tc-js-3",
          input: "[1, [2, 3], { x: 10 }]",
          expectedOutput: "true",
          description: "Nested array and object combination clone",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "js-s3-q1",
        question: "How do V8 Engine Hidden Classes (Shapes) optimize object property access in JavaScript?",
        options: [
          "By creating dynamic transition trees for object layouts so inline caches (ICs) can perform direct memory offset lookups instead of dictionary hash table searches",
          "By converting all objects to C++ structs at compile time",
          "By encrypting object properties",
          "By forcing all objects into static memory arrays",
        ],
        correctIndex: 0,
        explanation: "V8 creates Hidden Classes behind the scenes. Objects with identical property insertion order share the same shape, allowing Inline Caches to read properties with a single memory offset instruction.",
        difficulty: "Hard",
      },
      {
        id: "js-s3-q2",
        question: "In TypeScript, what does the following conditional type evaluate to?",
        codeSnippet: `type IsNever<T> = [T] extends [never] ? true : false;`,
        options: [
          "true when T is never, because wrapping in a 1-tuple [T] prevents the distributive conditional type behavior from eagerly resolving never to never",
          "Always false",
          "Compile error: tuple never",
          "undefined",
        ],
        correctIndex: 0,
        explanation: "Unwrapped naked type parameters T extends never distribute over union types, causing never to resolve to never (empty). Wrapping [T] extends [never] disables distribution, correctly returning true.",
        difficulty: "Hard",
      },
      {
        id: "js-s3-q3",
        question: "What is the difference between queueMicrotask(fn) and process.nextTick(fn) in Node.js?",
        options: [
          "process.nextTick queue is processed immediately after the current operation before the microtask queue (Promise) is drained",
          "queueMicrotask runs before process.nextTick",
          "They are exact synonyms in Node.js",
          "process.nextTick executes on a separate worker thread",
        ],
        correctIndex: 0,
        explanation: "Node.js prioritizes process.nextTick queue over standard V8 microtasks. All nextTick callbacks run immediately after the current phase completes, before resolving Promises.",
        difficulty: "Hard",
      },
      {
        id: "js-s3-q4",
        question: "What happens when using SharedArrayBuffer and Atomics.wait() on the browser main UI thread?",
        options: [
          "It throws a TypeError: Atomics.wait cannot be called on the main UI thread (only permitted inside Web Workers)",
          "It freezes the browser tab indefinitely",
          "It executes smoothly in O(1) time",
          "It converts the main thread to a worker thread",
        ],
        correctIndex: 0,
        explanation: "To prevent blocking the UI render loop and user responsiveness, the Web specification forbids Atomics.wait on the main thread, throwing an error if attempted.",
        difficulty: "Hard",
      },
    ],
  },

  "p-6": {
    languageKey: "go",
    languageName: "Go (Golang)",
    targetLevel: "Intermediate to Advanced (Concurrency & Microservices)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks Go Language Tutorial",
        url: "https://www.geeksforgeeks.org/golang/",
        description: "Go basics, goroutines, channels, interfaces, structs, error handling & web servers.",
      },
      codechef: {
        title: "CodeChef Go Track",
        url: "https://www.codechef.com/practice",
        description: "Solve competitive programming problems using Go (Golang) fast compilation & execution.",
      },
      hackerrank: {
        title: "HackerRank Go Challenges",
        url: "https://www.hackerrank.com/domains",
        description: "Golang problem solving, concurrency patterns, slices, maps & structs.",
      },
      officialDocs: {
        title: "The Go Programming Language (Tour of Go)",
        url: "https://go.dev/tour/",
      },
    },
    subtopics: [
      "Goroutines & Go Runtime Scheduler (M:N GMP Model)",
      "Channels (Buffered vs Unbuffered, Select statement, Fan-in/Fan-out)",
      "Interfaces, Duck Typing & Empty Interface any",
      "Sync package (sync.Mutex, sync.RWMutex, sync.WaitGroup, sync.Once)",
      "Context Package (context.WithTimeout, context.WithCancel, Deadline)",
    ],
    section1Mcqs: [
      {
        id: "go-s1-q1",
        question: "What is the key difference between an unbuffered channel and a buffered channel in Go?",
        options: [
          "An unbuffered channel blocks the sender until a receiver is ready to receive (synchronous handshake), while a buffered channel only blocks when its buffer capacity is full",
          "Unbuffered channels can store unlimited elements",
          "Buffered channels are thread-unsafe",
          "Unbuffered channels are only used for strings",
        ],
        correctIndex: 0,
        explanation: "Unbuffered channels have capacity 0 and require both sender and receiver to be present simultaneously. Buffered channels decouple execution until the buffer is filled.",
        difficulty: "Easy",
      },
      {
        id: "go-s1-q2",
        question: "How does Go handle error management without standard try/catch exceptions?",
        options: [
          "Functions return error values as explicit multiple return values (result, err), and callers inspect if err != nil",
          "Go terminates the program immediately on any error",
          "Errors are automatically ignored",
          "Go only uses global error codes",
        ],
        correctIndex: 0,
        explanation: "Idiomatic Go treats errors as ordinary values returned explicitly from functions to be checked immediately by the caller.",
        difficulty: "Easy",
      },
      {
        id: "go-s1-q3",
        question: "What does the defer keyword do in Go?",
        options: [
          "Defers the execution of a function until the surrounding function returns, evaluated in LIFO (Last-In, First-Out) order",
          "Cancels the execution of a goroutine",
          "Executes the code asynchronously on a new thread",
          "Delays execution by 1 second",
        ],
        correctIndex: 0,
        explanation: "defer schedules function execution just before the enclosing function exits, commonly used for resource cleanup (e.g. file.Close(), mutex.Unlock()).",
        difficulty: "Medium",
      },
      {
        id: "go-s1-q4",
        question: "What is the initial stack size of a Go goroutine compared to an OS thread?",
        options: [
          "~2 KB (dynamically resizing as needed) vs 1-8 MB for an OS thread",
          "10 MB vs 1 KB",
          "Exact same size (2 MB)",
          "1 GB",
        ],
        correctIndex: 0,
        explanation: "Goroutines are ultra-lightweight user-space threads starting at only ~2 KB of contiguous stack space, enabling millions of concurrent goroutines per process.",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "go-coding-challenge",
      title: "Worker Pool Concurrency Pattern",
      difficulty: "Medium",
      problemStatement:
        "Implement a concurrent Worker Pool in Go where numWorkers process jobs from a jobs channel and send results to a results channel using sync.WaitGroup.",
      inputFormat: "Number of workers and list of job integers.",
      outputFormat: "Processed results squared.",
      constraints: ["1 <= numWorkers <= 10", "Thread safe synchronization."],
      starterCode: `package main

import (
	"fmt"
	"sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	// ============================================
	// >>> WRITE YOUR CODE HERE (Start below) <<<
	// ============================================
	
}

func main() {
	const numJobs = 5
	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)
	var wg sync.WaitGroup

	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	wg.Wait()
	close(results)

	sum := 0
	for res := range results {
		sum += res
	}
	fmt.Println(sum)
}`,
      solutionTemplate: `package main

import (
	"fmt"
	"sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		results <- j * j
	}
}

func main() {
	const numJobs = 5
	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)
	var wg sync.WaitGroup

	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	wg.Wait()
	close(results)

	sum := 0
	for res := range results {
		sum += res
	}
	fmt.Println(sum)
}`,
      testCases: [
        {
          id: "tc-go-1",
          input: "5 jobs squared",
          expectedOutput: "55",
          description: "Concurrent worker pool sum reduction",
        },
        {
          id: "tc-go-2",
          input: "3 jobs squared (1,2,3)",
          expectedOutput: "14",
          description: "Small job batch",
        },
        {
          id: "tc-go-3",
          input: "10 jobs",
          expectedOutput: "385",
          description: "10 jobs worker distribution",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "go-s3-q1",
        question: "How does Go's GMP scheduler coordinate goroutine execution?",
        options: [
          "G = Goroutine, M = OS Machine Thread, P = Processor Context (resource required to execute Go code). Each P maintains a local run queue of Gs with work-stealing from other Ps",
          "It uses a single round-robin kernel timer",
          "P stands for Process and M stands for Memory",
          "It assigns one OS thread permanently to every goroutine",
        ],
        correctIndex: 0,
        explanation: "The GMP model maps G (goroutines) to M (OS threads) via P (logical processors). Work-stealing allows idle Ps to steal half of another P's local run queue.",
        difficulty: "Hard",
      },
      {
        id: "go-s3-q2",
        question: "What happens if a goroutine reads from or writes to a nil channel?",
        options: [
          "It panics immediately with a NullPointerException",
          "The operation blocks forever",
          "It returns 0 immediately",
          "It allocates a new channel automatically",
        ],
        correctIndex: 1,
        explanation: "Reading or writing to a nil channel in Go blocks the current goroutine permanently without panicking (closing a nil channel, however, panics).",
        difficulty: "Hard",
      },
      {
        id: "go-s3-q3",
        question: "What is Escape Analysis in the Go compiler?",
        options: [
          "A security scan for shell injection",
          "A static analysis pass determining whether a variable can be safely allocated on the fast stack frame or must 'escape' to the heap GC",
          "A method to escape loops",
          "A compiler pass that handles panic recovery",
        ],
        correctIndex: 1,
        explanation: "Go's escape analysis checks if a variable is referenced outside its originating function scope. If it escapes (e.g. returning pointer to local var), it is placed on the heap.",
        difficulty: "Hard",
      },
      {
        id: "go-s3-q4",
        question: "How does the sync.Map in Go optimize read performance compared to a standard sync.RWMutex + map?",
        options: [
          "By maintaining two internal maps: a read-only atomic read map for lock-free loads and a dirty map for mutations, minimizing lock contention in write-infrequent scenarios",
          "By bypassing memory completely",
          "By running on GPU memory",
          "By compressing keys",
        ],
        correctIndex: 0,
        explanation: "sync.Map is designed for concurrent scenarios where keys are mostly read or disjointly written across threads, using an atomic pointer read cache to avoid locking on reads.",
        difficulty: "Hard",
      },
    ],
  },

  "p-7": {
    languageKey: "sql",
    languageName: "SQL & Relational Databases",
    targetLevel: "Advanced (Indexing, Query Plans, ACID & Transactions)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks SQL Tutorial",
        url: "https://www.geeksforgeeks.org/sql-tutorial/",
        description: "SQL basics, Joins, Subqueries, Window Functions, Indexing, Normalization & Query Optimization.",
      },
      codechef: {
        title: "CodeChef Learn SQL Track",
        url: "https://www.codechef.com/learn/sql",
        description: "Hands-on interactive SQL queries, filtering, aggregation, grouping, and database design.",
      },
      hackerrank: {
        title: "HackerRank SQL Practice & Certifications",
        url: "https://www.hackerrank.com/domains/sql",
        description: "Basic, intermediate and advanced SQL problems, window functions, regex joins & Gold badge.",
      },
      officialDocs: {
        title: "PostgreSQL Official Documentation",
        url: "https://www.postgresql.org/docs/",
      },
    },
    subtopics: [
      "Complex Joins (INNER, LEFT, FULL OUTER, CROSS, SELF JOIN)",
      "Window Functions (ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD)",
      "B+ Tree Indexing, Covering Indexes & EXPLAIN ANALYZE",
      "ACID Properties & Transaction Isolation Levels (Read Committed, Repeatable Read, Serializable)",
      "Database Normalization (1NF, 2NF, 3NF, BCNF) & Sharding / Partitioning",
    ],
    section1Mcqs: [
      {
        id: "sql-s1-q1",
        question: "What is the key difference between RANK() and DENSE_RANK() window functions in SQL?",
        options: [
          "RANK() leaves gaps in ranking numbers in case of tied values, while DENSE_RANK() does not leave gaps",
          "DENSE_RANK() is only for numbers",
          "RANK() is slower than DENSE_RANK()",
          "They are identical",
        ],
        correctIndex: 0,
        explanation: "If two rows tie for rank 1, RANK() assigns the next row rank 3 (gap of 2), whereas DENSE_RANK() assigns the next row rank 2.",
        difficulty: "Easy",
      },
      {
        id: "sql-s1-q2",
        question: "What is the difference between WHERE and HAVING clauses in SQL?",
        options: [
          "WHERE filters individual rows before grouping occurs, while HAVING filters aggregated group results after GROUP BY",
          "HAVING filters individual rows before aggregation",
          "WHERE only works with numbers",
          "They can be used interchangeably in all queries",
        ],
        correctIndex: 0,
        explanation: "WHERE applies row-level filters before aggregation, whereas HAVING evaluates conditions on aggregated expressions (like COUNT, SUM) post-grouping.",
        difficulty: "Easy",
      },
      {
        id: "sql-s1-q3",
        question: "What is a Covering Index in SQL databases?",
        options: [
          "An index that includes all columns referenced in the query (SELECT, WHERE, JOIN), allowing the database engine to satisfy the query entirely from the index without reading table pages",
          "An index covering all tables in a schema",
          "A backup copy of the primary key",
          "A full table lock index",
        ],
        correctIndex: 0,
        explanation: "A covering index (Index-Only Scan) contains all required fields, eliminating costly random I/O heap table lookups.",
        difficulty: "Medium",
      },
      {
        id: "sql-s1-q4",
        question: "Which transaction anomaly is prevented by the REPEATABLE READ isolation level?",
        options: [
          "Non-repeatable reads (re-reading the same row within a transaction returns identical data even if another transaction committed changes)",
          "Phantom reads in standard ANSI SQL",
          "Hardware disk failure",
          "Network timeout",
        ],
        correctIndex: 0,
        explanation: "Repeatable Read guarantees that any row read by a transaction will remain consistent throughout that transaction, preventing non-repeatable read anomalies.",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "sql-coding-challenge",
      title: "Second Highest Salary & Department Top Earners",
      difficulty: "Medium",
      problemStatement:
        "Write a SQL query using DENSE_RANK() or subqueries to find the second highest salary from an Employee table. If there is no second highest salary, return NULL.",
      inputFormat: "Employee table with id and salary columns.",
      outputFormat: "Single column SecondHighestSalary.",
      constraints: ["Table may contain duplicate salaries or single row."],
      starterCode: `-- ============================================
-- >>> WRITE YOUR SQL QUERY HERE (Start below) <<<
-- ============================================

SELECT NULL AS SecondHighestSalary;`,
      solutionTemplate: `SELECT (
    SELECT DISTINCT salary 
    FROM Employee 
    ORDER BY salary DESC 
    LIMIT 1 OFFSET 1
) AS SecondHighestSalary;`,
      testCases: [
        {
          id: "tc-sql-1",
          input: "Salaries: [100, 200, 300]",
          expectedOutput: "200",
          description: "Distinct multiple salaries",
        },
        {
          id: "tc-sql-2",
          input: "Salaries: [100]",
          expectedOutput: "NULL",
          description: "Single salary returns NULL",
        },
        {
          id: "tc-sql-3",
          input: "Salaries: [500, 500, 400]",
          expectedOutput: "400",
          description: "Duplicate top salaries handled correctly",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "sql-s3-q1",
        question: "Why do relational database engines use B+ Trees instead of standard Binary Search Trees or B-Trees for disk-based indexing?",
        options: [
          "B+ Trees store data pointers only in leaf nodes (linked sequentially for range scans) and have extremely high fan-out, minimizing disk seek I/O depth to 3-4 levels for billions of rows",
          "Binary trees are not compatible with hard disks",
          "B+ Trees consume less RAM than integers",
          "B+ trees disable transactions",
        ],
        correctIndex: 0,
        explanation: "High fan-out reduces tree height to 3-4 levels for millions of keys, while sequentially linked leaf nodes make range scans (BETWEEN queries) fast linear traversals.",
        difficulty: "Hard",
      },
      {
        id: "sql-s3-q2",
        question: "What is Write-Ahead Logging (WAL) in database storage engines?",
        options: [
          "A protocol ensuring transaction log records are flushed to non-volatile disk BEFORE data pages are written, guaranteeing Durability and Atomicity in crash recovery",
          "A log of user search queries",
          "A real-time analytics dashboard",
          "A replication protocol for web sockets",
        ],
        correctIndex: 0,
        explanation: "WAL ensures any transaction changes are safely recorded sequentially in append-only log files on disk prior to modifying actual data pages in memory/disk.",
        difficulty: "Hard",
      },
      {
        id: "sql-s3-q3",
        question: "What is the difference between Optimistic Concurrency Control (OCC) and Pessimistic Locking (SELECT FOR UPDATE)?",
        options: [
          "OCC allows concurrent transactions without row locks, verifying at commit time (via version checks) that no conflicting changes occurred; Pessimistic locking acquires exclusive locks upfront",
          "OCC locks the entire database table",
          "Pessimistic locking does not support rollbacks",
          "They are identical",
        ],
        correctIndex: 0,
        explanation: "OCC assumes conflicts are rare and verifies row version timestamps on commit, whereas Pessimistic locking immediately locks rows to block other writers.",
        difficulty: "Hard",
      },
      {
        id: "sql-s3-q4",
        question: "In PostgreSQL or MySQL MVCC (Multi-Version Concurrency Control), what happens when a row is updated?",
        options: [
          "A new row version is inserted with updated transaction metadata (xmin/xmax), while the old row version remains for active transactions reading historical snapshots",
          "The row is overwritten in-place immediately, corrupting concurrent readers",
          "The whole table is duplicated",
          "A database restart is triggered",
        ],
        correctIndex: 0,
        explanation: "MVCC writes a new version of the tuple without locking readers. Readers see a snapshot matching their transaction start timestamp, avoiding read-write locking contention.",
        difficulty: "Hard",
      },
    ],
  },

  "p-8": {
    languageKey: "oop",
    languageName: "Object-Oriented Programming (OOP)",
    targetLevel: "Excellent (SOLID, Design Architecture & Polymorphism)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks OOP Principles Hub",
        url: "https://www.geeksforgeeks.org/object-oriented-programming-in-cpp/",
        description: "Encapsulation, Abstraction, Inheritance, Polymorphism, SOLID principles & system modeling.",
      },
      codechef: {
        title: "CodeChef OOP Learning Track",
        url: "https://www.codechef.com/practice",
        description: "Practical Object-Oriented design challenges, classes, methods & inheritance hierarchy.",
      },
      hackerrank: {
        title: "HackerRank Object-Oriented Domain",
        url: "https://www.hackerrank.com/domains/java",
        description: "Polymorphism, abstract classes, interface inheritance & class hierarchies.",
      },
      officialDocs: {
        title: "Clean Code & Architecture Reference",
        url: "https://refactoring.guru/design-patterns",
      },
    },
    subtopics: [
      "4 Pillars: Encapsulation, Abstraction, Inheritance, Polymorphism",
      "SOLID Principles (Single Responsibility, Open-Closed, Liskov, Interface Segregation, Dependency Inversion)",
      "Composition over Inheritance Paradigm",
      "Abstract Classes vs Interfaces & Multiple Inheritance",
      "Object Lifetime, Deep vs Shallow Copy & Immutability",
    ],
    section1Mcqs: [
      {
        id: "oop-s1-q1",
        question: "What does the Liskov Substitution Principle (LSP) in SOLID design dictate?",
        options: [
          "Subtypes must be substitutable for their base types without altering the correctness or expected behavior of the program",
          "Classes should only have one method",
          "Objects must be saved to a database",
          "Interfaces should inherit all parent methods",
        ],
        correctIndex: 0,
        explanation: "LSP states that derived classes must extend base class behavior without violating pre-conditions, post-conditions, or invariants expected by clients of the base class.",
        difficulty: "Easy",
      },
      {
        id: "oop-s1-q2",
        question: "What is the key difference between Compile-time (Static) Polymorphism and Runtime (Dynamic) Polymorphism?",
        options: [
          "Compile-time polymorphism is achieved via method overloading and templates; runtime polymorphism is achieved via method overriding with virtual functions / interfaces",
          "Compile-time polymorphism happens only in Python",
          "Runtime polymorphism has zero overhead",
          "They cannot be used in the same program",
        ],
        correctIndex: 0,
        explanation: "Static polymorphism resolves calls at compile time (overloading). Dynamic polymorphism uses vtables to dispatch overridden virtual methods at runtime.",
        difficulty: "Easy",
      },
      {
        id: "oop-s1-q3",
        question: "Why is 'Composition over Inheritance' generally favored in modern software architecture?",
        options: [
          "Composition provides loose coupling, allows runtime behavioral swapping, and avoids fragile base class hierarchies",
          "Inheritance is completely forbidden in modern compilers",
          "Composition uses less memory than inheritance always",
          "Inheritance cannot have methods",
        ],
        correctIndex: 0,
        explanation: "Inheritance creates tight compile-time coupling. Composition (has-a) allows swapping implementations dynamically and avoids inheriting unwanted parent behaviors.",
        difficulty: "Medium",
      },
      {
        id: "oop-s1-q4",
        question: "What is the Dependency Inversion Principle (DIP)?",
        options: [
          "High-level modules should not depend on low-level modules; both should depend on abstractions (interfaces)",
          "All dependencies must be global variables",
          "Classes should not have dependencies",
          "Constructors should create concrete instances internally",
        ],
        correctIndex: 0,
        explanation: "DIP decouples high-level policy logic from concrete low-level implementation details by introducing interfaces that both layers adhere to.",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "oop-coding-challenge",
      title: "Clean Parking Lot / Payment Strategy System (SOLID)",
      difficulty: "Medium",
      problemStatement:
        "Implement a flexible Payment Processing system adhering to the Open-Closed Principle (OCP) and Strategy Pattern with PaymentStrategy interface and concrete implementations (CreditCardPayment, UpiPayment).",
      inputFormat: "Payment method selection and amount.",
      outputFormat: "Formatted transaction status string.",
      constraints: ["Extendable without modifying core processor."],
      starterCode: `interface PaymentStrategy {
    pay(amount: number): string;
}

class UpiPayment implements PaymentStrategy {
    constructor(private vpa: string) {}
    pay(amount: number): string {
        return \`Processed ₹\${amount} via UPI ID \${this.vpa}\`;
    }
}

class CreditCardPayment implements PaymentStrategy {
    constructor(private cardNumber: string) {}
    pay(amount: number): string {
        return \`Processed ₹\${amount} via Card ending in \${this.cardNumber.slice(-4)}\`;
    }
}

class CheckoutService {
    constructor(private strategy: PaymentStrategy) {}
    setStrategy(strategy: PaymentStrategy) {
        this.strategy = strategy;
    }
    checkout(amount: number): string {
        return this.strategy.pay(amount);
    }
}

const checkout = new CheckoutService(new UpiPayment("student@okaxis"));
console.log(checkout.checkout(5000));
`,
      solutionTemplate: `interface PaymentStrategy {
    pay(amount: number): string;
}

class UpiPayment implements PaymentStrategy {
    constructor(private vpa: string) {}
    pay(amount: number): string {
        return \`Processed ₹\${amount} via UPI ID \${this.vpa}\`;
    }
}

const checkout = new UpiPayment("student@okaxis");
console.log(checkout.pay(5000));
`,
      testCases: [
        {
          id: "tc-oop-1",
          input: "UPI: 5000",
          expectedOutput: "Processed ₹5000 via UPI ID student@okaxis",
          description: "Strategy dispatch test",
        },
        {
          id: "tc-oop-2",
          input: "Card: 1234-5678-9876-4321, 2500",
          expectedOutput: "Processed ₹2500 via Card ending in 4321",
          description: "Credit card strategy test",
        },
        {
          id: "tc-oop-3",
          input: "Zero amount test",
          expectedOutput: "Processed ₹0 via UPI ID student@okaxis",
          description: "Edge case handling",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "oop-s3-q1",
        question: "How does the Virtual Method Table (vtable) and Virtual Table Pointer (vptr) work under the hood in C++ / Java?",
        options: [
          "Every polymorphic class has a static vtable containing function pointers to virtual methods; each object instance stores a hidden vptr pointing to this table for dynamic dispatch",
          "The CPU compiles a new class for every method call",
          "Virtual functions are executed in the browser sandbox",
          "vtables are stored inside database indexes",
        ],
        correctIndex: 0,
        explanation: "When a virtual method is called via a base pointer, the program dereferences the object's vptr to access the class vtable and invokes the function pointer at the fixed method offset.",
        difficulty: "Hard",
      },
      {
        id: "oop-s3-q2",
        question: "What is the Diamond Problem in multiple inheritance and how do languages like C++ resolve it?",
        options: [
          "Ambiguity when a class inherits from two classes that both inherit from a common ancestor. Resolved in C++ using virtual base inheritance (class B : virtual public A)",
          "A memory encryption algorithm",
          "A design flaw that prevents classes from compiling in all languages",
          "A garbage collection cycle",
        ],
        correctIndex: 0,
        explanation: "Virtual inheritance ensures only a single shared instance of the root base class subobject is created in the most derived class, resolving duplicate member ambiguity.",
        difficulty: "Hard",
      },
      {
        id: "oop-s3-q3",
        question: "What is the key violation in this code regarding the Interface Segregation Principle (ISP)?",
        codeSnippet: `interface Worker {
    void work();
    void eat();
    void sleep();
}
class RobotWorker implements Worker { ... }`,
        options: [
          "RobotWorker is forced to implement eat() and sleep() methods which are irrelevant to it, violating ISP",
          "Interfaces cannot have more than 2 methods",
          "RobotWorker must be declared abstract",
          "Method names are too short",
        ],
        correctIndex: 0,
        explanation: "ISP states clients should not be forced to depend on methods they do not use. The fat interface should be split into smaller focused interfaces (Workable, Feedable).",
        difficulty: "Hard",
      },
      {
        id: "oop-s3-q4",
        question: "How does the Prototype Pattern solve performance bottlenecks when object instantiation is computationally expensive?",
        options: [
          "By cloning an existing pre-initialized prototype instance (e.g. via byte-copy or deep clone) instead of performing expensive database lookups or calculations in constructors",
          "By compiling to WebAssembly",
          "By disabling garbage collection",
          "By using multithreading for variable declaration",
        ],
        correctIndex: 0,
        explanation: "The Prototype pattern creates new objects by cloning a prototype instance, bypassing expensive initialization routines or network/database constructor overhead.",
        difficulty: "Hard",
      },
    ],
  },

  "p-9": {
    languageKey: "design-patterns",
    languageName: "Design Patterns & Low-Level Design (LLD)",
    targetLevel: "Working Knowledge to Advanced (Gang of Four & Distributed)",
    durationMinutes: 25,
    passingScore: 70,
    learningLinks: {
      gfg: {
        title: "GeeksforGeeks Software Design Patterns",
        url: "https://www.geeksforgeeks.org/software-design-patterns/",
        description: "Creational, Structural, Behavioral design patterns, UML diagrams, LLD interview problems.",
      },
      codechef: {
        title: "CodeChef System Design & LLD",
        url: "https://www.codechef.com/practice",
        description: "Practice object-oriented design and clean architectural coding challenges.",
      },
      hackerrank: {
        title: "HackerRank Design Pattern Track",
        url: "https://www.hackerrank.com/domains",
        description: "Factory, Singleton, Observer, Decorator pattern implementation exercises.",
      },
      officialDocs: {
        title: "Refactoring.Guru Design Patterns Catalog",
        url: "https://refactoring.guru/design-patterns/catalog",
      },
    },
    subtopics: [
      "Creational Patterns (Singleton, Factory Method, Abstract Factory, Builder, Prototype)",
      "Structural Patterns (Adapter, Decorator, Facade, Composite, Proxy)",
      "Behavioral Patterns (Observer, Strategy, Command, Iterator, State)",
      "Distributed Patterns (Circuit Breaker, Saga, CQRS, Event Sourcing)",
      "Low-Level Design (LLD) for Rate Limiter, Parking Lot, Elevator & Cache",
    ],
    section1Mcqs: [
      {
        id: "dp-s1-q1",
        question: "Which design pattern provides a unified simplified interface to a complex subsystem of classes?",
        options: ["Facade Pattern", "Singleton Pattern", "Observer Pattern", "Strategy Pattern"],
        correctIndex: 0,
        explanation: "The Facade pattern defines a higher-level interface that makes the complex underlying subsystem easier to use.",
        difficulty: "Easy",
      },
      {
        id: "dp-s1-q2",
        question: "Which pattern is used to attach additional responsibilities to an object dynamically without modifying the original class?",
        options: ["Decorator Pattern", "Singleton Pattern", "Factory Pattern", "Adapter Pattern"],
        correctIndex: 0,
        explanation: "The Decorator pattern wraps an existing object to add new behaviors dynamically at runtime, adhering to the Open-Closed Principle.",
        difficulty: "Easy",
      },
      {
        id: "dp-s1-q3",
        question: "In the Observer Pattern, what is the role of the Subject?",
        options: [
          "It maintains a list of observers and notifies them automatically of any state changes by calling their update methods",
          "It encrypts observer data",
          "It deletes observers when memory is low",
          "It creates database connections",
        ],
        correctIndex: 0,
        explanation: "The Subject maintains observer references and broadcasts state changes to all attached observers via an update notification.",
        difficulty: "Medium",
      },
      {
        id: "dp-s1-q4",
        question: "What is the main benefit of the Builder Pattern over telescoping constructors?",
        options: [
          "It provides a step-by-step fluent API for constructing complex objects with multiple optional parameters, avoiding confusing long constructor argument lists",
          "It makes the object run faster",
          "It compiles to machine code",
          "It requires zero memory",
        ],
        correctIndex: 0,
        explanation: "The Builder pattern avoids telescoping constructors (where constructors take 10+ params with many nulls) by allowing readable step-by-step chained construction.",
        difficulty: "Medium",
      },
    ],
    section2Coding: {
      id: "dp-coding-challenge",
      title: "Thread-Safe Lazy Double-Checked Locking Singleton",
      difficulty: "Medium",
      problemStatement:
        "Implement a thread-safe Lazy Singleton pattern with double-checked locking in Java/TypeScript/C++ that ensures only one instance is ever created across concurrent threads.",
      inputFormat: "Multiple concurrent requests for getInstance().",
      outputFormat: "Verified identical memory reference for all calls.",
      constraints: ["Thread safe with volatile modifier or atomic operations."],
      starterCode: `public class DatabaseConnectionPool {
    private static volatile DatabaseConnectionPool instance;
    private String connectionUrl;

    private DatabaseConnectionPool() {
        this.connectionUrl = "jdbc:postgresql://db.superdream.internal:5432/main";
    }

    public static DatabaseConnectionPool getInstance() {
        if (instance == null) {
            synchronized (DatabaseConnectionPool.class) {
                if (instance == null) {
                    instance = new DatabaseConnectionPool();
                }
            }
        }
        return instance;
    }

    public String getConnectionUrl() {
        return connectionUrl;
    }

    public static void main(String[] args) {
        DatabaseConnectionPool pool1 = DatabaseConnectionPool.getInstance();
        DatabaseConnectionPool pool2 = DatabaseConnectionPool.getInstance();
        System.out.println(pool1 == pool2); // true
    }
}`,
      solutionTemplate: `public class DatabaseConnectionPool {
    private static volatile DatabaseConnectionPool instance;
    private DatabaseConnectionPool() {}

    public static DatabaseConnectionPool getInstance() {
        if (instance == null) {
            synchronized (DatabaseConnectionPool.class) {
                if (instance == null) {
                    instance = new DatabaseConnectionPool();
                }
            }
        }
        return instance;
    }

    public static void main(String[] args) {
        DatabaseConnectionPool p1 = DatabaseConnectionPool.getInstance();
        DatabaseConnectionPool p2 = DatabaseConnectionPool.getInstance();
        System.out.println(p1 == p2);
    }
}`,
      testCases: [
        {
          id: "tc-dp-1",
          input: "getInstance() == getInstance()",
          expectedOutput: "true",
          description: "Singleton identity verification",
        },
        {
          id: "tc-dp-2",
          input: "Multi-threaded concurrency check",
          expectedOutput: "true",
          description: "Thread safety without multiple instances",
        },
        {
          id: "tc-dp-3",
          input: "State preservation across calls",
          expectedOutput: "true",
          description: "Connection pool state consistency",
          isHidden: true,
        },
      ],
    },
    section3Mcqs: [
      {
        id: "dp-s3-q1",
        question: "Why is the volatile keyword mandatory in double-checked locking Singleton implementations in Java/C++?",
        options: [
          "To prevent compiler instruction reordering where memory is allocated and assigned to instance BEFORE constructor initialization completes, which would allow another thread to see a partially initialized object",
          "Because volatile locks the CPU bus during method execution",
          "To make the class serializable",
          "Volatile is optional and has no effect on double-checked locking",
        ],
        correctIndex: 0,
        explanation: "Without volatile, the JVM may reorder instance = new Singleton() (allocate memory -> assign pointer -> call constructor), allowing another thread checking instance != null to return an incomplete, broken object.",
        difficulty: "Hard",
      },
      {
        id: "dp-s3-q2",
        question: "In distributed microservices, how does the Saga Pattern manage distributed transactions across multiple independent databases?",
        options: [
          "By executing a sequence of local transactions with corresponding compensating rollback transactions in case of failure (either Orchestrated or Choreographed)",
          "By using two-phase commit locks across all databases forever",
          "By merging all databases into one single table",
          "By ignoring failed transactions",
        ],
        correctIndex: 0,
        explanation: "Sagas replace blocking 2PC distributed transactions by running local ACID transactions. If a step fails, compensating transactions are triggered in reverse order to restore eventual consistency.",
        difficulty: "Hard",
      },
      {
        id: "dp-s3-q3",
        question: "What is the Circuit Breaker Pattern in high-scale systems and what are its 3 primary states?",
        options: [
          "Closed (normal traffic), Open (failing rapidly without calling downstream service), and Half-Open (trial traffic to test if service has recovered)",
          "Active, Inactive, Terminated",
          "Input, Output, Error",
          "Primary, Secondary, Tertiary",
        ],
        correctIndex: 0,
        explanation: "Circuit Breakers prevent cascading failures by failing fast in Open state when an external service is down, periodically allowing test requests in Half-Open state to check recovery.",
        difficulty: "Hard",
      },
      {
        id: "dp-s3-q4",
        question: "What is the key architectural difference between CQRS (Command Query Responsibility Segregation) and traditional CRUD?",
        options: [
          "CQRS physically separates the data model and optimization pipelines for write operations (Commands) from read operations (Queries), often using separate read and write databases",
          "CQRS requires SQL only and forbids NoSQL",
          "CRUD is faster than CQRS in all distributed systems",
          "CQRS eliminates database transactions entirely",
        ],
        correctIndex: 0,
        explanation: "CQRS splits reads and writes into distinct models. Writes handle validation and domain logic, while reads use denormalized views or search indexes optimized for query throughput.",
        difficulty: "Hard",
      },
    ],
  },
};
