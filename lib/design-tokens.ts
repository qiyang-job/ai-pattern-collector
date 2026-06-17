import type { PatternCategory, ProductCategory, ReuseLevel } from "@/lib/types";

export const tokens = {
  bg: "#0E1116",
  panel: "#161A21",
  panelMuted: "#1C212A",
  border: "#2A313C",
  text: "#EEF1F5",
  textMuted: "#9AA3B1",
  textWeak: "#646D7C",
  accent: "#E0A64A",
  accentMuted: "rgba(224,166,74,0.13)",
  success: "#5BBF7A",
  warning: "#E0A64A",
  danger: "#E06A52",
} as const;

/* Dark-theme category tags: translucent tinted fills + luminous text. */
export const PRODUCT_CATEGORY_COLORS: Record<ProductCategory, { bg: string; text: string }> = {
  "AI Chat": { bg: "rgba(99,142,232,0.16)", text: "#9FB8F0" },
  "AI Search": { bg: "rgba(79,196,207,0.16)", text: "#7FD6DE" },
  "AI Agent": { bg: "rgba(168,130,232,0.16)", text: "#C0A6EE" },
  "AI Workspace": { bg: "rgba(91,191,122,0.16)", text: "#86D49E" },
  "Coding Agent": { bg: "rgba(224,166,74,0.16)", text: "#E9C079" },
};

export const REUSE_LEVEL_COLORS: Record<ReuseLevel, { bg: string; text: string }> = {
  High: { bg: "rgba(91,191,122,0.18)", text: "#86D49E" },
  Medium: { bg: "rgba(224,166,74,0.18)", text: "#E9C079" },
  Low: { bg: "rgba(154,163,177,0.14)", text: "#9AA3B1" },
};

export const PATTERN_CATEGORY_COLORS: Record<PatternCategory, { bg: string; text: string }> = {
  "Intent Input Patterns": { bg: "rgba(99,142,232,0.16)", text: "#9FB8F0" },
  "Context Management Patterns": { bg: "rgba(79,196,207,0.16)", text: "#7FD6DE" },
  "Planning & Reasoning Patterns": { bg: "rgba(168,130,232,0.16)", text: "#C0A6EE" },
  "Execution Feedback Patterns": { bg: "rgba(91,191,122,0.16)", text: "#86D49E" },
  "Trust & Verification Patterns": { bg: "rgba(224,166,74,0.16)", text: "#E9C079" },
  "Refinement Patterns": { bg: "rgba(232,130,168,0.16)", text: "#EEA6C4" },
  "Output Handoff Patterns": { bg: "rgba(184,150,120,0.16)", text: "#D6B79A" },
  "Failure Recovery Patterns": { bg: "rgba(224,106,82,0.16)", text: "#EE9A86" },
};
