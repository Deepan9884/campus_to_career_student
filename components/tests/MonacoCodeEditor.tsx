import React, { useState, useEffect, useRef, useMemo } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Loader2, Zap, WrapText } from "lucide-react";

export interface CodeEditorControlsHandle {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  revealLine?: (line: number, column?: number) => void;
  setCursor?: (line: number, column?: number) => void;
  focus?: () => void;
  formatCode?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
}

export interface MonacoCodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  language: string;
  isLight: boolean;
  placeholder?: string;
  fontSize?: number;
  onFontSizeChange?: (newSize: number) => void;
  tabSize?: number;
  wordWrap?: "on" | "off";
  minimap?: boolean;
  showStatusBar?: boolean;
  isDragging?: boolean;
  editorRef?: React.MutableRefObject<CodeEditorControlsHandle | null>;
  errorLine?: number | null;
  errorMessage?: string | null;
  onClearErrorLine?: () => void;
  onRunCode?: () => void;
  readOnly?: boolean;
  isCopyPasteDisabled?: boolean;
  onCopyPasteBlocked?: () => void;
  className?: string;
}

/**
 * Normalizes programming language names to Monaco Editor's supported language IDs
 */
export function getMonacoLanguage(lang: string): string {
  const l = (lang || "").toLowerCase().trim();
  if (l === "c++" || l === "cpp") return "cpp";
  if (l === "c") return "c";
  if (l === "java") return "java";
  if (l === "python" || l === "py" || l === "python3") return "python";
  if (l === "javascript" || l === "js") return "javascript";
  if (l === "typescript" || l === "ts") return "typescript";
  if (l === "sql") return "sql";
  if (l === "html") return "html";
  if (l === "css") return "css";
  if (l === "json") return "json";
  return "plaintext";
}

/** Detect Safari browser (including iOS Safari & WebKit) */
function detectSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
}

/** Detect Mac OS (for shortcut hint display) */
function detectMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

/**
 * Patches Monaco's internal WhitespaceOverlay to render:
 * 1. Full-span CodeTantra-style vector arrows (──────►) across tab stops with visible stroke and arrowhead
 * 2. Clearly visible, properly sized space dots (diameter ~7px - 12px, not tiny 1px specks) aligned to lowercase letter center
 * 3. Handles both Monaco SVG overlay and font-glyph div.mwh fallback modes
 */
