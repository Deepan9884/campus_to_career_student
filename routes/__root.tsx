import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";
import { useAuth } from "@/stores";
import { GoogleOAuthProvider } from "@react-oauth/google";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Campus to Career AI — Become Internship-Ready" },
      {
        name: "description",
        content:
          "AI-powered career prep: ATS resume scoring, mock interviews, GitHub project review, skill-gap analysis and personalized learning roadmaps.",
      },
      { property: "og:title", content: "Campus to Career AI" },
      { property: "og:description", content: "Your AI co-pilot for landing the internship." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { user, checkAuth } = useAuth();
  useEffect(() => {
    checkAuth();

    // Auto-reload on stale asset chunk 404s after new Vercel deployments
    const handlePreloadError = (event: Event) => {
      event.preventDefault();
      console.warn("New version detected, refreshing application assets...");
      window.location.reload();
    };

    const handleGlobalError = (e: ErrorEvent) => {
      const msg = e?.message || "";
      if (
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("error loading dynamically imported module")
      ) {
        const lastReload = sessionStorage.getItem("c2c_chunk_reload");
        const now = Date.now();
        if (!lastReload || now - Number(lastReload) > 10000) {
          sessionStorage.setItem("c2c_chunk_reload", String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener("vite:preloadError", handlePreloadError);
    window.addEventListener("error", handleGlobalError);
    return () => {
      window.removeEventListener("vite:preloadError", handlePreloadError);
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  // Synchronize theme and accent with user preferences or localStorage
  useEffect(() => {
    const savedTheme =
      user?.preferences?.theme ||
      (typeof localStorage !== "undefined" ? localStorage.getItem("c2c_theme") : null) ||
      "dark";
    const savedAccent =
      user?.preferences?.accentColor ||
      (typeof localStorage !== "undefined" ? localStorage.getItem("c2c_accent") : null) ||
      "indigo";

    const root = document.documentElement;
    root.setAttribute("data-accent", savedAccent);

    if (savedTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);
    } else {
      root.classList.toggle("dark", savedTheme === "dark");
      root.classList.toggle("light", savedTheme === "light");
    }
  }, [user?.preferences?.theme, user?.preferences?.accentColor]);

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "1000000000000-demo1234567890abcdef.apps.googleusercontent.com";

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <Outlet />
        <Toaster
          position="top-right"
          duration={3500}
          closeButton
        />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="glass-strong rounded-2xl p-10 text-center max-w-md">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <p className="mt-3 text-muted-foreground">This page slipped through the cracks.</p>
        <a
          href="/"
          className="mt-6 inline-block btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Back home
        </a>
      </div>
    </div>
  );
}
