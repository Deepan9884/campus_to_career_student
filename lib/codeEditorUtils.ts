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

export interface EditorHistoryEntry {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Enterprise-grade Undo / Redo History Manager for React-controlled code textareas.
 * Solves the issue of React controlled-component re-renders wiping browser DOM undo stack.
 */
export class EditorHistoryManager {
  private history: EditorHistoryEntry[] = [];
  private index: number = -1;
  private maxHistory: number = 200;
  private lastTypingSnapshot: number = 0;

  constructor(initialValue: string = "", selectionStart: number = 0, selectionEnd: number = 0) {
    this.push(initialValue, selectionStart, selectionEnd, true);
  }

  public push(value: string, selectionStart: number = 0, selectionEnd: number = 0, force: boolean = false) {
    const now = Date.now();

    // If typing fast (within 400ms) without special keystroke, update the latest record rather than creating 100s of 1-char frames
    if (!force && this.index >= 0 && now - this.lastTypingSnapshot < 400) {
      if (this.history[this.index]) {
        this.history[this.index].value = value;
        this.history[this.index].selectionStart = selectionStart;
        this.history[this.index].selectionEnd = selectionEnd;
        this.lastTypingSnapshot = now;
        return;
      }
    }

    // Cut off redo tree if user authored new change
    if (this.index < this.history.length - 1) {
      this.history = this.history.slice(0, this.index + 1);
    }

    // Avoid pushing duplicate identical states
    if (this.index >= 0 && this.history[this.index]?.value === value) {
      this.history[this.index].selectionStart = selectionStart;
      this.history[this.index].selectionEnd = selectionEnd;
      return;
    }

    this.history.push({ value, selectionStart, selectionEnd });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.index = this.history.length - 1;
    this.lastTypingSnapshot = now;
  }

  public undo(): EditorHistoryEntry | null {
    if (this.index > 0) {
      this.index--;
      return this.history[this.index];
    }
    return null;
  }

  public redo(): EditorHistoryEntry | null {
    if (this.index < this.history.length - 1) {
      this.index++;
      return this.history[this.index];
    }
    return null;
  }

  public canUndo(): boolean {
    return this.index > 0;
  }

  public canRedo(): boolean {
    return this.index < this.history.length - 1;
  }

