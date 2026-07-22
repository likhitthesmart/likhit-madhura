"use client";
import { create } from "zustand";
import { api, type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  ready: boolean;
  setSession: (user: User, accessToken: string) => void;
  clear: () => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  ready: false,
  setSession: (user, accessToken) => {
    set({ user, accessToken, ready: true });
    // non-sensitive marker so anonymous visitors skip the /auth/refresh call
    document.cookie = "mn_auth=1; path=/; max-age=2592000; samesite=lax";
    // access tokens last 15m — refresh at 13m
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => void get().bootstrap(), 13 * 60_000);
  },
  clear: () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    document.cookie = "mn_auth=; path=/; max-age=0";
    set({ user: null, accessToken: null, ready: true });
  },
  bootstrap: async () => {
    if (!document.cookie.includes("mn_auth=1")) {
      get().clear();
      return;
    }
    try {
      const data = await api<{ user: User; accessToken: string }>("/auth/refresh", { method: "POST" });
      get().setSession(data.user, data.accessToken);
    } catch {
      get().clear();
    }
  },
  logout: async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      get().clear();
    }
  },
}));
