import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, setAccessToken, getAccessToken, tryRefresh } from "@/lib/api";

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
    registerNumber?: string;
    department?: string;
    batch?: string;
    currentSemester?: string;
    facultyMentor?: string;
  };
  preferences?: {
    theme: "dark" | "light" | "system";
    accentColor?: "indigo" | "purple" | "emerald" | "amber" | "cyan" | "rose";
    notifyOn: string[];
    emailDigest?: "off" | "daily" | "weekly";
    aiDifficulty?: "Beginner" | "Intermediate" | "Advanced";
    preferredLanguage?: string;
    resumePrivacy?: boolean;
    dailyGoalProblems?: number;
    hiddenModules?: string[];
  };
}

interface AuthResponse {
  user: User;
  accessToken: string;
  isNewUser?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  googleLogin: (credential: string) => Promise<AuthResponse>;
  githubLogin: (payload?: { code?: string; accessToken?: string; username?: string }) => Promise<AuthResponse>;
  register: (data: { name: string; email: string; password: string }) => Promise<AuthResponse>;
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
          const data = await api.post<AuthResponse>("/auth/login", {
            email,
            password,
          });
          setAccessToken(data.accessToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return data;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      googleLogin: async (credential) => {
        set({ isLoading: true });
        try {
          const data = await api.post<AuthResponse>("/auth/google", {
            credential,
          });
          setAccessToken(data.accessToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return data;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      githubLogin: async (payload = {}) => {
        set({ isLoading: true });
        try {
          const data = await api.post<AuthResponse>("/auth/github", payload);
          setAccessToken(data.accessToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return data;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post<AuthResponse>("/auth/register", data);
          setAccessToken(res.accessToken);
          set({ user: res.user, isAuthenticated: true, isLoading: false });
          return res;
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
        set({ isCheckingAuth: true });
        try {
          if (!getAccessToken()) {
            const token = await tryRefresh().catch(() => null);
            if (!token) {
              set({ isCheckingAuth: false, isAuthenticated: false, user: null });
              return;
            }
          }
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
