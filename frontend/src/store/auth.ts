"use client";

import { create } from "zustand";
import { authService } from "@/services";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "ready";
  fetchMe: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

/** Global session state. The JWT itself lives in an HTTP-only cookie the browser JS cannot read. */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  fetchMe: async () => {
    if (get().status === "loading") return get().user;
    set({ status: "loading" });
    try {
      const { user } = await authService.me();
      set({ user, status: "ready" });
      return user;
    } catch {
      set({ user: null, status: "ready" });
      return null;
    }
  },
  setUser: (user) => set({ user, status: "ready" }),
  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ user: null, status: "ready" });
    }
  },
}));
