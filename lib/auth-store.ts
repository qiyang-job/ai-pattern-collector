"use client";

import { create } from "zustand";
import {
  callCloudFunction,
  getAuthState,
  onAuthChange,
  sendEmailCode,
  signOut as signOutCloud,
  verifyEmailCode,
} from "@/lib/cloudbase";

type AuthStatus = "loading" | "authed" | "guest";

type AuthState = {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  init: () => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

let _watching = false;

/** 登录后把历史数据（匿名身份创建）归属到当前账号，幂等（localStorage 去重） */
async function claimOwnership(uid: string | null) {
  if (!uid || typeof window === "undefined") return;
  const key = `pc_claimed_${uid}`;
  if (window.localStorage.getItem(key)) return;
  try {
    await callCloudFunction("claim-records", { action: "claim", targetOpenId: uid });
    window.localStorage.setItem(key, "1");
  } catch (e) {
    console.warn("[auth] 数据归属迁移失败，将在下次登录重试", e);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  userId: null,
  email: null,

  async init() {
    try {
      const state = await getAuthState();
      set({
        status: state.loggedIn ? "authed" : "guest",
        userId: state.userId,
        email: state.email,
      });
      if (state.loggedIn) claimOwnership(state.userId);
    } catch {
      set({ status: "guest", userId: null, email: null });
    }

    // 仅注册一次登录态监听
    if (!_watching) {
      _watching = true;
      onAuthChange(async () => {
        const next = await getAuthState();
        set({
          status: next.loggedIn ? "authed" : "guest",
          userId: next.userId,
          email: next.email,
        });
        if (next.loggedIn) claimOwnership(next.userId);
      });
    }
  },

  async sendCode(email) {
    await sendEmailCode(email.trim());
  },

  async verifyCode(token) {
    await verifyEmailCode(token.trim());
    const state = await getAuthState();
    set({
      status: state.loggedIn ? "authed" : "guest",
      userId: state.userId,
      email: state.email,
    });
    if (state.loggedIn) await claimOwnership(state.userId);
  },

  async signOut() {
    await signOutCloud();
    set({ status: "guest", userId: null, email: null });
  },
}));

export type { AuthStatus };
