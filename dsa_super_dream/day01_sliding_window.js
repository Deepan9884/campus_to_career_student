/**
 * Day 1: Advanced Sliding Window & Two Pointers - Super Dream Suite
 * JavaScript / Node.js Engine
 */

class Day01SlidingWindow {
    // 1. Longest Substring Without Repeating Characters (LeetCode 3)
    static lengthOfLongestSubstring(s) {
        const lastSeen = new Map();
        let left = 0, maxLen = 0;
        for (let right = 0; right < s.length; right++) {
            const char = s[right];
            if (lastSeen.has(char) && lastSeen.get(char) >= left) {
                left = lastSeen.get(char) + 1;
            }
            lastSeen.set(char, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }

    // 2. Subarray Sums I (CSES 1660)
    static countSubarraysWithSum(nums, target) {
        let left = 0, sum = 0, count = 0;
        for (let right = 0; right < nums.length; right++) {
            sum += nums[right];
            while (sum > target && left <= right) {
                sum -= nums[left++];
            }
            if (sum === target) count++;
        }
        return count;
    }

    // 3. Max Consecutive Ones III (LeetCode 1004)
    static longestOnes(nums, k) {
        let left = 0, zeros = 0, maxLen = 0;
        for (let right = 0; right < nums.length; right++) {
            if (nums[right] === 0) zeros++;
            while (zeros > k) {
                if (nums[left++] === 0) zeros--;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }

    // 4. Subarrays with K Different Integers (LeetCode 992)
    static subarraysWithKDistinct(nums, k) {
        const atMostK = (target) => {
            if (target <= 0) return 0;
            const freq = new Map();
            let left = 0, total = 0;
            for (let right = 0; right < nums.length; right++) {
                freq.set(nums[right], (freq.get(nums[right]) || 0) + 1);
                while (freq.size > target) {
                    const lVal = nums[left++];
                    freq.set(lVal, freq.get(lVal) - 1);
                    if (freq.get(lVal) === 0) freq.delete(lVal);
                }
                total += (right - left + 1);
            }
            return total;
        };
        return atMostK(k) - atMostK(k - 1);
    }

    // 5. Minimum Window Substring (LeetCode 76)
    static minWindow(s, t) {
        if (!s || !t || s.length < t.length) return "";
        const targetFreq = new Map();
        for (const c of t) targetFreq.set(c, (targetFreq.get(c) || 0) + 1);

        const required = targetFreq.size;
        const windowFreq = new Map();
        let left = 0, formed = 0;
        let minLen = Infinity, startIdx = 0;

        for (let right = 0; right < s.length; right++) {
            const char = s[right];
            windowFreq.set(char, (windowFreq.get(char) || 0) + 1);
            if (targetFreq.has(char) && windowFreq.get(char) === targetFreq.get(char)) {
                formed++;
            }

            while (left <= right && formed === required) {
                if (right - left + 1 < minLen) {
                    minLen = right - left + 1;
                    startIdx = left;
                }
                const leftChar = s[left++];
                windowFreq.set(leftChar, windowFreq.get(leftChar) - 1);
                if (targetFreq.has(leftChar) && windowFreq.get(leftChar) < targetFreq.get(leftChar)) {
                    formed--;
                }
            }
        }
        return minLen === Infinity ? "" : s.substring(startIdx, startIdx + minLen);
    }

    // 6. Subarray with Elements Greater Than Threshold (LeetCode 2334)
    static validSubarraySize(nums, threshold) {
        const n = nums.length;
        const prevSmaller = new Array(n).fill(-1);
        const nextSmaller = new Array(n).fill(n);

        const stack = [];
        for (let i = 0; i < n; i++) {
            while (stack.length && nums[stack[stack.length - 1]] >= nums[i]) {
                stack.pop();
            }
            if (stack.length) prevSmaller[i] = stack[stack.length - 1];
            stack.push(i);
        }

        stack.length = 0;
        for (let i = n - 1; i >= 0; i--) {
            while (stack.length && nums[stack[stack.length - 1]] >= nums[i]) {
                stack.pop();
            }
            if (stack.length) nextSmaller[i] = stack[stack.length - 1];
            stack.push(i);
        }

        for (let i = 0; i < n; i++) {
            const k = nextSmaller[i] - prevSmaller[i] - 1;
            if (nums[i] > threshold / k) return k;
        }
        return -1;
    }

    // 7. Longest Substring with At Least K Repeating Characters (LeetCode 395)
    static longestSubstring(s, k) {
        let maxLen = 0;
        const n = s.length;

        for (let targetUnique = 1; targetUnique <= 26; targetUnique++) {
            const freq = new Array(26).fill(0);
            let left = 0, right = 0;
            let uniqueCount = 0, countAtLeastK = 0;

            while (right < n) {
                if (uniqueCount <= targetUnique) {
                    const idx = s.charCodeAt(right) - 97;
                    if (freq[idx] === 0) uniqueCount++;
                    freq[idx]++;
                    if (freq[idx] === k) countAtLeastK++;
                    right++;
                } else {
                    const idx = s.charCodeAt(left) - 97;
                    if (freq[idx] === k) countAtLeastK--;
                    freq[idx]--;
                    if (freq[idx] === 0) uniqueCount--;
                    left++;
                }

                if (uniqueCount === targetUnique && uniqueCount === countAtLeastK) {
                    maxLen = Math.max(maxLen, right - left);
                }
            }
        }
        return maxLen;
    }

    // 8. Minimize The Integer (Codeforces 1251C)
    static minimizeInteger(s) {
        const evens = [], odds = [];
        for (const c of s) {
            if (parseInt(c) % 2 === 0) evens.push(c);
            else odds.push(c);
        }

        let i = 0, j = 0;
        const result = [];
        while (i < evens.length && j < odds.length) {
            if (evens[i] < odds[j]) result.push(evens[i++]);
            else result.push(odds[j++]);
        }
        while (i < evens.length) result.push(evens[i++]);
        while (j < odds.length) result.push(odds[j++]);
        return result.join("");
    }

    // 9. Xor Sum 2 (AtCoder ABC 098 D)
    static countXorSumSubarrays(nums) {
        let curSum = 0, curXor = 0, left = 0, total = 0;
        for (let right = 0; right < nums.length; right++) {
            curSum += nums[right];
            curXor ^= nums[right];

            while (curSum !== curXor) {
                curSum -= nums[left];
                curXor ^= nums[left];
                left++;
            }
            total += (right - left + 1);
        }
        return total;
    }

    // 10. Queries about less or equal elements (Codeforces 600B)
    static countLessOrEqual(a, b) {
        const sortedA = [...a].sort((x, y) => x - y);
        const indexedB = b.map((val, idx) => ({ val, idx })).sort((x, y) => x.val - y.val);
        const ans = new Array(b.length).fill(0);

        let ptrA = 0;
        for (const { val, idx } of indexedB) {
            while (ptrA < sortedA.length && sortedA[ptrA] <= val) {
                ptrA++;
            }
            ans[idx] = ptrA;
        }
        return ans;
    }
}

// -------------------------------------------------------------
// Test Assertions Runner
// -------------------------------------------------------------
function runTests() {
    console.log("🚀 Running Super Dream Day 1 JavaScript Suite...\n");
    const tests = [
        { name: "P01 Longest Unique Substring", fn: () => Day01SlidingWindow.lengthOfLongestSubstring("abcabcbb") === 3 },
        { name: "P02 Subarray Sums Positive", fn: () => Day01SlidingWindow.countSubarraysWithSum([2, 4, 1, 2, 7], 7) === 3 },
        { name: "P03 Max Consecutive Ones III", fn: () => Day01SlidingWindow.longestOnes([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2) === 6 },
        { name: "P04 Subarrays with K Distinct", fn: () => Day01SlidingWindow.subarraysWithKDistinct([1, 2, 1, 2, 3], 2) === 7 },
        { name: "P05 Min Window Substring", fn: () => Day01SlidingWindow.minWindow("ADOBECODEBANC", "ABC") === "BANC" },
        { name: "P06 Valid Subarray Threshold", fn: () => Day01SlidingWindow.validSubarraySize([1, 3, 4, 3, 1], 6) === 3 },
        { name: "P07 Longest Substring K Repeating", fn: () => Day01SlidingWindow.longestSubstring("aaabb", 3) === 3 },
        { name: "P08 Minimize The Integer", fn: () => Day01SlidingWindow.minimizeInteger("0709") === "0079" },
        { name: "P09 Xor Sum 2", fn: () => Day01SlidingWindow.countXorSumSubarrays([2, 5, 4, 6]) === 5 },
        { name: "P10 Less or Equal Queries", fn: () => JSON.stringify(Day01SlidingWindow.countLessOrEqual([1, 3, 5, 7, 9], [6, 4, 2, 8])) === JSON.stringify([3, 2, 1, 4]) },
    ];

    let passed = 0;
    tests.forEach(({ name, fn }) => {
        try {
            if (fn()) {
                console.log(`  ✓ ${name} passed`);
                passed++;
            } else {
                console.error(`  ✗ ${name} failed`);
            }
        } catch (e) {
            console.error(`  ✗ ${name} threw error:`, e.message);
        }
    });

    console.log(`\n==========================================`);
    console.log(`Result: ${passed}/${tests.length} tests passed`);
    console.log(`Status: ${passed === tests.length ? 'ALL PASSED (10/10)' : 'FAILED'}`);
    console.log(`==========================================`);
}

runTests();
