import type React from "react";

const BRACKET_PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
};

const QUOTE_PAIRS: Record<string, string> = {
  '"': '"',
  "'": "'",
  "`": "`",
};

const ALL_AUTO_PAIRS: Record<string, string> = {
  ...BRACKET_PAIRS,
  ...QUOTE_PAIRS,
};

const CLOSING_CHARS = new Set([")", "]", "}", '"', "'", "`"]);

/**
 * High-performance, IDE-grade keystroke handler for in-browser coding textareas.
 * Features:
 * 1. Single Tab key indents (2 or 4 spaces) without losing textarea focus. Disallows bindings like Alt+Tab / Ctrl+Tab / Win+Tab.
 * 2. Opening brackets ( [ { and quotes " ' ` automatically insert the matching closing character and place the cursor in the middle.
 * 3. Text selection wrapping: Typing an opening bracket wraps the highlighted code.
 * 4. Smart overtype: Typing a closing bracket when already in front of it skips over rather than creating a duplicate.
 * 5. Smart Enter: Pressing Enter between { } or ( ) formats newline indentation with cursor placed inside.
 * 6. Smart Backspace: Deletes both characters when cursor is inside an empty pair like ( | ) or " | ".
 */
export function handleCodeTextareaKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  _propVal: string,
  onUpdate: (newVal: string) => void,
  tabSize = 2
): boolean {
  const textarea = e.currentTarget;
  // Always use the live textarea value from the DOM to avoid stale closure state in React
  const currentVal = textarea.value;
  const selectionStart = textarea.selectionStart ?? 0;
  const selectionEnd = textarea.selectionEnd ?? 0;
  const spaces = " ".repeat(tabSize);

  // Explicitly allow native browser Undo (Ctrl+Z) and Redo (Ctrl+Y, Ctrl+Shift+Z)
  if ((e.ctrlKey || e.metaKey) && ["z", "Z", "y", "Y", "a", "A"].includes(e.key)) {
    return false;
  }

  // Helper to synchronously update textarea and notify React
  const applyChange = (nextVal: string, newCursorPos: number) => {
    textarea.value = nextVal;
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;
    onUpdate(nextVal);
  };

  // 1. Standalone Tab (disallow bindings with Tab like Alt+Tab, Ctrl+Tab, Meta+Tab)
  if (e.key === "Tab") {
    if (e.altKey || e.ctrlKey || e.metaKey) {
      // Disallow modified Tab bindings (window/tab switchers or prohibited shortcuts)
      return false;
    }

    e.preventDefault();

    if (selectionStart !== selectionEnd) {
      // Multi-line or range selection indent/unindent
      const before = currentVal.slice(0, selectionStart);
      const startLineStart = before.lastIndexOf("\n") + 1;
      const after = currentVal.slice(selectionEnd);
      const selectedBlock = currentVal.slice(startLineStart, selectionEnd);
      const lines = selectedBlock.split("\n");

      if (e.shiftKey) {
        // Unindent
        let removedCount = 0;
        const newLines = lines.map((line) => {
          if (line.startsWith(spaces)) {
            removedCount += tabSize;
            return line.slice(tabSize);
          } else if (line.startsWith(" ")) {
            removedCount += 1;
            return line.slice(1);
          }
          return line;
        });
        const replaced = newLines.join("\n");
        const nextVal = currentVal.slice(0, startLineStart) + replaced + after;
        textarea.value = nextVal;
        textarea.selectionStart = Math.max(
          startLineStart,
          selectionStart - (lines[0].startsWith(" ") ? (lines[0].startsWith(spaces) ? tabSize : 1) : 0)
        );
        textarea.selectionEnd = Math.max(textarea.selectionStart, selectionEnd - removedCount);
        onUpdate(nextVal);
      } else {
        // Indent all lines
        const newLines = lines.map((line) => spaces + line);
        const replaced = newLines.join("\n");
        const nextVal = currentVal.slice(0, startLineStart) + replaced + after;
        textarea.value = nextVal;
        textarea.selectionStart = selectionStart + tabSize;
        textarea.selectionEnd = selectionEnd + tabSize * lines.length;
        onUpdate(nextVal);
      }
    } else {
      if (e.shiftKey) {
        // Unindent current line
        const before = currentVal.slice(0, selectionStart);
        const lineStart = before.lastIndexOf("\n") + 1;
        const currentLine = currentVal.slice(lineStart);
        if (currentLine.startsWith(spaces)) {
          const nextVal = currentVal.slice(0, lineStart) + currentLine.slice(tabSize);
          applyChange(nextVal, Math.max(lineStart, selectionStart - tabSize));
        }
      } else {
        // Insert spaces at cursor
        const nextVal = currentVal.slice(0, selectionStart) + spaces + currentVal.slice(selectionEnd);
        applyChange(nextVal, selectionStart + tabSize);
      }
    }
    return true;
  }

  // 2. Auto-closing pairs & Selection wrapping
  if (ALL_AUTO_PAIRS[e.key]) {
    const opening = e.key;
    const closing = ALL_AUTO_PAIRS[e.key];

    // Case A: Text is selected -> wrap selection in pair
    if (selectionStart !== selectionEnd) {
      e.preventDefault();
      const selected = currentVal.slice(selectionStart, selectionEnd);
      const nextVal = currentVal.slice(0, selectionStart) + opening + selected + closing + currentVal.slice(selectionEnd);
      textarea.value = nextVal;
      textarea.selectionStart = selectionStart + 1;
      textarea.selectionEnd = selectionEnd + 1;
      onUpdate(nextVal);
      return true;
    }

    // Case B: Overtype closing quote if already in front of it
    if (QUOTE_PAIRS[opening] && currentVal[selectionStart] === opening) {
      e.preventDefault();
      textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      return true;
    }

    // Case C: Insert pair and place pointer right in the middle!
    e.preventDefault();
    const nextVal = currentVal.slice(0, selectionStart) + opening + closing + currentVal.slice(selectionEnd);
    applyChange(nextVal, selectionStart + 1);
    return true;
  }

  // 3. Smart Overtyping for closing bracket ) ] }
  if (CLOSING_CHARS.has(e.key) && selectionStart === selectionEnd) {
    if (currentVal[selectionStart] === e.key) {
      e.preventDefault();
      textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      return true;
    }
  }

  // 4. Smart Enter between braces or after colon/brace
  if (e.key === "Enter" && selectionStart === selectionEnd) {
    const before = currentVal.slice(0, selectionStart);
    const lineStart = before.lastIndexOf("\n") + 1;
    const currentLine = currentVal.slice(lineStart, selectionStart);
    const leadingSpaces = currentLine.match(/^\s*/)?.[0] || "";

    const charBefore = currentVal[selectionStart - 1];
    const charAfter = currentVal[selectionStart];

    // Between empty pair { | } or ( | ) or [ | ]
    if (
      (charBefore === "{" && charAfter === "}") ||
      (charBefore === "(" && charAfter === ")") ||
      (charBefore === "[" && charAfter === "]")
    ) {
      e.preventDefault();
      const innerIndent = leadingSpaces + spaces;
      const insertText = "\n" + innerIndent + "\n" + leadingSpaces;
      const nextVal = currentVal.slice(0, selectionStart) + insertText + currentVal.slice(selectionEnd);
      applyChange(nextVal, selectionStart + 1 + innerIndent.length);
      return true;
    }

    // Regular line break with auto-indent
    e.preventDefault();
    const extraIndent = /[:{[(]\s*$/.test(currentLine) ? spaces : "";
    const indentToAdd = "\n" + leadingSpaces + extraIndent;
    const nextVal = currentVal.slice(0, selectionStart) + indentToAdd + currentVal.slice(selectionEnd);
    applyChange(nextVal, selectionStart + indentToAdd.length);
    return true;
  }

  // 5. Smart Backspace between empty pairs (|) -> deletes both
  if (e.key === "Backspace" && selectionStart === selectionEnd && selectionStart > 0) {
    const charBefore = currentVal[selectionStart - 1];
    const charAfter = currentVal[selectionStart];
    if (
      (charBefore === "(" && charAfter === ")") ||
      (charBefore === "[" && charAfter === "]") ||
      (charBefore === "{" && charAfter === "}") ||
      (charBefore === '"' && charAfter === '"') ||
      (charBefore === "'" && charAfter === "'") ||
      (charBefore === "`" && charAfter === "`")
    ) {
      e.preventDefault();
      const nextVal = currentVal.slice(0, selectionStart - 1) + currentVal.slice(selectionStart + 1);
      applyChange(nextVal, selectionStart - 1);
      return true;
    }
  }

  return false;
}
