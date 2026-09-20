"""
Day 1: Advanced Sliding Window & Two Pointers - Super Dream Benchmark Suite
Automated Test Engine & Multi-Problem Implementations
"""

from collections import defaultdict
from typing import List
import unittest


# =====================================================================
# 1. LeetCode 3: Longest Substring Without Repeating Characters
# =====================================================================
class Problem01_LongestUniqueSubstring:
    @staticmethod
    def length_of_longest_substring(s: str) -> int:
        last_seen = {}
        left = 0
        max_len = 0
        
        for right, char in enumerate(s):
            if char in last_seen and last_seen[char] >= left:
                left = last_seen[char] + 1
            last_seen[char] = right
            max_len = max(max_len, right - left + 1)
            
        return max_len


# =====================================================================
# 2. CSES 1660: Subarray Sums I (Positive Integers)
# =====================================================================
class Problem02_SubarraySumsPositive:
    @staticmethod
    def count_subarrays_with_sum(nums: List[int], target: int) -> int:
        left = 0
        current_sum = 0
        count = 0
        
        for right in range(len(nums)):
            current_sum += nums[right]
            while current_sum > target and left <= right:
                current_sum -= nums[left]
                left += 1
            if current_sum == target:
                count += 1
                
        return count


# =====================================================================
# 3. LeetCode 1004: Max Consecutive Ones III
# =====================================================================
class Problem03_MaxConsecutiveOnesIII:
    @staticmethod
    def longest_ones(nums: List[int], k: int) -> int:
        left = 0
        zeros = 0
        max_len = 0
        
        for right in range(len(nums)):
            if nums[right] == 0:
                zeros += 1
            while zeros > k:
                if nums[left] == 0:
                    zeros -= 1
                left += 1
            max_len = max(max_len, right - left + 1)
            
        return max_len


# =====================================================================
# 4. LeetCode 992: Subarrays with K Different Integers (Exact K)
# =====================================================================
class Problem04_SubarraysWithKDistinct:
    @classmethod
    def subarrays_with_k_distinct(cls, nums: List[int], k: int) -> int:
        return cls._at_most_k(nums, k) - cls._at_most_k(nums, k - 1)

    @staticmethod
    def _at_most_k(nums: List[int], k: int) -> int:
        if k <= 0:
            return 0
        freq = defaultdict(int)
        left = 0
        distinct = 0
        total = 0
        
        for right, val in enumerate(nums):
            if freq[val] == 0:
                distinct += 1
            freq[val] += 1
            
            while distinct > k:
                freq[nums[left]] -= 1
                if freq[nums[left]] == 0:
                    distinct -= 1
                left += 1
                
            total += (right - left + 1)
            
        return total


# =====================================================================
# 5. LeetCode 76: Minimum Window Substring
# =====================================================================
class Problem05_MinWindowSubstring:
    @staticmethod
    def min_window(s: str, t: str) -> str:
        if not s or not t or len(s) < len(t):
            return ""
        
        target_freq = defaultdict(int)
        for char in t:
            target_freq[char] += 1
            
        required = len(target_freq)
        window_freq = defaultdict(int)
        left = 0
        formed = 0
        min_len = float('inf')
        ans_bounds = (0, 0)
        
        for right, char in enumerate(s):
            window_freq[char] += 1
            if char in target_freq and window_freq[char] == target_freq[char]:
                formed += 1
                
            while left <= right and formed == required:
                if (right - left + 1) < min_len:
                    min_len = right - left + 1
                    ans_bounds = (left, right)
                    
                left_char = s[left]
                window_freq[left_char] -= 1
                if left_char in target_freq and window_freq[left_char] < target_freq[left_char]:
                    formed -= 1
                left += 1
                
        return "" if min_len == float('inf') else s[ans_bounds[0]:ans_bounds[1] + 1]


# =====================================================================
# 6. LeetCode 2334: Subarray with Elements Greater Than Varying Threshold
# =====================================================================
class Problem06_SubarrayWithThreshold:
    @staticmethod
    def valid_subarray_size(nums: List[int], threshold: int) -> int:
        n = len(nums)
        prev_smaller = [-1] * n
        next_smaller = [n] * n
        
        stack = []
        for i in range(n):
            while stack and nums[stack[-1]] >= nums[i]:
                stack.pop()
            if stack:
                prev_smaller[i] = stack[-1]
            stack.append(i)
            
        stack.clear()
        for i in range(n - 1, -1, -1):
            while stack and nums[stack[-1]] >= nums[i]:
                stack.pop()
            if stack:
                next_smaller[i] = stack[-1]
            stack.append(i)
            
        for i in range(n):
            k = next_smaller[i] - prev_smaller[i] - 1
            if nums[i] > threshold / k:
                return k
                
        return -1


# =====================================================================
# 7. LeetCode 395: Longest Substring with At Least K Repeating Characters
# =====================================================================
class Problem07_LongestSubstringAtLeastK:
    @staticmethod
    def longest_substring(s: str, k: int) -> int:
        max_len = 0
        n = len(s)
        
        for target_unique in range(1, 27):
            freq = defaultdict(int)
            left = right = 0
            unique_count = 0
            count_at_least_k = 0
            
            while right < n:
                if unique_count <= target_unique:
                    char = s[right]
                    if freq[char] == 0:
                        unique_count += 1
                    freq[char] += 1
                    if freq[char] == k:
                        count_at_least_k += 1
                    right += 1
                else:
                    left_char = s[left]
                    if freq[left_char] == k:
                        count_at_least_k -= 1
                    freq[left_char] -= 1
                    if freq[left_char] == 0:
                        unique_count -= 1
                    left += 1
                    
                if unique_count == target_unique == count_at_least_k:
                    max_len = max(max_len, right - left)
                    
        return max_len


