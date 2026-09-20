import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SkillsState {
  currentSkills: string[];
  targetRole: string;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  setTargetRole: (role: string) => void;
}

export const useSkills = create<SkillsState>()(
  persist(
    (set) => ({
      currentSkills: [],
      targetRole: "Full Stack Developer",
      addSkill: (skill) =>
        set((s) =>
          s.currentSkills.includes(skill) || !skill.trim()
            ? s
            : { currentSkills: [...s.currentSkills, skill.trim()] },
        ),
      removeSkill: (skill) =>
        set((s) => ({ currentSkills: s.currentSkills.filter((x) => x !== skill) })),
      setTargetRole: (role) => set({ targetRole: role }),
    }),
    {
      name: "cf-skills",
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
