import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Sun,
  Moon,
  Menu,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Minus,
  Square,
} from "lucide-react";
import { useExamLayoutState } from "@/hooks/useExamLayoutState";

export interface ExamLayoutShellProps {
  // External layout state (to ensure 100% synchronization with parent)
  layout?: ReturnType<typeof useExamLayoutState>;

  // Header
  title: string;
  subtitle?: string;
  onClose: () => void;
  headerActions?: ReactNode;
  
  // Sidebar (Question Navigator)
  sidebar: ReactNode;
  showSidebar?: boolean;
  
  // Main content areas
  problemPanel: ReactNode;
  editorPanel: ReactNode;
  consolePanel?: ReactNode;
  showConsole?: boolean;
  
  // Mode/Type
  mode?: "exam" | "practice";
  storagePrefix?: string;
  
  // Optional proctoring overlay
  proctoringOverlay?: ReactNode;
  
  // Children (for any additional overlays/modals)
  children?: ReactNode;
}

export function ExamLayoutShell({
  layout: externalLayout,
  title,
  subtitle,
  onClose,
  headerActions,
  sidebar,
  showSidebar = true,
  problemPanel,
  editorPanel,
  consolePanel,
  showConsole = true,
  mode = "practice",
  storagePrefix = "c2c_exam",
  proctoringOverlay,
  children,
}: ExamLayoutShellProps) {
  const internalLayout = useExamLayoutState(storagePrefix);
  const layout = externalLayout || internalLayout;

  const {
    isLightMode,
    toggleTheme,
    leftPanelWidthPercent,
    consoleHeightPx,
    isSidebarCollapsed,
    isProblemClosed,
    isConsoleClosed,
    isConsoleMaximized,
    toggleSidebar,
    toggleProblemClosed,
    toggleConsoleClosed,
    toggleConsoleMaximized,
    handleStartHorizontalDrag,
    handleStartVerticalDrag,
    mainWorkspaceRef,
    rightSectionRef,
  } = layout;

  return (
    <div
      data-theme={isLightMode ? "light" : "dark"}
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col overflow-hidden font-sans",
        isLightMode
          ? "light bg-slate-100 text-slate-900"
          : "dark bg-[#0c1017] text-slate-100"
      )}
    >
      {/* Top Header Bar */}
      <header
        className={cn(
          "flex items-center justify-between px-4 h-14 border-b shrink-0 transition-colors",
          isLightMode
            ? "bg-white/95 border-slate-200 shadow-xs"
            : "bg-[#131923] border-slate-800/90 text-slate-100"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-lg transition shrink-0 cursor-pointer",
              isLightMode
                ? "hover:bg-slate-100 text-slate-600"
                : "hover:bg-slate-800 text-slate-300"
            )}
            title="Exit"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className={cn("text-sm font-bold truncate", isLightMode ? "text-slate-900" : "text-white")}>
              {title}
            </h1>
            {subtitle && (
              <p className={cn("text-xs truncate font-medium", isLightMode ? "text-slate-500" : "text-slate-400")}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {headerActions}
          
          <button
            onClick={toggleTheme}
            className={cn(
              "p-2 rounded-lg transition shrink-0 cursor-pointer border",
              isLightMode
                ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                : "bg-slate-800/90 hover:bg-slate-700 border-slate-700/80 text-amber-300 shadow-xs"
            )}
            title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {isLightMode ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div ref={mainWorkspaceRef} className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Question Navigator */}
        {showSidebar && !isSidebarCollapsed && (
          <aside
            className={cn(
              "w-56 border-r flex flex-col shrink-0 transition-colors",
              isLightMode
                ? "bg-slate-50 border-slate-200"
                : "bg-[#131923] border-slate-800/80"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 border-b",
                isLightMode ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-800/80 bg-[#161c26] text-slate-300"
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">
                {mode === "exam" ? "Questions" : "Problems"}
              </span>
              <button
                onClick={() => toggleSidebar(true)}
                className={cn(
                  "p-1 rounded transition cursor-pointer",
                  isLightMode ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-800 text-slate-400"
                )}
                title="Collapse Sidebar (More Space)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebar}</div>
          </aside>
        )}

        {/* Sidebar Collapsed - Show Toggle */}
        {showSidebar && isSidebarCollapsed && (
          <button
            onClick={() => toggleSidebar(false)}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-r-lg border border-l-0 transition cursor-pointer shadow-sm",
              isLightMode
                ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                : "bg-[#161c26] border-slate-800 hover:bg-slate-800 text-slate-300"
            )}
            title="Show Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Main Content Area - Split Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Problem Statement */}
          {!isProblemClosed && (
            <>
              <section
                style={{ width: `${leftPanelWidthPercent}%` }}
                className={cn(
                  "flex flex-col overflow-hidden border-r transition-colors",
                  isLightMode ? "border-slate-200 bg-white" : "border-slate-800/80 bg-[#0f141c]"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2 border-b",
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-700"
                      : "bg-[#161c26] border-slate-800/80 text-slate-300"
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Problem
                  </span>
                  <button
                    onClick={() => toggleProblemClosed(true)}
                    className={cn(
                      "p-1 rounded transition cursor-pointer",
                      isLightMode ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-800 text-slate-400"
                    )}
                    title="Close Problem Panel (More Space)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">{problemPanel}</div>
              </section>

              {/* Horizontal Resizer */}
              <div
                onMouseDown={handleStartHorizontalDrag}
                className={cn(
                  "w-1 cursor-col-resize hover:bg-indigo-500/60 transition shrink-0 relative group",
                  isLightMode ? "bg-slate-200" : "bg-slate-800"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition",
                    isLightMode ? "bg-slate-300" : "bg-slate-700"
                  )}
                >
                  <GripVertical className="w-3 h-3" />
                </div>
              </div>
            </>
          )}

          {/* Problem Closed - Show Toggle */}
          {isProblemClosed && (
            <button
              onClick={() => toggleProblemClosed(false)}
              className={cn(
                "p-2 border-r flex items-center justify-center transition shrink-0 cursor-pointer",
                isLightMode
                  ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  : "bg-[#161c26] border-slate-800 hover:bg-slate-800 text-slate-300"
              )}
              title="Show Problem Panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Right Panel - Editor + Console */}
          <section
            ref={rightSectionRef}
            style={{
              width: isProblemClosed
                ? "100%"
                : `${100 - leftPanelWidthPercent}%`,
            }}
            className="flex flex-col overflow-hidden"
          >
            {/* Editor Area */}
            <div
              style={{
                height:
                  !showConsole || isConsoleClosed
                    ? "100%"
                    : isConsoleMaximized
                      ? "40%"
                      : `calc(100% - ${consoleHeightPx}px)`,
              }}
              className="overflow-hidden"
            >
              {editorPanel}
            </div>

            {/* Console Area */}
            {showConsole && !isConsoleClosed && (
              <>
                {/* Vertical Resizer */}
                {!isConsoleMaximized && (
                  <div
                    onMouseDown={handleStartVerticalDrag}
                    className={cn(
                      "h-1 cursor-row-resize hover:bg-indigo-500/60 transition relative group",
                      isLightMode ? "bg-slate-200" : "bg-slate-800"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition",
                        isLightMode ? "bg-slate-300" : "bg-slate-700"
                      )}
                    >
                      <Minus className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                )}

                <div
                  style={{
                    height: isConsoleMaximized ? "60%" : `${consoleHeightPx}px`,
                  }}
                  className={cn(
                    "flex flex-col border-t transition-colors",
                    isLightMode ? "border-slate-200 bg-white" : "border-slate-800/80 bg-[#0f141c]"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-1.5 border-b",
                      isLightMode
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : "bg-[#161c26] border-slate-800/80 text-slate-300"
                    )}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Console
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleConsoleMaximized}
                        className={cn(
                          "p-1 rounded transition cursor-pointer",
                          isLightMode ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-800 text-slate-400"
                        )}
                        title={isConsoleMaximized ? "Minimize" : "Maximize"}
                      >
                        {isConsoleMaximized ? (
                          <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleConsoleClosed(true)}
                        className={cn(
                          "p-1 rounded transition cursor-pointer",
                          isLightMode ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-800 text-slate-400"
                        )}
                        title="Close Console"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">{consolePanel}</div>
                </div>
              </>
            )}

            {/* Console Closed - Show Toggle */}
            {showConsole && isConsoleClosed && (
              <button
                onClick={() => toggleConsoleClosed(false)}
                className={cn(
                  "w-full py-2 border-t flex items-center justify-center gap-2 transition text-xs font-semibold cursor-pointer",
                  isLightMode
                    ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    : "bg-[#161c26] border-slate-800/80 hover:bg-slate-800 text-slate-300"
                )}
                title="Show Console"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Show Console</span>
              </button>
            )}
          </section>
        </div>
      </div>

      {/* Proctoring Overlay (if provided) */}
      {proctoringOverlay}

      {/* Additional children (modals, overlays, etc.) */}
      {children}
    </div>
  );
}