# =====================================================================
# 8. Codeforces 1251C: Minimize The Integer (Parity Two-Pointer Merge)
# =====================================================================
class Problem08_MinimizeTheInteger:
    @staticmethod
    def minimize_integer(s: str) -> str:
        evens = [c for c in s if int(c) % 2 == 0]
        odds = [c for c in s if int(c) % 2 != 0]
        
        i = j = 0
        result = []
        n_e, n_o = len(evens), len(odds)
        
        while i < n_e and j < n_o:
            if evens[i] < odds[j]:
                result.append(evens[i])
                i += 1
            else:
                result.append(odds[j])
                j += 1
                
        result.extend(evens[i:])
        result.extend(odds[j:])
        return "".join(result)


# =====================================================================
# 9. AtCoder ABC 098 D: Xor Sum 2 (Bitwise Invariant)
# =====================================================================
class Problem09_XorSum2:
    @staticmethod
    def count_xor_sum_subarrays(nums: List[int]) -> int:
        cur_sum = 0
        cur_xor = 0
        left = 0
        total = 0
        
        for right, val in enumerate(nums):
            cur_sum += val
            cur_xor ^= val
            
            while cur_sum != cur_xor:
                cur_sum -= nums[left]
                cur_xor ^= nums[left]
                left += 1
                
            total += (right - left + 1)
            
        return total


# =====================================================================
# 10. Codeforces 600B: Queries about less or equal elements (Two Pointers)
# =====================================================================
class Problem10_LessOrEqualQueries:
    @staticmethod
    def count_less_or_equal(a: List[int], b: List[int]) -> List[int]:
        sorted_a = sorted(a)
        indexed_b = sorted(enumerate(b), key=lambda x: x[1])
        ans = [0] * len(b)
        
        ptr_a = 0
        n_a = len(sorted_a)
        
        for original_idx, query_val in indexed_b:
            while ptr_a < n_a and sorted_a[ptr_a] <= query_val:
                ptr_a += 1
            ans[original_idx] = ptr_a
            
        return ans


# =====================================================================
# Unit Test Suite
# =====================================================================
class TestSuperDreamDay1(unittest.TestCase):
    def test_p01_longest_unique(self):
        self.assertEqual(Problem01_LongestUniqueSubstring.length_of_longest_substring("abcabcbb"), 3)
        self.assertEqual(Problem01_LongestUniqueSubstring.length_of_longest_substring("bbbbb"), 1)
        self.assertEqual(Problem01_LongestUniqueSubstring.length_of_longest_substring("pwwkew"), 3)

    def test_p02_subarray_sums_positive(self):
        self.assertEqual(Problem02_SubarraySumsPositive.count_subarrays_with_sum([2, 4, 1, 2, 7], 7), 3)
        self.assertEqual(Problem02_SubarraySumsPositive.count_subarrays_with_sum([1, 1, 1], 2), 2)

    def test_p03_max_consecutive_ones(self):
        self.assertEqual(Problem03_MaxConsecutiveOnesIII.longest_ones([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2), 6)

    def test_p04_subarrays_k_distinct(self):
        self.assertEqual(Problem04_SubarraysWithKDistinct.subarrays_with_k_distinct([1, 2, 1, 2, 3], 2), 7)
        self.assertEqual(Problem04_SubarraysWithKDistinct.subarrays_with_k_distinct([1, 2, 1, 3, 4], 3), 3)

    def test_p05_min_window_substring(self):
        self.assertEqual(Problem05_MinWindowSubstring.min_window("ADOBECODEBANC", "ABC"), "BANC")
        self.assertEqual(Problem05_MinWindowSubstring.min_window("a", "a"), "a")
        self.assertEqual(Problem05_MinWindowSubstring.min_window("a", "aa"), "")

    def test_p06_valid_subarray_threshold(self):
        self.assertEqual(Problem06_SubarrayWithThreshold.valid_subarray_size([1, 3, 4, 3, 1], 6), 3)
        self.assertEqual(Problem06_SubarrayWithThreshold.valid_subarray_size([6, 5, 6, 5, 8], 7), 5)

    def test_p07_longest_substring_k_repeating(self):
        self.assertEqual(Problem07_LongestSubstringAtLeastK.longest_substring("aaabb", 3), 3)
        self.assertEqual(Problem07_LongestSubstringAtLeastK.longest_substring("ababbc", 2), 5)

    def test_p08_minimize_the_integer(self):
        self.assertEqual(Problem08_MinimizeTheInteger.minimize_integer("0709"), "0079")
        self.assertEqual(Problem08_MinimizeTheInteger.minimize_integer("1337"), "1337")
        self.assertEqual(Problem08_MinimizeTheInteger.minimize_integer("246432"), "234642")

    def test_p09_xor_sum_2(self):
        self.assertEqual(Problem09_XorSum2.count_xor_sum_subarrays([2, 5, 4, 6]), 5)
        self.assertEqual(Problem09_XorSum2.count_xor_sum_subarrays([0, 0, 0]), 6)

    def test_p10_less_or_equal_queries(self):
        self.assertEqual(Problem10_LessOrEqualQueries.count_less_or_equal([1, 3, 5, 7, 9], [6, 4, 2, 8]), [3, 2, 1, 4])


if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSuperDreamDay1)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    print(f"\n==========================================")
    print(f"Results: {result.testsRun} tests run | Failures: {len(result.failures)} | Errors: {len(result.errors)}")
    print(f"Status: {'ALL PASSED (10/10)' if result.wasSuccessful() else 'FAILED'}")
    print(f"==========================================")