function patchMonacoWhitespaceOverlay(editor: any) {
  try {
    const view = editor?._modelData?.view;
    if (!view) return;

    const overlays: any[] = [];
    const visited = new Set();

    // Recursively discover any WhitespaceOverlay instance in view
    const findOverlays = (obj: any) => {
      if (!obj || typeof obj !== "object" || visited.has(obj)) return;
      visited.add(obj);
      if (typeof obj._applyRenderWhitespace === "function" || typeof obj._renderArrow === "function") {
        overlays.push(obj);
      }
      if (Array.isArray(obj)) {
        for (const item of obj) findOverlays(item);
      } else {
        for (const key of Object.keys(obj)) {
          if ((key.startsWith("_") || key === "viewParts" || key === "dynamicOverlays") && obj[key] && typeof obj[key] === "object") {
            findOverlays(obj[key]);
          }
        }
      }
    };
    findOverlays(view);

    for (const overlay of overlays) {
      // Force renderWithSVG on options if present
      if (overlay._options) {
        overlay._options.renderWithSVG = true;
      }

      const proto = Object.getPrototypeOf(overlay);
      const targets = [overlay];
      if (proto && proto !== Object.prototype) targets.push(proto);

      // Custom CodeTantra full-span vector arrow (──────►)
      const customRenderArrow = function (lineHeight: number, spaceWidth: number, left: number) {
        const model = editor?.getModel ? editor.getModel() : null;
        const tabCols = model?.getOptions ? model.getOptions().tabSize : 4;
        const totalWidth = spaceWidth * tabCols;
        const dy = Math.round(lineHeight * 0.55);
        const strokeWidth = Math.max(2.2, Math.round(spaceWidth * 0.22 * 10) / 10);
        const endX = left + totalWidth - Math.max(3, Math.round(spaceWidth * 0.2));
        const startX = left + 2;
        const arrowLen = Math.max(8.5, Math.round(spaceWidth * 0.85));
        const arrowH = Math.max(5.2, Math.round(spaceWidth * 0.5));
        const headBaseX = endX - arrowLen;

        return (
          `<line x1="${startX.toFixed(1)}" y1="${dy}" x2="${(headBaseX + 1.5).toFixed(1)}" y2="${dy}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" />` +
          `<polygon points="${endX.toFixed(1)},${dy} ${headBaseX.toFixed(1)},${(dy - arrowH).toFixed(1)} ${(headBaseX + 1.5).toFixed(1)},${dy} ${headBaseX.toFixed(1)},${(dy + arrowH).toFixed(1)}" fill="currentColor" />`
        );
      };

      const origApply = overlay._applyRenderWhitespace;
      const customApply = function (this: any, ctx: any, lineNumber: number, selections: any, lineData: any) {
        if (this._options) {
          this._options.renderWithSVG = true;
        }
        const html = origApply ? origApply.call(this, ctx, lineNumber, selections, lineData) : "";
        if (!html || typeof html !== "string") return html;

        const lineHeight = ctx.getLineHeightForLineNumber ? ctx.getLineHeightForLineNumber(lineNumber) : 26;
        const properCy = (lineHeight * 0.55).toFixed(1);
        const spaceWidth = (this._options && this._options.spaceWidth) || Math.round(lineHeight * 0.6);
        // Subtle, crisp space dot (dotR = 1.3px to 1.8px) matching CodeTantra and VS Code
        const dotR = Math.max(1.3, Math.min(1.8, Math.round(lineHeight * 0.065 * 10) / 10)).toFixed(1);

        // Branch 1: If SVG output was produced, scale the circle dots and ensure subtle opacity
        let out = html
          .replace(/(<circle\b[^>]*?\bcy=")[0-9.]+/g, `$1${properCy}`)
          .replace(/(<circle\b[^>]*?\br=")[0-9.]+/g, `$1${dotR}`)
          .replace(/(<circle\b[^>]*?)(?:\s+fill-opacity="[^"]*")?(\s*\/?>)/g, `$1 fill-opacity="0.55"$2`);

        // Branch 2: If div.mwh fallback was produced, replace glyphs with full-span SVG arrow & subtle SVG dot
        const model = editor?.getModel ? editor.getModel() : null;
        const tabCols = model?.getOptions ? model.getOptions().tabSize : 4;
        const totalWidth = spaceWidth * tabCols;
        const dy = Math.round(lineHeight * 0.55);
        const strokeWidth = Math.max(2.2, Math.round(spaceWidth * 0.22 * 10) / 10);
        const endX = totalWidth - Math.max(3, Math.round(spaceWidth * 0.2));
        const startX = 2;
        const arrowLen = Math.max(8.5, Math.round(spaceWidth * 0.85));
        const arrowH = Math.max(5.2, Math.round(spaceWidth * 0.5));
        const headBaseX = endX - arrowLen;

        const svgArrow = `<svg style="position:absolute;left:0;top:0;width:${totalWidth}px;height:${lineHeight}px;overflow:visible;pointer-events:none;" viewBox="0 0 ${totalWidth} ${lineHeight}"><line x1="${startX.toFixed(1)}" y1="${dy}" x2="${(headBaseX + 1.5).toFixed(1)}" y2="${dy}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" /><polygon points="${endX.toFixed(1)},${dy} ${headBaseX.toFixed(1)},${(dy - arrowH).toFixed(1)} ${(headBaseX + 1.5).toFixed(1)},${dy} ${headBaseX.toFixed(1)},${(dy + arrowH).toFixed(1)}" fill="currentColor" /></svg>`;

        const svgDot = `<svg style="position:absolute;left:0;top:0;width:${spaceWidth}px;height:${lineHeight}px;overflow:visible;pointer-events:none;" viewBox="0 0 ${spaceWidth} ${lineHeight}"><circle cx="${(spaceWidth / 2).toFixed(1)}" cy="${properCy}" r="${dotR}" fill="currentColor" fill-opacity="0.55" /></svg>`;

        // Replace tab arrow glyph inside div.mwh
        out = out.replace(/(<div\s+class="mwh"[^>]*>)[→\u2192\uFFEB￫](<\/div>)/g, `$1${svgArrow}$2`);
        // Replace middle dot glyph inside div.mwh
        out = out.replace(/(<div\s+class="mwh"[^>]*>)[·\u00B7\u2E31⸱](<\/div>)/g, `$1${svgDot}$2`);

        return out;
      };

      for (const target of targets) {
        target._renderArrow = customRenderArrow;
        target._applyRenderWhitespace = customApply;
      }
    }
  } catch (err) {
    console.warn("Whitespace overlay patch notice:", err);
  }
}

export function MonacoCodeEditor({
  code,
  onChange,
  language,
  isLight,
  placeholder,
  fontSize = 15,
  onFontSizeChange,
  tabSize = 4,
  wordWrap = "on",
  minimap = false,
  showStatusBar = true,
  isDragging = false,
  editorRef,
  errorLine,
  errorMessage,
  onClearErrorLine,
  onRunCode,
  readOnly = false,
  isCopyPasteDisabled = false,
  onCopyPasteBlocked,
  className = "",
}: MonacoCodeEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, selLen: 0 });
  const editorInstanceRef = useRef<any>(null);
  const monacoInstanceRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // Detect Safari and Mac once on mount (stable references)
  const isSafari = useMemo(() => detectSafari(), []);
  const isMac = useMemo(() => detectMac(), []);

  const monacoLang = getMonacoLanguage(language);
  const themeName = isLight ? "campus-light" : "campus-dark";
  const computedLineHeight = Math.max(22, Math.round(fontSize * 1.7));

  // Prevent SSR crashes in TanStack Start
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Configure Monaco custom themes before mounting
  const handleBeforeMount = (monaco: any) => {
    monaco.editor.defineTheme("campus-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "f59e0b" },
        { token: "type", foreground: "a78bfa", fontStyle: "bold" },
        { token: "class", foreground: "a78bfa", fontStyle: "bold" },
        { token: "delimiter.bracket", foreground: "67e8f9", fontStyle: "bold" },
        { token: "delimiter.parenthesis", foreground: "67e8f9", fontStyle: "bold" },
        { token: "delimiter.square", foreground: "67e8f9", fontStyle: "bold" },
        { token: "delimiter.curly", foreground: "c084fc", fontStyle: "bold" },
        { token: "delimiter.separator", foreground: "38bdf8", fontStyle: "bold" },
        { token: "delimiter", foreground: "38bdf8", fontStyle: "bold" },
        { token: "punctuation", foreground: "38bdf8", fontStyle: "bold" },
        { token: "punctuation.separator", foreground: "38bdf8", fontStyle: "bold" },
        { token: "punctuation.terminator", foreground: "38bdf8", fontStyle: "bold" },
      ],
      colors: {
        "editor.background": "#090d16",
        "editor.foreground": "#f1f5f9",
        "editorCursor.foreground": "#38bdf8",
        "editor.lineHighlightBackground": "#1e293b50",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#38bdf8",
        "editorGutter.background": "#090d16",
        "editor.selectionBackground": "#3b82f640",
        "editor.inactiveSelectionBackground": "#3b82f620",
        "scrollbarSlider.background": "#33415540",
        "scrollbarSlider.hoverBackground": "#33415580",
        "scrollbarSlider.activeBackground": "#38bdf860",
        "editorBracketMatch.background": "#38bdf830",
        "editorBracketMatch.border": "#38bdf8",
        "editorIndentGuide.background1": "#334155",
        "editorIndentGuide.activeBackground1": "#38bdf8",
        "editorWhitespace.foreground": "#94a3b8",
      },
    });

    monaco.editor.defineTheme("campus-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "94a3b8", fontStyle: "italic" },
        { token: "keyword", foreground: "7c3aed", fontStyle: "bold" },
        { token: "string", foreground: "059669" },
        { token: "number", foreground: "d97706" },
        { token: "type", foreground: "0284c7", fontStyle: "bold" },
        { token: "class", foreground: "0284c7", fontStyle: "bold" },
        { token: "delimiter.bracket", foreground: "1e40af", fontStyle: "bold" },
        { token: "delimiter.parenthesis", foreground: "1e40af", fontStyle: "bold" },
        { token: "delimiter.square", foreground: "1e40af", fontStyle: "bold" },
        { token: "delimiter.curly", foreground: "6d28d9", fontStyle: "bold" },
        { token: "delimiter.separator", foreground: "0f172a", fontStyle: "bold" },
        { token: "delimiter", foreground: "0f172a", fontStyle: "bold" },
        { token: "punctuation", foreground: "0f172a", fontStyle: "bold" },
        { token: "punctuation.separator", foreground: "0f172a", fontStyle: "bold" },
        { token: "punctuation.terminator", foreground: "0f172a", fontStyle: "bold" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#0f172a",
        "editorCursor.foreground": "#0f172a",
        "editor.lineHighlightBackground": "#eff6ff",
        "editorLineNumber.foreground": "#94a3b8",
        "editorLineNumber.activeForeground": "#2563eb",
        "editorGutter.background": "#ffffff",
        "editor.selectionBackground": "#bfdbfe80",
        "editor.inactiveSelectionBackground": "#bfdbfe40",
        "scrollbarSlider.background": "#cbd5e160",
        "scrollbarSlider.hoverBackground": "#94a3b880",
        "scrollbarSlider.activeBackground": "#64748b80",
        "editorBracketMatch.background": "#e0e7ff",
        "editorBracketMatch.border": "#4f46e5",
        "editorIndentGuide.background1": "#cbd5e1",
        "editorIndentGuide.activeBackground1": "#6366f1",
        "editorWhitespace.foreground": "#64748b",
      },
    });
  };

  // On Editor Mount: wire up toolbar controls, keyboard shortcuts, proctoring security, and refs
  const handleOnMount: OnMount = (editor, monaco) => {
    editorInstanceRef.current = editor;
    monacoInstanceRef.current = monaco;

    // Ensure model defaults to hard tabs for clear tab-stop rendering
    const model = editor.getModel();
    if (model) {
      model.updateOptions({
        tabSize: 4,
        insertSpaces: false,
      });
    }

    // Connect imperative handles for top toolbar
    if (editorRef) {
      editorRef.current = {
        undo: () => editor.trigger("toolbar", "undo", null),
        redo: () => editor.trigger("toolbar", "redo", null),
        canUndo: () => true,
        canRedo: () => true,
        revealLine: (line: number, column = 1) => {
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column });
          editor.focus();
        },
        setCursor: (line: number, column = 1) => {
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column });
          editor.focus();
        },
        focus: () => editor.focus(),
        formatCode: () => {
          try {
            editor.getAction("editor.action.formatDocument")?.run();
          } catch (e) {
            console.warn("Format code not available for language", monacoLang);
          }
        },
        zoomIn: () => {
          if (onFontSizeChange) {
            onFontSizeChange(Math.min(26, fontSize + 1));
          }
        },
        zoomOut: () => {
          if (onFontSizeChange) {
            onFontSizeChange(Math.max(11, fontSize - 1));
          }
        },
        resetZoom: () => {
          if (onFontSizeChange) {
            onFontSizeChange(15);
          }
        },
      };
    }

    // Ctrl+Enter / Cmd+Enter shortcut to run code directly from the editor
    if (onRunCode) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRunCode();
      });
    }

    // Ctrl+Y / Cmd+Y Redo support (especially for Mac users and cross-platform muscle memory)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
      editor.trigger("keyboard", "redo", null);
    });

    // Harmless Ctrl+S / Cmd+S save prevention (prevents browser "Save Page As" dialog)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Intentionally consumed without side-effects
    });

    // Ctrl/Cmd + Plus / Equal to Zoom In
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      if (onFontSizeChange) {
        onFontSizeChange(Math.min(26, fontSize + 1));
      }
    });

    // Ctrl/Cmd + Minus to Zoom Out
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      if (onFontSizeChange) {
        onFontSizeChange(Math.max(11, fontSize - 1));
      }
    });

    // Ctrl/Cmd + 0 to Reset Zoom
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => {
      if (onFontSizeChange) {
        onFontSizeChange(15);
      }
    });

    // Track cursor position & selection telemetry
    editor.onDidChangeCursorPosition((e) => {
      const sel = editor.getSelection();
      const model = editor.getModel();
      let selLen = 0;
      if (sel && model && !sel.isEmpty()) {
        selLen = model.getValueInRange(sel).length;
      }
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
        selLen,
      });
    });

    // Proctored Exam Protection: Disable F1 Command Palette
    editor.addCommand(monaco.KeyCode.F1, () => {
      // Intentionally consumed to prevent unauthorized command palette activation
    });

    // Proctored Exam Protection: Intercept clipboard hotkeys if copy/paste is restricted
    editor.onKeyDown((e: any) => {
      if (isCopyPasteDisabled) {
        const isMod = e.ctrlKey || e.metaKey;
        const isBlockedKey =
          e.keyCode === monaco.KeyCode.KeyC ||
          e.keyCode === monaco.KeyCode.KeyV ||
          e.keyCode === monaco.KeyCode.KeyX ||
          e.keyCode === monaco.KeyCode.Insert;

        if (isMod && isBlockedKey) {
          e.preventDefault();
          e.stopPropagation();
          if (onCopyPasteBlocked) {
            onCopyPasteBlocked();
          }
        }
      }
    });

    // Initial error marker if already set
    if (errorLine) {
      updateErrorMarker(editor, monaco, errorLine, errorMessage);
    }

    // Ensure whitespace options are explicitly set on editor
    editor.updateOptions({
      renderWhitespace: "boundary",
      experimentalWhitespaceRendering: "svg",
    });

    // Re-patch on layout changes (e.g. window resize or panel drag)
    editor.onDidLayoutChange(() => {
      patchMonacoWhitespaceOverlay(editor);
    });

    // Patch whitespace overlay to render full-span CodeTantra tab arrows and enlarged space dots
    patchMonacoWhitespaceOverlay(editor);
    setTimeout(() => {
      patchMonacoWhitespaceOverlay(editor);
      editor.render(true);
    }, 60);
    setTimeout(() => {
      patchMonacoWhitespaceOverlay(editor);
      editor.render(true);
    }, 180);
    editor.render(true);
  };

  // Helper to update squiggly line, line highlight, and point cursor on error
  const updateErrorMarker = (editor: any, monaco: any, line: number | null, message?: string | null) => {
    const model = editor.getModel();
    if (!model) return;

    if (line && line >= 1 && line <= model.getLineCount()) {
      const displayMsg = message || `Compilation / Syntax Error on Line ${line}`;
      monaco.editor.setModelMarkers(model, "compiler", [
        {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: model.getLineMaxColumn(line),
          message: displayMsg,
          severity: monaco.MarkerSeverity.Error,
        },
      ]);

      // Add full-line subtle red tint decoration and gutter glyph
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
          options: {
            isWholeLine: true,
            className: "monaco-error-line-highlight",
            glyphMarginClassName: "bg-rose-500 rounded-full",
            hoverMessage: { value: `**Compilation Error**: ${displayMsg}` },
          },
        },
      ]);

      // Point cursor and focus on the error line
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column: 1 });
      editor.focus();
    } else {
      monaco.editor.setModelMarkers(model, "compiler", []);
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  };

  // Update error marker and point cursor when errorLine prop changes
  useEffect(() => {
    if (editorInstanceRef.current && monacoInstanceRef.current) {
      updateErrorMarker(editorInstanceRef.current, monacoInstanceRef.current, errorLine ?? null, errorMessage ?? null);
    }
  }, [errorLine, errorMessage, isLight]);

  // Dynamically update font size and proportional line height
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({
        fontSize,
        lineHeight: computedLineHeight,
        renderWhitespace: "boundary",
        experimentalWhitespaceRendering: "svg",
      });
      patchMonacoWhitespaceOverlay(editorInstanceRef.current);
      editorInstanceRef.current.render(true);
    }
  }, [fontSize, computedLineHeight]);

  // Dynamically update wordWrap
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({ wordWrap });
    }
  }, [wordWrap]);

  // Dynamically update minimap
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({ minimap: { enabled: Boolean(minimap) } });
    }
  }, [minimap]);

  // Dynamically update tab size
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({
        tabSize,
        renderWhitespace: "boundary",
        experimentalWhitespaceRendering: "svg",
      });
      editorInstanceRef.current.getModel()?.updateOptions({ tabSize, insertSpaces: false });
      patchMonacoWhitespaceOverlay(editorInstanceRef.current);
      editorInstanceRef.current.render(true);
    }
  }, [tabSize]);

  // Dynamically update readOnly status
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({
        readOnly: Boolean(readOnly),
        domReadOnly: Boolean(readOnly),
      });
    }
  }, [readOnly]);

  // Dynamically update contextmenu restriction
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({
        contextmenu: !isCopyPasteDisabled,
      });
    }
  }, [isCopyPasteDisabled]);

  const handleChange = (newVal: string | undefined) => {
    if (errorLine && onClearErrorLine) {
      onClearErrorLine();
    }
    onChange(newVal || "");
  };

  const handleContainerSecurity = (e: React.SyntheticEvent) => {
    if (isCopyPasteDisabled) {
      e.preventDefault();
      e.stopPropagation();
      if (onCopyPasteBlocked) {
        onCopyPasteBlocked();
      }
    }
  };

  if (!isMounted) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-8 font-mono text-xs ${
          isLight ? "bg-white text-slate-500" : "bg-[#090d16] text-slate-400"
        }`}
      >
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mb-2" />
        <span>Initializing Microsoft Monaco Editor...</span>
      </div>
    );
  }

  return (
    <div
      onContextMenu={isCopyPasteDisabled ? handleContainerSecurity : undefined}
      onCopy={isCopyPasteDisabled ? handleContainerSecurity : undefined}
      onCut={isCopyPasteDisabled ? handleContainerSecurity : undefined}
      onPaste={isCopyPasteDisabled ? handleContainerSecurity : undefined}
      className={`w-full h-full flex flex-col relative overflow-hidden transition-colors ${
        isDragging ? "pointer-events-none select-none" : ""
      } ${isLight ? "bg-white text-slate-900" : "bg-[#090d16] text-slate-100"} ${className}`}
    >
      {/* Editor Body */}
      <div className="flex-1 relative w-full h-full overflow-hidden min-h-0">
        <Editor
          height="100%"
          language={monacoLang}
          theme={themeName}
          value={code}
          beforeMount={handleBeforeMount}
          onMount={handleOnMount}
          onChange={handleChange}
          options={{
            readOnly: Boolean(readOnly),
            domReadOnly: Boolean(readOnly),
            fontSize,
            lineHeight: computedLineHeight,
            letterSpacing: 0,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, Menlo, Monaco, monospace",
            fontWeight: "450",
            // Disable ligatures on Safari — shaping is slower on WebKit
            fontLigatures: !isSafari,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            lineDecorationsWidth: 16,
            glyphMargin: false,
            folding: true,
            minimap: { enabled: Boolean(minimap) },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: false,
            detectIndentation: false,
            useTabStops: true,
            wordWrap,
            cursorBlinking: "smooth",
            // Disable smooth caret animation on Safari — GPU compositing is expensive on WebKit
            cursorSmoothCaretAnimation: isSafari ? "off" : "on",
            cursorStyle: "line",
            cursorWidth: 2,
            // Disable smooth scrolling on Safari for better performance
            smoothScrolling: !isSafari,
            formatOnPaste: !isCopyPasteDisabled,
            suggestOnTriggerCharacters: true,
            matchBrackets: "always",
            guides: {
              bracketPairs: false,
              bracketPairsHorizontal: false,
              highlightActiveBracketPair: true,
              indentation: true,
              highlightActiveIndentation: true,
            },
            renderLineHighlight: "all",
            overviewRulerBorder: false,
            renderWhitespace: "boundary",
            // Renders full-span CodeTantra vector tab arrows and clearly visible space dots
            experimentalWhitespaceRendering: "svg",
            fixedOverflowWidgets: true,
            contextmenu: !isCopyPasteDisabled,
            padding: { top: 12, bottom: 12 },
            scrollbar: {
              vertical: "visible",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
          }}
          loading={
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-8 font-mono text-xs ${
                isLight ? "bg-white text-slate-500" : "bg-[#090d16] text-slate-400"
              }`}
            >
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mb-2" />
              <span>Loading Microsoft Monaco Editor...</span>
            </div>
          }
        />
      </div>

      {/* VS Code Style Status Bar Footer */}
      {showStatusBar && (
        <div
          className={`h-6 px-3 border-t flex items-center justify-between text-[11px] font-mono select-none shrink-0 transition-colors z-10 ${
            isLight
              ? "bg-slate-100 border-slate-200 text-slate-600"
              : "bg-[#060911] border-slate-800 text-slate-400"
          }`}
        >
          {/* Left: Position */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              Ln {cursorPos.line}, Col {cursorPos.col}
              {cursorPos.selLen > 0 && (
                <span className="text-indigo-500 font-semibold">({cursorPos.selLen} selected)</span>
              )}
            </span>
            <span className="opacity-40 hidden sm:inline">|</span>
            <span className="hidden sm:inline">UTF-8</span>
          </div>

          {/* Right: Language Badge & Shortcut Hint */}
          <div className="flex items-center gap-2.5">
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                isLight ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
              }`}
            >
              {language || "code"}
            </span>

            {onRunCode && (
              <>
                <span className="opacity-40 hidden lg:inline">|</span>
                <span className="hidden lg:flex items-center gap-1 text-[10px] opacity-75">
                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                  <span>{isMac ? "⌘+Enter to Run" : "Ctrl+Enter to Run"}</span>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