  public reset(initialValue: string = "") {
    this.history = [{ value: initialValue, selectionStart: 0, selectionEnd: 0 }];
    this.index = 0;
    this.lastTypingSnapshot = Date.now();
  }
}

/**
 * Format leading indentation and tabs with subtle, professional shadow arrow markers
 * (e.g. "→   " for 4 spaces / tabs) that line up character-by-character with the monospaced textarea.
 */
export function formatIndentationGuides(line: string, isLight: boolean, tabSize: number = 4): {
  guideHtml: string;
  codeRemainder: string;
} {
  if (!line) return { guideHtml: "", codeRemainder: "" };

  const match = line.match(/^(\s+)/);
  if (!match) return { guideHtml: "", codeRemainder: line };

  const leadingWhitespace = match[1];
  const codeRemainder = line.slice(leadingWhitespace.length);
  const arrowColor = isLight ? "#94a3b8" : "#475569";
  const guideClass = "select-none pointer-events-none";

  let guideHtml = "";
  let i = 0;
  while (i < leadingWhitespace.length) {
    if (leadingWhitespace[i] === "\t") {
      guideHtml += `<span class="${guideClass}" style="color: ${arrowColor}; opacity: 0.5; font-weight: 300;">&rarr;&nbsp;&nbsp;&nbsp;</span>`;
      i += 1;
    } else if (leadingWhitespace.slice(i, i + tabSize) === " ".repeat(tabSize)) {
      guideHtml += `<span class="${guideClass}" style="color: ${arrowColor}; opacity: 0.5; font-weight: 300;">&rarr;&nbsp;&nbsp;&nbsp;</span>`;
      i += tabSize;
    } else if (leadingWhitespace.slice(i, i + 2) === "  ") {
      guideHtml += `<span class="${guideClass}" style="color: ${arrowColor}; opacity: 0.4; font-weight: 300;">&middot;&nbsp;</span>`;
      i += 2;
    } else {
      guideHtml += "&nbsp;";
      i += 1;
    }
  }

  return { guideHtml, codeRemainder };
}

/**
 * High-performance, IDE-grade keystroke handler for in-browser coding textareas.
 * Features:
 * 1. Single Tab key indents (default 4 spaces) without losing textarea focus. Disallows bindings like Alt+Tab / Ctrl+Tab / Win+Tab.
 * 2. Dedicated custom Undo (Ctrl+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z) with full cursor restoration.
 * 3. Opening brackets ( [ { and quotes " ' ` automatically insert the matching closing character and place the cursor in the middle.
 * 4. Text selection wrapping: Typing an opening bracket wraps the highlighted code.
 * 5. Smart overtype: Typing a closing bracket when already in front of it skips over rather than creating a duplicate.
 * 6. Smart Enter: Pressing Enter between { } or ( ) formats newline indentation with cursor placed inside.
 * 7. Smart Backspace: Deletes both characters when cursor is inside an empty pair like ( | ) or " | ", and unindents 4 spaces at once.
 */
export function handleCodeTextareaKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  _propVal: string,
  onUpdate: (newVal: string) => void,
  tabSize = 4,
  historyManager?: EditorHistoryManager
): boolean {
  const textarea = e.currentTarget;
  const currentVal = textarea.value;
  const selectionStart = textarea.selectionStart ?? 0;
  const selectionEnd = textarea.selectionEnd ?? 0;
  const spaces = " ".repeat(tabSize);

  // Helper to synchronously update textarea, notify React, and record history
  const applyChange = (nextVal: string, newCursorPosStart: number, newCursorPosEnd: number = newCursorPosStart) => {
    if (historyManager) {
      historyManager.push(currentVal, selectionStart, selectionEnd, true);
    }
    textarea.value = nextVal;
    textarea.selectionStart = newCursorPosStart;
    textarea.selectionEnd = newCursorPosEnd;
    onUpdate(nextVal);
    if (historyManager) {
      historyManager.push(nextVal, newCursorPosStart, newCursorPosEnd, true);
    }
  };

  // 1. Full-Featured Custom Undo (Ctrl+Z / Cmd+Z)
  if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey) {
    if (historyManager && historyManager.canUndo()) {
      e.preventDefault();
      const prev = historyManager.undo();
      if (prev) {
        textarea.value = prev.value;
        textarea.selectionStart = prev.selectionStart;
        textarea.selectionEnd = prev.selectionEnd;
        onUpdate(prev.value);
        return true;
      }
    }
    return false;
  }

  // 2. Full-Featured Custom Redo (Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z)
  if (
    (e.ctrlKey || e.metaKey) &&
    ((e.key === "y" || e.key === "Y") || ((e.key === "z" || e.key === "Z") && e.shiftKey))
  ) {
    if (historyManager && historyManager.canRedo()) {
      e.preventDefault();
      const next = historyManager.redo();
      if (next) {
        textarea.value = next.value;
        textarea.selectionStart = next.selectionStart;
        textarea.selectionEnd = next.selectionEnd;
        onUpdate(next.value);
        return true;
      }
    }
    return false;
  }

  // Explicitly allow other common shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, etc.)
  if ((e.ctrlKey || e.metaKey) && ["a", "A", "c", "C", "v", "V", "x", "X", "f", "F"].includes(e.key)) {
    return false;
  }

  // 3. Standalone Tab (disallow bindings with Tab like Alt+Tab, Ctrl+Tab, Meta+Tab)
  if (e.key === "Tab") {
    if (e.altKey || e.ctrlKey || e.metaKey) {
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
        const newStart = Math.max(
          startLineStart,
          selectionStart - (lines[0].startsWith(" ") ? (lines[0].startsWith(spaces) ? tabSize : 1) : 0)
        );
        const newEnd = Math.max(newStart, selectionEnd - removedCount);
        applyChange(nextVal, newStart, newEnd);
      } else {
        // Indent all lines
        const newLines = lines.map((line) => spaces + line);
        const replaced = newLines.join("\n");
        const nextVal = currentVal.slice(0, startLineStart) + replaced + after;
        applyChange(nextVal, selectionStart + tabSize, selectionEnd + tabSize * lines.length);
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
        } else if (currentLine.startsWith(" ")) {
          const nextVal = currentVal.slice(0, lineStart) + currentLine.slice(1);
          applyChange(nextVal, Math.max(lineStart, selectionStart - 1));
        }
      } else {
        // Insert spaces at cursor
        const nextVal = currentVal.slice(0, selectionStart) + spaces + currentVal.slice(selectionEnd);
        applyChange(nextVal, selectionStart + tabSize);
      }
    }
    return true;
  }

  // 4. Auto-closing pairs & Selection wrapping
  if (ALL_AUTO_PAIRS[e.key]) {
    const opening = e.key;
    const closing = ALL_AUTO_PAIRS[e.key];

    // Case A: Text is selected -> wrap selection in pair
    if (selectionStart !== selectionEnd) {
      e.preventDefault();
      const selected = currentVal.slice(selectionStart, selectionEnd);
      const nextVal = currentVal.slice(0, selectionStart) + opening + selected + closing + currentVal.slice(selectionEnd);
      applyChange(nextVal, selectionStart + 1, selectionEnd + 1);
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

  // 5. Smart Overtyping for closing bracket ) ] }
  if (CLOSING_CHARS.has(e.key) && selectionStart === selectionEnd) {
    if (currentVal[selectionStart] === e.key) {
      e.preventDefault();
      textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      return true;
    }
  }

  // 6. Smart Enter between braces or after colon/brace
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

  // 7. Smart Backspace between empty pairs (|) -> deletes both, or unindents tabSize spaces
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

    // Smart tabSize Backspace unindent (removes full 4 spaces if on leading whitespace)
    if (selectionStart >= tabSize) {
      const lineStart = currentVal.slice(0, selectionStart).lastIndexOf("\n") + 1;
      const textBeforeCursorOnLine = currentVal.slice(lineStart, selectionStart);
      if (
        textBeforeCursorOnLine.length >= tabSize &&
        textBeforeCursorOnLine.endsWith(spaces) &&
        /^\s+$/.test(textBeforeCursorOnLine)
      ) {
        e.preventDefault();
        const nextVal = currentVal.slice(0, selectionStart - tabSize) + currentVal.slice(selectionEnd);
        applyChange(nextVal, selectionStart - tabSize);
        return true;
      }
    }
  }

  return false;
}
