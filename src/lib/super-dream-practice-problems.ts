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
    explanation?: string;
    isHidden?: boolean;
  }>;
}

export interface ProblemSpecData {
  desc: string;
  inputFormat: string;
  outputFormat: string;
  constraints?: string[];
  sampleInput: string;
  sampleOutput: string;
  sampleExplanation?: string;
  hiddenInput: string;
  hiddenOutput: string;
}

// Master collection of 70+ authentic, rigorous competitive programming problems with realistic standard I/O
export const REAL_WORLD_PROBLEMS: Record<string, ProblemSpecData> = {
  "Two Sum (Sorted Array Target)": {
    desc: "Given a 1-indexed sorted integer array `numbers` and an integer `target`, return the 1-indexed positions of the two numbers such that they add up to `target`. Exactly one valid solution exists. You may not use the same element twice.",
    inputFormat: "Line 1: N (array length)\nLine 2: N space-separated sorted integers\nLine 3: target integer",
    outputFormat: "Two space-separated 1-indexed indices: index1 index2",
    constraints: ["2 <= N <= 3 * 10^4", "-1000 <= numbers[i] <= 1000", "numbers is sorted in non-decreasing order"],
    sampleInput: "4\n2 7 11 15\n9",
    sampleOutput: "1 2",
    sampleExplanation: "numbers[0] + numbers[1] == 2 + 7 == 9. Their 1-indexed positions are 1 and 2.",
    hiddenInput: "3\n2 3 4\n6",
    hiddenOutput: "1 3",
  },
  "Three Sum Zero Sum Triplets": {
    desc: "Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Print each triplet on a separate line sorted in ascending order.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Each unique triplet on a new line with space-separated values.",
    constraints: ["3 <= N <= 3000", "-10^5 <= nums[i] <= 10^5"],
    sampleInput: "6\n-1 0 1 2 -1 -4",
    sampleOutput: "-1 -1 2\n-1 0 1",
    sampleExplanation: "The distinct triplets that sum to 0 are [-1, -1, 2] and [-1, 0, 1].",
    hiddenInput: "3\n0 0 0",
    hiddenOutput: "0 0 0",
  },
  "Container With Most Water": {
    desc: "You are given an integer array `height` of length n. There are n vertical lines drawn such that the two endpoints of the i-th line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water. Print the maximum amount of water a container can store.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Single integer representing the maximum water area.",
    constraints: ["2 <= N <= 10^5", "0 <= height[i] <= 10^4"],
    sampleInput: "9\n1 8 6 2 5 4 8 3 7",
    sampleOutput: "49",
    sampleExplanation: "The lines at index 1 (height 8) and index 8 (height 7) form the container: min(8, 7) * (8 - 1) = 7 * 7 = 49.",
    hiddenInput: "2\n1 1",
    hiddenOutput: "1",
  },
  "Trapping Rain Water": {
    desc: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Single integer: total units of trapped rain water.",
    constraints: ["1 <= N <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    sampleInput: "12\n0 1 0 2 1 0 1 3 2 1 2 1",
    sampleOutput: "6",
    sampleExplanation: "The elevation map traps 6 units of rainwater in total between the bars.",
    hiddenInput: "6\n4 2 0 3 2 5",
    hiddenOutput: "9",
  },
  "Remove Duplicates from Sorted Array": {
    desc: "Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. Print the number of unique elements.",
    inputFormat: "Line 1: N\nLine 2: N space-separated sorted integers",
    outputFormat: "Single integer: count of unique elements.",
    constraints: ["1 <= N <= 3 * 10^4", "-100 <= nums[i] <= 100"],
    sampleInput: "3\n1 1 2",
    sampleOutput: "2",
    sampleExplanation: "The unique elements are 1 and 2, so the count is 2.",
    hiddenInput: "10\n0 0 1 1 1 2 2 3 3 4",
    hiddenOutput: "5",
  },
  "Move Zeroes to End": {
    desc: "Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements. You must do this in-place.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "The modified array with elements separated by space.",
    constraints: ["1 <= N <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    sampleInput: "5\n0 1 0 3 12",
    sampleOutput: "1 3 12 0 0",
    sampleExplanation: "All non-zero elements [1, 3, 12] maintain their relative positions, followed by two zeroes.",
    hiddenInput: "3\n0 0 1",
    hiddenOutput: "1 0 0",
  },
  "Rotate Array by K Positions": {
    desc: "Given an integer array nums, rotate the array to the right by k steps, where k is non-negative.",
    inputFormat: "Line 1: N k (array size and shift steps)\nLine 2: N space-separated integers",
    outputFormat: "The rotated array elements separated by space.",
    constraints: ["1 <= N <= 10^5", "0 <= k <= 10^5"],
    sampleInput: "7 3\n1 2 3 4 5 6 7",
    sampleOutput: "5 6 7 1 2 3 4",
    sampleExplanation: "Rotate 1 step: [7,1,2,3,4,5,6]. Rotate 2 steps: [6,7,1,2,3,4,5]. Rotate 3 steps: [5,6,7,1,2,3,4].",
    hiddenInput: "4 2\n-1 -100 3 99",
    hiddenOutput: "3 99 -1 -100",
  },
  "Maximum Subarray Sum (Kadane's Algorithm)": {
    desc: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and print its sum.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Single integer: largest subarray sum.",
    constraints: ["1 <= N <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    sampleInput: "9\n-2 1 -3 4 -1 2 1 -5 4",
    sampleOutput: "6",
    sampleExplanation: "The subarray [4, -1, 2, 1] has the largest sum = 6.",
    hiddenInput: "5\n5 4 -1 7 8",
    hiddenOutput: "23",
  },
  "Product of Array Except Self": {
    desc: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. Solve it in O(N) without using division.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Space-separated product array.",
    constraints: ["2 <= N <= 10^5", "-30 <= nums[i] <= 30"],
    sampleInput: "4\n1 2 3 4",
    sampleOutput: "24 12 8 6",
    sampleExplanation: "Products: [2*3*4, 1*3*4, 1*2*4, 1*2*3] = [24, 12, 8, 6].",
    hiddenInput: "5\n-1 1 0 -3 3",
    hiddenOutput: "0 0 9 0 0",
  },
  "Subarray Sum Equals K": {
    desc: "Given an array of integers nums and an integer k, return the total number of continuous subarrays whose sum equals to k.",
    inputFormat: "Line 1: N k\nLine 2: N space-separated integers",
    outputFormat: "Single integer: number of subarrays.",
    constraints: ["1 <= N <= 2 * 10^4", "-1000 <= nums[i] <= 1000"],
    sampleInput: "3 2\n1 1 1",
    sampleOutput: "2",
    sampleExplanation: "Subarrays [1, 1] from index 0 to 1 and index 1 to 2 both sum to 2.",
    hiddenInput: "3 3\n1 2 3",
    hiddenOutput: "2",
  },
  "Find Peak Element in Array": {
    desc: "A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array nums, find a peak element, and print its index. If the array contains multiple peaks, print any of the peak indices.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Single integer: 0-based index of a peak element.",
    constraints: ["1 <= N <= 1000", "nums[i] != nums[i + 1] for all valid i"],
    sampleInput: "4\n1 2 3 1",
    sampleOutput: "2",
    sampleExplanation: "3 is a peak element and its index number is 2.",
    hiddenInput: "7\n1 2 1 3 5 6 4",
    hiddenOutput: "5",
  },
  "Search in Rotated Sorted Array": {
    desc: "Given the array nums after possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.",
    inputFormat: "Line 1: N target\nLine 2: N space-separated integers",
    outputFormat: "Single integer: 0-based index of target or -1.",
    constraints: ["1 <= N <= 5000", "All values of nums are unique"],
    sampleInput: "7 0\n4 5 6 7 0 1 2",
    sampleOutput: "4",
    sampleExplanation: "Target 0 is located at index 4.",
    hiddenInput: "7 3\n4 5 6 7 0 1 2",
    hiddenOutput: "-1",
  },
  "Sort Colors (Dutch National Flag)": {
    desc: "Given an array nums with n objects colored red (0), white (1), or blue (2), sort them in-place so that objects of the same color are adjacent, with colors in the order red, white, and blue (0, 1, 2).",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers (0, 1, or 2)",
    outputFormat: "Space-separated sorted colors.",
    constraints: ["1 <= N <= 300", "nums[i] is either 0, 1, or 2"],
    sampleInput: "6\n2 0 2 1 1 0",
    sampleOutput: "0 0 1 1 2 2",
    sampleExplanation: "The sorted array has all 0s, followed by 1s, followed by 2s.",
    hiddenInput: "3\n2 0 1",
    hiddenOutput: "0 1 2",
  },
  "Next Permutation": {
    desc: "A permutation of an array of integers is an arrangement of its members into a sequence or linear order. Find the next lexicographically greater permutation of numbers.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Space-separated next permutation.",
    constraints: ["1 <= N <= 100", "0 <= nums[i] <= 100"],
    sampleInput: "3\n1 2 3",
    sampleOutput: "1 3 2",
    sampleExplanation: "The next permutation of [1, 2, 3] is [1, 3, 2].",
    hiddenInput: "3\n3 2 1",
    hiddenOutput: "1 2 3",
  },
  "Longest Palindromic Substring": {
    desc: "Given a string s, return the longest palindromic substring in s.",
    inputFormat: "Line 1: string s",
    outputFormat: "The longest palindromic substring.",
    constraints: ["1 <= s.length <= 1000", "s consist of only digits and English letters"],
    sampleInput: "babad",
    sampleOutput: "bab",
    sampleExplanation: "'bab' is a valid longest palindrome ('aba' is also valid).",
    hiddenInput: "cbbd",
    hiddenOutput: "bb",
  },
  "Valid Palindrome with Alphanumeric Filter": {
    desc: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Print 'true' or 'false'.",
    inputFormat: "Line 1: input string",
    outputFormat: "'true' or 'false'",
    constraints: ["1 <= s.length <= 2 * 10^5"],
    sampleInput: "A man, a plan, a canal: Panama",
    sampleOutput: "true",
    sampleExplanation: "After filtering non-alphanumeric and lowercasing: 'amanaplanacanalpanama', which is a palindrome.",
    hiddenInput: "race a car",
    hiddenOutput: "false",
  },
  "String Compression (Run-Length Encoding)": {
    desc: "Given an array of characters, compress it in-place using the following algorithm: begin with an empty string, and for each group of consecutive repeating characters, append the character followed by the group's length.",
    inputFormat: "Line 1: string of characters",
    outputFormat: "Compressed string.",
    constraints: ["1 <= s.length <= 2000"],
    sampleInput: "aabcccccaaa",
    sampleOutput: "a2b1c5a3",
    sampleExplanation: "Two 'a's, one 'b', five 'c's, and three 'a's become 'a2b1c5a3'.",
    hiddenInput: "abcdef",
    hiddenOutput: "abcdef",
  },
  "Longest Common Prefix": {
    desc: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, print an empty line or '(empty)'.",
    inputFormat: "Line 1: N (number of strings)\nLine 2: N space-separated strings",
    outputFormat: "Longest common prefix string.",
    constraints: ["1 <= N <= 200", "0 <= words[i].length <= 200"],
    sampleInput: "3\nflower flow flight",
    sampleOutput: "fl",
    sampleExplanation: "The longest common prefix of 'flower', 'flow', and 'flight' is 'fl'.",
    hiddenInput: "3\ndog racecar car",
    hiddenOutput: "",
  },
  "Reverse Singly Linked List": {
    desc: "Given the head of a singly linked list represented as space-separated node values, reverse the list, and print the reversed list node values.",
    inputFormat: "Line 1: N (number of nodes)\nLine 2: N space-separated node values",
    outputFormat: "Space-separated reversed node values.",
    constraints: ["0 <= N <= 5000", "-5000 <= Node.val <= 5000"],
    sampleInput: "5\n1 2 3 4 5",
    sampleOutput: "5 4 3 2 1",
    sampleExplanation: "Reversing 1->2->3->4->5 yields 5->4->3->2->1.",
    hiddenInput: "2\n1 2",
    hiddenOutput: "2 1",
  },
  "Merge Two Sorted Linked Lists": {
    desc: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list and print the elements.",
    inputFormat: "Line 1: N M (lengths of list1 and list2)\nLine 2: N space-separated sorted integers (list1)\nLine 3: M space-separated sorted integers (list2)",
    outputFormat: "Space-separated merged sorted list elements.",
    constraints: ["0 <= N, M <= 50", "-100 <= Node.val <= 100"],
    sampleInput: "3 3\n1 2 4\n1 3 4",
    sampleOutput: "1 1 2 3 4 4",
    sampleExplanation: "Merging [1, 2, 4] and [1, 3, 4] in sorted order produces [1, 1, 2, 3, 4, 4].",
    hiddenInput: "0 1\n\n0",
    hiddenOutput: "0",
  },
  "Find Middle of Linked List in One Pass": {
    desc: "Given the head of a singly linked list, print the value of the middle node. If there are two middle nodes, print the second middle node.",
    inputFormat: "Line 1: N\nLine 2: N space-separated node values",
    outputFormat: "Single integer: middle node value.",
    constraints: ["1 <= N <= 100", "1 <= Node.val <= 100"],
    sampleInput: "5\n1 2 3 4 5",
    sampleOutput: "3",
    sampleExplanation: "The middle node of the list is 3.",
    hiddenInput: "6\n1 2 3 4 5 6",
    hiddenOutput: "4",
  },
  "Remove N-th Node From End of List": {
    desc: "Given the head of a linked list, remove the n-th node from the end of the list and print the remaining list elements.",
    inputFormat: "Line 1: length k (total nodes and k-th from end)\nLine 2: length space-separated node values",
    outputFormat: "Space-separated node values after removal.",
    constraints: ["1 <= length <= 30", "1 <= k <= length"],
    sampleInput: "5 2\n1 2 3 4 5",
    sampleOutput: "1 2 3 5",
    sampleExplanation: "The 2nd node from the end is 4. Removing it leaves [1, 2, 3, 5].",
    hiddenInput: "1 1\n1",
    hiddenOutput: "",
  },
  "Balanced Parentheses Evaluator": {
    desc: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets and in the correct order.",
    inputFormat: "Line 1: string of brackets",
    outputFormat: "'true' or 'false'",
    constraints: ["1 <= s.length <= 10^4"],
    sampleInput: "()[]{}",
    sampleOutput: "true",
    sampleExplanation: "All brackets open and close in matching pairs.",
    hiddenInput: "(]",
    hiddenOutput: "false",
  },
  "Min Stack with O(1) Minimum Lookup": {
    desc: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time O(1). Output the results of 'min' queries.",
    inputFormat: "Line 1: N (number of operations)\nNext N lines: commands like 'push X', 'pop', or 'min'",
    outputFormat: "Results of each 'min' query on a separate line.",
    constraints: ["1 <= N <= 3 * 10^4", "-2^31 <= val <= 2^31 - 1"],
    sampleInput: "5\npush 5\npush 2\nmin\npush 3\nmin",
    sampleOutput: "2\n2",
    sampleExplanation: "After pushing 5 and 2, min is 2. After pushing 3, min is still 2.",
    hiddenInput: "3\npush 10\npush 20\nmin",
    hiddenOutput: "10",
  },
  "Next Greater Element II (Circular Array)": {
    desc: "Given a circular integer array nums (i.e., the next element of nums[nums.length - 1] is nums[0]), return the next greater number for every element. If it doesn't exist, output -1 for this number.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Space-separated next greater elements.",
    constraints: ["1 <= N <= 10^4", "-10^9 <= nums[i] <= 10^9"],
    sampleInput: "4\n4 5 2 25",
    sampleOutput: "5 25 25 -1",
    sampleExplanation: "Next greater for 4 is 5, for 5 is 25, for 2 is 25, and 25 has no greater element (-1).",
    hiddenInput: "3\n1 2 1",
    hiddenOutput: "2 -1 2",
  },
  "Daily Temperatures (Days to Warmer)": {
    desc: "Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the i-th day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0.",
    inputFormat: "Line 1: N\nLine 2: N space-separated temperatures",
    outputFormat: "Space-separated wait days.",
    constraints: ["1 <= N <= 10^5", "30 <= temperatures[i] <= 100"],
    sampleInput: "8\n73 74 75 71 69 72 76 73",
    sampleOutput: "1 1 4 2 1 1 0 0",
    sampleExplanation: "For 73: wait 1 day (74). For 74: wait 1 day (75). For 75: wait 4 days (76).",
    hiddenInput: "4\n30 40 50 60",
    hiddenOutput: "1 1 1 0",
  },
  "Invert / Flip Binary Tree": {
    desc: "Given the root of a binary tree represented in level order, invert the tree (mirror left and right children at all nodes), and print its level order traversal.",
    inputFormat: "Line 1: N (number of nodes in level order)\nLine 2: N space-separated node values (-1 indicates null)",
    outputFormat: "Space-separated level order values of the inverted tree.",
    constraints: ["The number of nodes in the tree is in the range [0, 100]", "-100 <= Node.val <= 100"],
    sampleInput: "7\n4 2 7 1 3 6 9",
    sampleOutput: "4 7 2 9 6 3 1",
    sampleExplanation: "The tree [4,2,7,1,3,6,9] when inverted becomes [4,7,2,9,6,3,1].",
    hiddenInput: "3\n2 1 3",
    hiddenOutput: "2 3 1",
  },
  "Maximum Depth of Binary Tree": {
    desc: "Given the root of a binary tree represented in level order, return its maximum depth (the number of nodes along the longest path from the root node down to the farthest leaf node).",
    inputFormat: "Line 1: N\nLine 2: N space-separated node values (-1 indicates null)",
    outputFormat: "Single integer: maximum depth.",
    constraints: ["0 <= N <= 10^4", "-100 <= Node.val <= 100"],
    sampleInput: "7\n3 9 20 -1 -1 15 7",
    sampleOutput: "3",
    sampleExplanation: "The tree depth is 3 (root 3 -> 20 -> 15 or 7).",
    hiddenInput: "2\n1 2",
    hiddenOutput: "2",
  },
  "Validate Binary Search Tree": {
    desc: "Given the root of a binary tree, determine if it is a valid binary search tree (BST). A valid BST satisfies: left subtree values < node value < right subtree values.",
    inputFormat: "Line 1: N\nLine 2: N space-separated node values (-1 indicates null)",
    outputFormat: "'true' or 'false'",
    constraints: ["1 <= N <= 10^4"],
    sampleInput: "3\n2 1 3",
    sampleOutput: "true",
    sampleExplanation: "Left child 1 < root 2 < right child 3, so it is a valid BST.",
    hiddenInput: "5\n5 1 4 -1 -1 3 6",
    hiddenOutput: "false",
  },
  "Kth Smallest Element in a BST": {
    desc: "Given the root of a binary search tree, and an integer k, return the k-th smallest value (1-indexed) of all the values of the nodes in the tree.",
    inputFormat: "Line 1: N k (total nodes and k)\nLine 2: N space-separated node values (-1 for null)",
    outputFormat: "Single integer: k-th smallest node value.",
    constraints: ["1 <= k <= N <= 10^4", "0 <= Node.val <= 10^4"],
    sampleInput: "4 1\n3 1 4 2",
    sampleOutput: "1",
    sampleExplanation: "The elements in sorted order are [1, 2, 3, 4]. The 1st smallest is 1.",
    hiddenInput: "6 3\n5 3 6 2 4 -1 1",
    hiddenOutput: "3",
  },
  "Kth Largest Element in an Array": {
    desc: "Given an integer array nums and an integer k, return the k-th largest element in the array. Note that it is the k-th largest element in the sorted order, not the k-th distinct element.",
    inputFormat: "Line 1: N k\nLine 2: N space-separated integers",
    outputFormat: "Single integer: k-th largest element.",
    constraints: ["1 <= k <= N <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    sampleInput: "6 2\n3 2 1 5 6 4",
    sampleOutput: "5",
    sampleExplanation: "Sorted in descending order: [6, 5, 4, 3, 2, 1]. The 2nd largest is 5.",
    hiddenInput: "9 4\n3 2 3 1 2 4 5 5 6",
    hiddenOutput: "4",
  },
  "Top K Frequent Elements": {
    desc: "Given an integer array nums and an integer k, return the k most frequent elements. Print the answer sorted in descending order of frequency.",
    inputFormat: "Line 1: N k\nLine 2: N space-separated integers",
    outputFormat: "Space-separated top k frequent elements.",
    constraints: ["1 <= N <= 10^5", "k is in the range [1, the number of unique elements in the array]"],
    sampleInput: "6 2\n1 1 1 2 2 3",
    sampleOutput: "1 2",
    sampleExplanation: "1 appears 3 times, 2 appears 2 times, and 3 appears 1 time. Top 2 are 1 and 2.",
    hiddenInput: "1 1\n1",
    hiddenOutput: "1",
  },
  "Number of Connected Islands (Grid BFS)": {
    desc: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    inputFormat: "Line 1: R C (rows and columns)\nNext R lines: C space-separated characters (1 or 0)",
    outputFormat: "Single integer: count of islands.",
    constraints: ["1 <= R, C <= 300"],
    sampleInput: "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
    sampleOutput: "1",
    sampleExplanation: "All 1s connect into a single contiguous island.",
    hiddenInput: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
    hiddenOutput: "3",
  },
  "Course Schedule Topological Order": {
    desc: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return 'true' if you can finish all courses, or 'false' otherwise.",
    inputFormat: "Line 1: numCourses numPrerequisites\nNext numPrerequisites lines: u v (course u requires v)",
    outputFormat: "'true' or 'false'",
    constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= 5000"],
    sampleInput: "2 1\n1 0",
    sampleOutput: "true",
    sampleExplanation: "Take course 0 first, then take course 1. No cycle exists.",
    hiddenInput: "2 2\n1 0\n0 1",
    hiddenOutput: "false",
  },
  "Rotting Oranges Multi-Source BFS": {
    desc: "You are given an m x n grid where each cell has: 0 (empty), 1 (fresh orange), 2 (rotten orange). Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return -1.",
    inputFormat: "Line 1: R C\nNext R lines: C space-separated integers (0, 1, or 2)",
    outputFormat: "Single integer: minutes elapsed or -1.",
    constraints: ["1 <= R, C <= 10"],
    sampleInput: "3 3\n2 1 1\n1 1 0\n0 1 1",
    sampleOutput: "4",
    sampleExplanation: "In 4 minutes, all fresh oranges rot.",
    hiddenInput: "1 2\n0 2",
    hiddenOutput: "0",
  },
  "Climbing Stairs (Fibonacci DP)": {
    desc: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    inputFormat: "Line 1: single integer n",
    outputFormat: "Single integer: number of distinct ways.",
    constraints: ["1 <= n <= 45"],
    sampleInput: "3",
    sampleOutput: "3",
    sampleExplanation: "Three ways: 1. 1+1+1 step, 2. 1+2 steps, 3. 2+1 steps.",
    hiddenInput: "5",
    hiddenOutput: "8",
  },
  "House Robber (Non-Adjacent Maximum)": {
    desc: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected — they will automatically contact the police if two adjacent houses were broken into on the same night. Return the maximum amount of money you can rob tonight without alerting the police.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers (house values)",
    outputFormat: "Single integer: maximum robbery amount.",
    constraints: ["1 <= N <= 100", "0 <= nums[i] <= 400"],
    sampleInput: "4\n1 2 3 1",
    sampleOutput: "4",
    sampleExplanation: "Rob house 1 (money = 1) and house 3 (money = 3). Total = 1 + 3 = 4.",
    hiddenInput: "5\n2 7 9 3 1",
    hiddenOutput: "12",
  },
  "Coin Change Fewest Coins": {
    desc: "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
    inputFormat: "Line 1: N amount (number of coins and target amount)\nLine 2: N space-separated coin denominations",
    outputFormat: "Single integer: minimum coins or -1.",
    constraints: ["1 <= N <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
    sampleInput: "3 11\n1 2 5",
    sampleOutput: "3",
    sampleExplanation: "11 = 5 + 5 + 1 (3 coins total).",
    hiddenInput: "1 3\n2",
    hiddenOutput: "-1",
  },
  "Longest Increasing Subsequence O(N log N)": {
    desc: "Given an integer array nums, return the length of the longest strictly increasing subsequence in O(N log N) time.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Single integer: length of LIS.",
    constraints: ["1 <= N <= 2500", "-10^4 <= nums[i] <= 10^4"],
    sampleInput: "8\n10 9 2 5 3 7 101 18",
    sampleOutput: "4",
    sampleExplanation: "The longest increasing subsequence is [2, 3, 7, 101], therefore the length is 4.",
    hiddenInput: "6\n0 1 0 3 2 3",
    hiddenOutput: "4",
  },
  "0/1 Knapsack Optimal Value": {
    desc: "Given N items with their weights and values, find the maximum value that can be put in a knapsack of capacity W. Each item can be picked at most once.",
    inputFormat: "Line 1: N W (number of items and knapsack capacity)\nLine 2: N space-separated item weights\nLine 3: N space-separated item values",
    outputFormat: "Single integer: maximum profit.",
    constraints: ["1 <= N <= 1000", "1 <= W <= 1000"],
    sampleInput: "3 4\n1 2 3\n10 15 40",
    sampleOutput: "50",
    sampleExplanation: "Pick item 1 (wt 1, val 10) and item 3 (wt 3, val 40): total weight = 4 <= 4, total value = 50.",
    hiddenInput: "3 3\n4 5 1\n1 2 3",
    hiddenOutput: "3",
  },
  "Longest Common Subsequence (LCS)": {
    desc: "Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.",
    inputFormat: "Line 1: text1\nLine 2: text2",
    outputFormat: "Single integer: LCS length.",
    constraints: ["1 <= text1.length, text2.length <= 1000"],
    sampleInput: "abcde\nace",
    sampleOutput: "3",
    sampleExplanation: "The longest common subsequence is 'ace' and its length is 3.",
    hiddenInput: "abc\ndef",
    hiddenOutput: "0",
  },
  "Edit Distance (Levenshtein Distance)": {
    desc: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2 (insert, delete, replace character).",
    inputFormat: "Line 1: word1\nLine 2: word2",
    outputFormat: "Single integer: minimum edit distance.",
    constraints: ["0 <= word1.length, word2.length <= 500"],
    sampleInput: "horse\nros",
    sampleOutput: "3",
    sampleExplanation: "horse -> rorse (replace 'h' with 'r') -> rose (remove 'r') -> ros (remove 'e').",
    hiddenInput: "intention\nexecution",
    hiddenOutput: "5",
  },
  "Single Number (Element appearing once)": {
    desc: "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one in O(N) time and O(1) space using XOR.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Single integer: the unique non-repeating number.",
    constraints: ["1 <= N <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4"],
    sampleInput: "5\n4 1 2 1 2",
    sampleOutput: "4",
    sampleExplanation: "1 and 2 each appear twice. 4 appears only once.",
    hiddenInput: "3\n2 2 1",
    hiddenOutput: "1",
  },
  "Counting Bits from 0 to N in O(N)": {
    desc: "Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i.",
    inputFormat: "Line 1: integer n",
    outputFormat: "Space-separated counts of set bits from 0 up to n.",
    constraints: ["0 <= n <= 10^5"],
    sampleInput: "2",
    sampleOutput: "0 1 1",
    sampleExplanation: "0 --> 0 (0 ones), 1 --> 1 (1 one), 2 --> 10 (1 one).",
    hiddenInput: "5",
    hiddenOutput: "0 1 1 2 1 2",
  },
  "Pow(x, n) Fast Binary Exponentiation": {
    desc: "Implement pow(x, n), which calculates x raised to the power n (i.e., x^n) in O(log n) time.",
    inputFormat: "Line 1: x n (floating-point base and integer exponent)",
    outputFormat: "Result formatted to 5 decimal places.",
    constraints: ["-100.0 < x < 100.0", "-2^31 <= n <= 2^31 - 1"],
    sampleInput: "2.0 10",
    sampleOutput: "1024.00000",
    sampleExplanation: "2.0^10 = 1024.00000.",
    hiddenInput: "2.1 3",
    hiddenOutput: "9.26100",
  },
  "Sqrt(x) using Integer Binary Search": {
    desc: "Given a non-negative integer x, return the square root of x rounded down to the nearest integer. The returned integer should be non-negative as well.",
    inputFormat: "Line 1: integer x",
    outputFormat: "Single integer: floor(sqrt(x)).",
    constraints: ["0 <= x <= 2^31 - 1"],
    sampleInput: "8",
    sampleOutput: "2",
    sampleExplanation: "The square root of 8 is 2.82842..., and rounding down gives 2.",
    hiddenInput: "4",
    hiddenOutput: "2",
  },
  "Longest Substring Without Repeating Characters": {
    desc: "Given a string s, find the length of the longest substring without duplicate characters using sliding window.",
    inputFormat: "Line 1: string s",
    outputFormat: "Single integer: maximum substring length.",
    constraints: ["0 <= s.length <= 5 * 10^4"],
    sampleInput: "abcabcbb",
    sampleOutput: "3",
    sampleExplanation: "The answer is 'abc', with the length of 3.",
    hiddenInput: "bbbbb",
    hiddenOutput: "1",
  },
  "Sliding Window Maximum using std::deque": {
    desc: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position. Return the max sliding window.",
    inputFormat: "Line 1: N k\nLine 2: N space-separated integers",
    outputFormat: "Space-separated maximums for each sliding window.",
    constraints: ["1 <= N <= 10^5", "1 <= k <= N"],
    sampleInput: "8 3\n1 3 -1 -3 5 3 6 7",
    sampleOutput: "3 3 5 5 6 7",
    sampleExplanation: "Window [1,3,-1] -> 3; [3,-1,-3] -> 3; [-1,-3,5] -> 5; [-3,5,3] -> 5; [5,3,6] -> 6; [3,6,7] -> 7.",
    hiddenInput: "2 1\n1 -1",
    hiddenOutput: "1 -1",
  },
  "In-Place String Reversal with Pointers": {
    desc: "Reverse a given string in-place using two pointers without allocating an extra copy of the string.",
    inputFormat: "Line 1: string to reverse",
    outputFormat: "Reversed string.",
    constraints: ["1 <= length <= 10^5"],
    sampleInput: "superdream",
    sampleOutput: "maerdrepus",
    sampleExplanation: "'superdream' reversed character by character gives 'maerdrepus'.",
    hiddenInput: "easwari",
    hiddenOutput: "irawsae",
  },
  "Pointer Arithmetic Array Sum": {
    desc: "Given an array of integers, compute their total sum strictly using pointer arithmetic and standard loop traversal.",
    inputFormat: "Line 1: N\nLine 2: N space-separated integers",
    outputFormat: "Single integer: sum of all elements.",
    constraints: ["1 <= N <= 10^5"],
    sampleInput: "5\n10 20 30 40 50",
    sampleOutput: "150",
    sampleExplanation: "10 + 20 + 30 + 40 + 50 = 150.",
    hiddenInput: "3\n1 2 3",
    hiddenOutput: "6",
  },
  "Dynamic 2D Matrix Transpose": {
    desc: "Given an R x C integer matrix, compute and print its transpose (C x R matrix).",
    inputFormat: "Line 1: R C\nNext R lines: C space-separated integers",
    outputFormat: "C lines with R space-separated integers.",
    constraints: ["1 <= R, C <= 100"],
    sampleInput: "2 3\n1 2 3\n4 5 6",
    sampleOutput: "1 4\n2 5\n3 6",
    sampleExplanation: "Rows become columns: row [1,2,3] becomes column 1, row [4,5,6] becomes column 2.",
    hiddenInput: "2 2\n1 0\n0 1",
    hiddenOutput: "1 0\n0 1",
  },
  "Count Set Bits (Brian Kernighan Algorithm)": {
    desc: "Given a positive integer n, count the number of set bits (1s) in its binary representation.",
    inputFormat: "Line 1: integer n",
    outputFormat: "Single integer: number of set bits.",
    constraints: ["1 <= n <= 10^9"],
    sampleInput: "29",
    sampleOutput: "4",
    sampleExplanation: "29 in binary is 11101, which contains 4 set bits.",
    hiddenInput: "15",
    hiddenOutput: "4",
  },
  "Power of Two Check without Loops": {
    desc: "Given an integer n, return 'true' if it is a power of two. Otherwise, return 'false'. An integer n is a power of two if there exists an integer x such that n == 2^x.",
    inputFormat: "Line 1: integer n",
    outputFormat: "'true' or 'false'",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    sampleInput: "16",
    sampleOutput: "true",
    sampleExplanation: "16 is 2^4.",
    hiddenInput: "18",
    hiddenOutput: "false",
  },
  "LRU Cache Simulation": {
    desc: "Design an LRU Cache supporting put(key, value) and get(key) in O(1). Output the results of all 'get' queries separated by space (-1 if key not found).",
    inputFormat: "Line 1: capacity Q (cache capacity and query count)\nNext Q lines: 'put K V' or 'get K'",
    outputFormat: "Space-separated values returned by get operations.",
    constraints: ["1 <= capacity <= 1000", "1 <= Q <= 10^4"],
    sampleInput: "2 5\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2",
    sampleOutput: "1 -1",
    sampleExplanation: "get(1) returns 1. Putting (3,3) evicts key 2 (least recently used), so get(2) returns -1.",
    hiddenInput: "1 3\nput 1 10\nget 1\nget 2",
    hiddenOutput: "10 -1",
  },
};

// Skill-to-topic problem mapping for Section 1 Programming
const SKILL_PRIMARY_TOPICS: Record<string, string[]> = {
  "p-1": [
    "In-Place String Reversal with Pointers",
    "Pointer Arithmetic Array Sum",
    "Dynamic 2D Matrix Transpose",
    "Count Set Bits (Brian Kernighan Algorithm)",
    "Power of Two Check without Loops",
    "Single Number (Element appearing once)",
    "Reverse Singly Linked List",
    "Two Sum (Sorted Array Target)",
    "Move Zeroes to End",
    "Maximum Subarray Sum (Kadane's Algorithm)",
  ],
  "p-2": [
    "Two Sum (Sorted Array Target)",
    "Top K Frequent Elements",
    "Sliding Window Maximum using std::deque",
    "Next Greater Element II (Circular Array)",
    "Course Schedule Topological Order",
    "LRU Cache Simulation",
    "Coin Change Fewest Coins",
    "Longest Increasing Subsequence O(N log N)",
    "Find Peak Element in Array",
    "Container With Most Water",
  ],
  "p-3": [
    "Two Sum (Sorted Array Target)",
    "Longest Substring Without Repeating Characters",
    "Valid Palindrome with Alphanumeric Filter",
    "Balanced Parentheses Evaluator",
    "House Robber (Non-Adjacent Maximum)",
    "Climbing Stairs (Fibonacci DP)",
    "Product of Array Except Self",
    "Number of Connected Islands (Grid BFS)",
    "Sort Colors (Dutch National Flag)",
    "Subarray Sum Equals K",
  ],
  "p-4": [
    "Two Sum (Sorted Array Target)",
    "Merge Two Sorted Linked Lists",
    "Invert / Flip Binary Tree",
    "Maximum Depth of Binary Tree",
    "Validate Binary Search Tree",
    "0/1 Knapsack Optimal Value",
    "Daily Temperatures (Days to Warmer)",
    "Kth Largest Element in an Array",
    "Trapping Rain Water",
    "Rotate Array by K Positions",
  ],
  "p-5": [
    "Two Sum (Sorted Array Target)",
    "String Compression (Run-Length Encoding)",
    "Longest Common Prefix",
    "Valid Palindrome with Alphanumeric Filter",
    "Balanced Parentheses Evaluator",
    "Remove Duplicates from Sorted Array",
    "Climbing Stairs (Fibonacci DP)",
    "Move Zeroes to End",
    "Search in Rotated Sorted Array",
    "Longest Palindromic Substring",
  ],
  "p-6": [
    "Two Sum (Sorted Array Target)",
    "Pointer Arithmetic Array Sum",
    "Count Set Bits (Brian Kernighan Algorithm)",
    "Maximum Subarray Sum (Kadane's Algorithm)",
    "Single Number (Element appearing once)",
    "Climbing Stairs (Fibonacci DP)",
    "Product of Array Except Self",
    "Top K Frequent Elements",
  ],
  "p-7": [
    "Pointer Arithmetic Array Sum",
    "Maximum Subarray Sum (Kadane's Algorithm)",
    "Two Sum (Sorted Array Target)",
    "Top K Frequent Elements",
    "Subarray Sum Equals K",
  ],
  "p-8": [
    "LRU Cache Simulation",
    "Min Stack with O(1) Minimum Lookup",
    "Two Sum (Sorted Array Target)",
    "Validate Binary Search Tree",
  ],
  "p-9": [
    "LRU Cache Simulation",
    "Top K Frequent Elements",
    "Course Schedule Topological Order",
    "Number of Connected Islands (Grid BFS)",
  ],
};

export function getPracticeProblemsForSkill(skillId: string, languageKey: string): PracticeProblem[] {
  const primaryTitles = SKILL_PRIMARY_TOPICS[skillId] || SKILL_PRIMARY_TOPICS["p-1"];
  const allKnownKeys = Object.keys(REAL_WORLD_PROBLEMS);
  const orderedTitles = Array.from(new Set([...primaryTitles, ...allKnownKeys]));

  return orderedTitles.map((title, idx) => {
    const spec = REAL_WORLD_PROBLEMS[title] || REAL_WORLD_PROBLEMS["Two Sum (Sorted Array Target)"];
    
    // Determine difficulty
    let diff: "Easy" | "Medium" | "Hard" = "Medium";
    if (
      title.includes("Two Sum") ||
      title.includes("Move Zeroes") ||
      title.includes("Reverse String") ||
      title.includes("Valid Palindrome") ||
      title.includes("Climbing Stairs") ||
      title.includes("Single Number") ||
      title.includes("Remove Duplicates") ||
      title.includes("Count Set Bits") ||
      title.includes("Pointer Arithmetic") ||
      title.includes("Power of Two") ||
      title.includes("Sqrt(x)")
    ) {
      diff = "Easy";
    } else if (
      title.includes("Trapping Rain Water") ||
      title.includes("Sliding Window Maximum") ||
      title.includes("LRU Cache") ||
      title.includes("Edit Distance") ||
      title.includes("0/1 Knapsack")
    ) {
      diff = "Hard";
    }

    // Determine category
    let category = "Core Algorithms";
    if (title.includes("Sum") || title.includes("Zeroes") || title.includes("Array") || title.includes("Duplicates")) {
      category = "Arrays & Two Pointers";
    } else if (title.includes("String") || title.includes("Palindrome") || title.includes("Prefix")) {
      category = "Strings & Text Processing";
    } else if (title.includes("Linked List")) {
      category = "Linked Lists";
    } else if (title.includes("Stack") || title.includes("Parentheses") || title.includes("Temperatures")) {
      category = "Stacks & Queues";
    } else if (title.includes("Tree") || title.includes("BST")) {
      category = "Trees & BST";
    } else if (title.includes("Island") || title.includes("Course") || title.includes("Orange")) {
      category = "Graphs & BFS/DFS";
    } else if (title.includes("Stairs") || title.includes("Robber") || title.includes("Coin") || title.includes("Subsequence") || title.includes("Knapsack") || title.includes("Distance")) {
      category = "Dynamic Programming";
    } else if (title.includes("Bits") || title.includes("Power") || title.includes("Sqrt") || title.includes("Pow")) {
      category = "Bit Manipulation & Math";
    }

    return {
      id: `${skillId}-prob-${idx + 1}`,
      title,
      difficulty: diff,
      category,
      description: spec.desc,
      inputFormat: spec.inputFormat,
      outputFormat: spec.outputFormat,
      constraints: spec.constraints || [
        "1 <= input size <= 10^5",
        "Time limit: 2.0 seconds",
        "Memory limit: 256 MB",
      ],
      starterCodes: {
        [languageKey]: generateStarterCode(languageKey, title, spec),
      },
      testCases: [
        {
          input: spec.sampleInput,
          expectedOutput: spec.sampleOutput,
          description: `Sample Test Case 1`,
          explanation: spec.sampleExplanation || "Standard verification matching problem rules.",
        },
        {
          input: spec.hiddenInput,
          expectedOutput: spec.hiddenOutput,
          description: `Hidden Boundary Case`,
          explanation: "Boundary and edge case validation.",
          isHidden: true,
        },
      ],
    };
  });
}

function generateStarterCode(lang: string, title: string, spec: ProblemSpecData): string {
  const isStringProblem = spec.inputFormat.toLowerCase().includes("string") && !spec.inputFormat.includes("Line 2");

  switch (lang.toLowerCase()) {
    case "c":
      return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void solve() {
    // ============================================
    // >>> WRITE YOUR SOLUTION HERE <<<
    // Read from standard input and print the result
    // ============================================
    
}

int main() {
    solve();
    return 0;
}`;

    case "cpp":
      return `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

void solve() {
    // ============================================
    // >>> WRITE YOUR SOLUTION HERE <<<
    // Read from standard input (cin) and print to (cout)
    // ============================================
    
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    solve();
    return 0;
}`;

    case "python":
      if (isStringProblem) {
        return `import sys

def solve():
    # Read single line input
    s = sys.stdin.read().strip()
    if not s:
        return

    # ============================================
    # >>> WRITE YOUR SOLUTION HERE <<<
    # Process string 's' and print your result
    # ============================================
    
if __name__ == "__main__":
    solve()
`;
      }
      return `import sys

def solve():
    # Read all tokens from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return

    # ============================================
    # >>> WRITE YOUR SOLUTION HERE <<<
    # Example token access:
    # n = int(input_data[0])
    # nums = [int(x) for x in input_data[1:n+1]]
    # print(...)
    # ============================================
    
if __name__ == "__main__":
    solve()
`;

    case "java":
      return `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;

        // ============================================
        // >>> WRITE YOUR SOLUTION HERE <<<
        // Read tokens using 'sc' and print using System.out.println(...)
        // ============================================
        
    }
}`;

    case "javascript":
      return `const fs = require("fs");

function solve() {
    const input = fs.readFileSync(0, "utf-8").trim();
    if (!input) return;
    const tokens = input.split(/\\s+/);

    // ============================================
    // >>> WRITE YOUR SOLUTION HERE <<<
    // Process input and print using console.log(...)
    // ============================================
    
}

solve();
`;

    case "go":
      return `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Split(bufio.ScanWords)

	// ============================================
	// >>> WRITE YOUR CODE HERE <<<
	// Read using scanner.Scan() and print with fmt.Println
	// ============================================
}
`;

    case "sql":
      return `-- ============================================
-- >>> WRITE YOUR SQL QUERY HERE <<<
-- ============================================

SELECT * FROM SolutionTable;
`;

    default:
      return `// ============================================
// >>> WRITE YOUR CODE HERE <<<
// ============================================
`;
  }
}
