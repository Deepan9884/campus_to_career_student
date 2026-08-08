import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, setAccessToken, getAccessToken } from "@/lib/api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: "student" | "mentor" | "admin";
  avatar?: string;
  targetRole?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  bio?: string;
  isEmailVerified?: boolean;
  is2FAEnabled?: boolean;
  phone?: string;
  experience?: string;
  github?: string;
  linkedin?: string;
  joined?: string;
  createdAt?: string;
  profile?: {
    targetRole?: string;
    githubUsername?: string;
    bio?: string;
    location?: string;
  };
  preferences?: {
    theme: "dark" | "light" | "system";
    notifyOn: string[];
    emailDigest?: "off" | "daily" | "weekly";
    aiDifficulty?: "Beginner" | "Intermediate" | "Advanced";
    preferredLanguage?: string;
    resumePrivacy?: boolean;
    dailyGoalProblems?: number;
    hiddenModules?: string[];
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isCheckingAuth: true,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{ user: User; accessToken: string }>("/auth/login", {
            email,
            password,
          });
          setAccessToken(data.accessToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      googleLogin: async (credential) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{ user: User; accessToken: string }>("/auth/google", {
            credential,
          });
          setAccessToken(data.accessToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post<{ user: User; accessToken: string }>("/auth/register", data);
          setAccessToken(res.accessToken);
          set({ user: res.user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // ignore
        }
        setAccessToken(null);
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        if (!getAccessToken()) {
          set({ isCheckingAuth: false });
          return;
        }
        set({ isCheckingAuth: true });
        try {
          const user = await api.get<User>("/auth/me");
          set({ user, isAuthenticated: true, isCheckingAuth: false });
        } catch {
          setAccessToken(null);
          set({ user: null, isAuthenticated: false, isCheckingAuth: false });
        }
      },

      updateUser: async (patch) => {
        try {
          const user = await api.patch<User>("/auth/me", patch);
          set((s) => (s.user ? { user } : s));
        } catch (err) {
          throw err;
        }
      },
    }),
    {
      name: "cf-auth",
      partialize: (state) => ({
        user: state.user
          ? { ...state.user, avatar: undefined }
          : state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          return localStorage.getItem(name);
        },
        setItem: (name, value) => {
          if (typeof window !== "undefined") localStorage.setItem(name, value);
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") localStorage.removeItem(name);
        },
      })),
    },
  ),
);
