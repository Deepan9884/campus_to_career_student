// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: process.env.NITRO_PRESET || "vercel",
  },
  vite: {
    server: {
      // Allow Google OAuth popup to communicate with the opener window.
      // Without same-origin-allow-popups, window.closed calls from
      // accounts.google.com are blocked by the COOP policy.
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          // Rewrite the cookie domain so that the httpOnly refreshToken cookie
          // set by the backend (localhost:5000) is visible to the frontend
          // origin (localhost:517x / 808x) when sent through this proxy.
          cookieDomainRewrite: "localhost",
        },
      },
    },
  },
});
