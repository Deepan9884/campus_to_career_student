import React, { useState, useEffect, useRef } from "react";
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

/**
 * Patches Monaco's internal WhitespaceOverlay to render:
 * 1. Full-span CodeTantra-style vector arrows (line + arrowhead) proportional to letter height and stroke
 * 2. Vertically centered space dots aligned with lowercase letters
 */
function patchMonacoWhitespaceOverlay(editor: any) {
  try {
    const view = editor?._modelData?.view;
    if (!view?._viewParts) return;

    for (const part of view._viewParts) {
      if (Array.isArray(part._dynamicOverlays)) {
        for (const overlay of part._dynamicOverlays) {
          if (typeof overlay._renderArrow === "function") {
            const proto = Object.getPrototypeOf(overlay);
            const targets = [overlay];
            if (proto && proto !== Object.prototype) targets.push(proto);

            const customRenderArrow = function (lineHeight: number, spaceWidth: number, left: number) {
              const tabCols = 4;
              const totalWidth = spaceWidth * tabCols;
              const dy = Math.round(lineHeight * 0.57);
              const strokeWidth = Math.max(1.8, Math.round(spaceWidth * 0.16 * 10) / 10);
              const endX = left + totalWidth - Math.max(3, spaceWidth * 0.25);
              const startX = left + 2;
              const arrowLen = Math.max(6, spaceWidth * 0.6);
              const arrowH = Math.max(4, spaceWidth * 0.35);

              return (
                `<line x1="${startX.toFixed(1)}" y1="${dy}" x2="${(endX - 2).toFixed(1)}" y2="${dy}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" />` +
                `<polygon points="${endX.toFixed(1)},${dy} ${(endX - arrowLen).toFixed(1)},${(dy - arrowH).toFixed(1)} ${(endX - arrowLen + 1).toFixed(1)},${dy} ${(endX - arrowLen).toFixed(1)},${(dy + arrowH).toFixed(1)}" fill="currentColor" />`
              );
            };

            const origApply = overlay._applyRenderWhitespace;
            const customApply = function (ctx: any, lineNumber: number, selections: any, lineData: any) {
              const html = origApply.call(this, ctx, lineNumber, selections, lineData);
              if (!html || typeof html !== "string") return html;

              const lineHeight = ctx.getLineHeightForLineNumber(lineNumber);
              const properCy = (lineHeight * 0.57).toFixed(2);
              const oldCy = (lineHeight / 2).toFixed(2);

              return html
                .replace(new RegExp('cy="' + oldCy + '"', "g"), 'cy="' + properCy + '"')
                .replace(new RegExp('r="[0-9.]+"', "g"), 'r="1.8"');
            };

            for (const target of targets) {
              target._renderArrow = customRenderArrow;
              target._applyRenderWhitespace = customApply;
            }
          }
        }
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
        { token: "delimiter.bracket", foreground: "94a3b8" },
        { token: "delimiter.parenthesis", foreground: "94a3b8" },
        { token: "delimiter.square", foreground: "94a3b8" },
        { token: "delimiter.curly", foreground: "94a3b8" },
        { token: "delimiter", foreground: "94a3b8" },
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
        { token: "delimiter.bracket", foreground: "475569" },
        { token: "delimiter.parenthesis", foreground: "475569" },
        { token: "delimiter.square", foreground: "475569" },
        { token: "delimiter.curly", foreground: "475569" },
        { token: "delimiter", foreground: "475569" },
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

    // Patch whitespace overlay to render full-span CodeTantra tab arrows and centered space dots
    patchMonacoWhitespaceOverlay(editor);
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
            className: isLight ? "bg-rose-500/15" : "bg-rose-500/20",
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
      editorInstanceRef.current.updateOptions({ tabSize });
      editorInstanceRef.current.getModel()?.updateOptions({ tabSize, insertSpaces: false });
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
            fontWeight: "400",
            fontLigatures: true,
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
            cursorSmoothCaretAnimation: "on",
            cursorStyle: "line",
            cursorWidth: 2,
            smoothScrolling: true,
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
            renderWhitespace: "all",
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
                  <span>Ctrl+Enter to Run</span>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
