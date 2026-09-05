import { useState, useRef, useEffect } from "react";

/**
 * Shared hook for exam/practice layout state management
 * Handles theme, resizable panels, sidebar/console visibility
 */
export function useExamLayoutState(storagePrefix: string = "c2c_exam") {
  // Theme state (inherits from app theme or saved preference)
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_theme`);
      if (saved) return saved === "light";
      const appTheme = localStorage.getItem("c2c_theme");
      if (appTheme) return appTheme === "light";
      if (typeof document !== "undefined") {
        return !document.documentElement.classList.contains("dark");
      }
      return false;
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsLightMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`${storagePrefix}_theme`, next ? "light" : "dark");
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(`c2c_exam_layout_theme_${storagePrefix}`, {
              detail: { isLightMode: next },
            })
          );
        }
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleThemeSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ isLightMode: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isLightMode === "boolean") {
        setIsLightMode(customEvent.detail.isLightMode);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(`c2c_exam_layout_theme_${storagePrefix}`, handleThemeSync);
      return () => {
        window.removeEventListener(`c2c_exam_layout_theme_${storagePrefix}`, handleThemeSync);
      };
    }
  }, [storagePrefix]);

  // Resizable panel widths
  const [leftPanelWidthPercent, setLeftPanelWidthPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_left_width`);
      return saved ? Math.min(78, Math.max(22, Number(saved))) : 35;
    } catch {
      return 35;
    }
  });

  const [consoleHeightPx, setConsoleHeightPx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_console_height`);
      return saved ? Math.min(600, Math.max(90, Number(saved))) : 220;
    } catch {
      return 220;
    }
  });

  // Panel visibility states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_sidebar_collapsed`);
      return saved === "true";
    } catch {
      return false;
    }
  });

  const [isProblemClosed, setIsProblemClosed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${storagePrefix}_problem_closed`) === "true";
    } catch {
      return false;
    }
  });

  const [isConsoleClosed, setIsConsoleClosed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${storagePrefix}_console_closed`) === "true";
    } catch {
      return false;
    }
  });

  const [isConsoleMaximized, setIsConsoleMaximized] = useState<boolean>(false);

  // Editor settings
  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_editor_font_size`);
      return saved ? Math.min(24, Math.max(12, Number(saved))) : 15;
    } catch {
      return 15;
    }
  });

  const [editorTabSize, setEditorTabSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_editor_tab_size`);
      return saved ? (Number(saved) === 2 ? 2 : 4) : 4;
    } catch {
      return 4;
    }
  });

  // Drag state refs
  const isDraggingHorizontalRef = useRef(false);
  const isDraggingVerticalRef = useRef(false);
  const mainWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const rightSectionRef = useRef<HTMLElement | null>(null);

  // Save methods
  const saveLeftWidth = (width: number) => {
    const clamped = Math.min(78, Math.max(22, width));
    setLeftPanelWidthPercent(clamped);
    try {
      localStorage.setItem(`${storagePrefix}_left_width`, String(clamped));
    } catch {}
  };

  const saveConsoleHeight = (height: number) => {
    const clamped = Math.min(600, Math.max(80, height));
    setConsoleHeightPx(clamped);
    try {
      localStorage.setItem(`${storagePrefix}_console_height`, String(clamped));
    } catch {}
  };

  const saveEditorFontSize = (size: number) => {
    const clamped = Math.min(24, Math.max(12, size));
    setEditorFontSize(clamped);
    try {
      localStorage.setItem(`${storagePrefix}_editor_font_size`, String(clamped));
    } catch {}
  };

  const saveEditorTabSize = (size: number) => {
    const validated = size === 2 ? 2 : 4;
    setEditorTabSize(validated);
    try {
      localStorage.setItem(`${storagePrefix}_editor_tab_size`, String(validated));
    } catch {}
  };

  // Toggle methods
  const toggleSidebar = (closed?: boolean) => {
    const next = closed !== undefined ? closed : !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    try {
      localStorage.setItem(`${storagePrefix}_sidebar_collapsed`, String(next));
    } catch {}
  };

  const toggleProblemClosed = (closed?: boolean) => {
    const next = closed !== undefined ? closed : !isProblemClosed;
    setIsProblemClosed(next);
    try {
      localStorage.setItem(`${storagePrefix}_problem_closed`, String(next));
    } catch {}
  };

  const toggleConsoleClosed = (closed?: boolean) => {
    const next = closed !== undefined ? closed : !isConsoleClosed;
    setIsConsoleClosed(next);
    try {
      localStorage.setItem(`${storagePrefix}_console_closed`, String(next));
    } catch {}
  };

  const toggleConsoleMaximized = () => {
    setIsConsoleMaximized(!isConsoleMaximized);
  };

  // Global mousemove & mouseup listeners for seamless panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingHorizontalRef.current && mainWorkspaceRef.current) {
        const rect = mainWorkspaceRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const totalWidth = rect.width;
        if (totalWidth > 0) {
          const newPercent = (offsetX / totalWidth) * 100;
          saveLeftWidth(newPercent);
        }
      }

      if (isDraggingVerticalRef.current && rightSectionRef.current) {
        const rect = rightSectionRef.current.getBoundingClientRect();
        const offsetY = rect.bottom - e.clientY;
        const maxHeight = Math.max(200, rect.height - 120);
        saveConsoleHeight(Math.min(maxHeight, offsetY));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingHorizontalRef.current || isDraggingVerticalRef.current) {
        isDraggingHorizontalRef.current = false;
        isDraggingVerticalRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [storagePrefix]);

  const handleStartHorizontalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingHorizontalRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleStartVerticalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingVerticalRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  return {
    // Theme
    isLightMode,
    toggleTheme,
    
    // Panel dimensions
    leftPanelWidthPercent,
    consoleHeightPx,
    saveLeftWidth,
    saveConsoleHeight,
    
    // Panel visibility
    isSidebarCollapsed,
    isProblemClosed,
    isConsoleClosed,
    isConsoleMaximized,
    toggleSidebar,
    toggleProblemClosed,
    toggleConsoleClosed,
    toggleConsoleMaximized,
    
    // Editor settings
    editorFontSize,
    editorTabSize,
    saveEditorFontSize,
    saveEditorTabSize,
    
    // Drag handlers
    handleStartHorizontalDrag,
    handleStartVerticalDrag,
    
    // Refs
    mainWorkspaceRef,
    rightSectionRef,
    isDraggingHorizontalRef,
    isDraggingVerticalRef,
  };
}
