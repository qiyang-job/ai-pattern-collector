import type { PatternCategory, ProductCategory, ReuseLevel } from "@/lib/types";
import type { Theme } from "@/lib/theme-store";

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

type TagColors = { bg: string; text: string };

/* Dark-theme category tags: translucent tinted fills + luminous text. */
export const PRODUCT_CATEGORY_COLORS: Record<ProductCategory, TagColors> = {
  "AI Chat": { bg: "rgba(99,142,232,0.16)", text: "#9FB8F0" },
  "AI Search": { bg: "rgba(79,196,207,0.16)", text: "#7FD6DE" },
  "AI Agent": { bg: "rgba(168,130,232,0.16)", text: "#C0A6EE" },
  "AI Workspace": { bg: "rgba(91,191,122,0.16)", text: "#86D49E" },
  "Coding Agent": { bg: "rgba(224,166,74,0.16)", text: "#E9C079" },
};

export const REUSE_LEVEL_COLORS: Record<ReuseLevel, TagColors> = {
  High: { bg: "rgba(91,191,122,0.18)", text: "#86D49E" },
  Medium: { bg: "rgba(224,166,74,0.18)", text: "#E9C079" },
  Low: { bg: "rgba(154,163,177,0.14)", text: "#9AA3B1" },
};

export const PATTERN_CATEGORY_COLORS: Record<PatternCategory, TagColors> = {
  "Intent Input Patterns": { bg: "rgba(99,142,232,0.16)", text: "#9FB8F0" },
  "Context Management Patterns": { bg: "rgba(79,196,207,0.16)", text: "#7FD6DE" },
  "Planning & Reasoning Patterns": { bg: "rgba(168,130,232,0.16)", text: "#C0A6EE" },
  "Execution Feedback Patterns": { bg: "rgba(91,191,122,0.16)", text: "#86D49E" },
  "Trust & Verification Patterns": { bg: "rgba(224,166,74,0.16)", text: "#E9C079" },
  "Refinement Patterns": { bg: "rgba(232,130,168,0.16)", text: "#EEA6C4" },
  "Output Handoff Patterns": { bg: "rgba(184,150,120,0.16)", text: "#D6B79A" },
  "Failure Recovery Patterns": { bg: "rgba(224,106,82,0.16)", text: "#EE9A86" },
};

/* Light-theme category tags: tinted fills + readable saturated text. */
export const PRODUCT_CATEGORY_COLORS_LIGHT: Record<ProductCategory, TagColors> = {
  "AI Chat": { bg: "rgba(99,142,232,0.14)", text: "#3A5FA0" },
  "AI Search": { bg: "rgba(47,154,164,0.14)", text: "#247580" },
  "AI Agent": { bg: "rgba(168,130,232,0.14)", text: "#6E52A8" },
  "AI Workspace": { bg: "rgba(58,158,92,0.14)", text: "#2E8050" },
  "Coding Agent": { bg: "rgba(200,138,42,0.14)", text: "#9A6418" },
};

export const REUSE_LEVEL_COLORS_LIGHT: Record<ReuseLevel, TagColors> = {
  High: { bg: "rgba(58,158,92,0.14)", text: "#2E8050" },
  Medium: { bg: "rgba(200,138,42,0.14)", text: "#9A6418" },
  Low: { bg: "rgba(90,100,117,0.12)", text: "#5A6475" },
};

export const PATTERN_CATEGORY_COLORS_LIGHT: Record<PatternCategory, TagColors> = {
  "Intent Input Patterns": { bg: "rgba(99,142,232,0.14)", text: "#3A5FA0" },
  "Context Management Patterns": { bg: "rgba(47,154,164,0.14)", text: "#247580" },
  "Planning & Reasoning Patterns": { bg: "rgba(168,130,232,0.14)", text: "#6E52A8" },
  "Execution Feedback Patterns": { bg: "rgba(58,158,92,0.14)", text: "#2E8050" },
  "Trust & Verification Patterns": { bg: "rgba(200,138,42,0.14)", text: "#9A6418" },
  "Refinement Patterns": { bg: "rgba(200,90,130,0.14)", text: "#A84068" },
  "Output Handoff Patterns": { bg: "rgba(140,110,80,0.14)", text: "#7A5E40" },
  "Failure Recovery Patterns": { bg: "rgba(200,90,68,0.14)", text: "#A84830" },
};

export function getProductCategoryColors(theme: Theme) {
  return theme === "light" ? PRODUCT_CATEGORY_COLORS_LIGHT : PRODUCT_CATEGORY_COLORS;
}

export function getReuseLevelColors(theme: Theme) {
  return theme === "light" ? REUSE_LEVEL_COLORS_LIGHT : REUSE_LEVEL_COLORS;
}

export function getPatternCategoryColors(theme: Theme) {
  return theme === "light" ? PATTERN_CATEGORY_COLORS_LIGHT : PATTERN_CATEGORY_COLORS;
}
