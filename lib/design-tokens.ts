import type { PatternCategory, ProductCategory, ReuseLevel } from "@/lib/types";

export const tokens = {
  bg: "#F7F7F4",
  panel: "#FFFFFF",
  panelMuted: "#F2F2EE",
  border: "#E4E4DE",
  text: "#111111",
  textMuted: "#666666",
  textWeak: "#999999",
  accent: "#3B5BDB",
  accentMuted: "#EEF2FF",
  success: "#2F9E44",
  warning: "#F08C00",
  danger: "#D9480F",
} as const;

export const PRODUCT_CATEGORY_COLORS: Record<ProductCategory, { bg: string; text: string }> = {
  "AI Chat": { bg: "#E8F0FE", text: "#2F4A8A" },
  "AI Search": { bg: "#E6F6F8", text: "#1F5C66" },
  "Agent Task": { bg: "#F0EBFA", text: "#5A3F8C" },
  "AI Workspace": { bg: "#EAF5EA", text: "#2F6B3A" },
  "Coding Agent": { bg: "#FDF4E6", text: "#8A5A12" },
};

export const REUSE_LEVEL_COLORS: Record<ReuseLevel, { bg: string; text: string }> = {
  High: { bg: "#EAF5EA", text: "#2F6B3A" },
  Medium: { bg: "#FDF4E6", text: "#8A5A12" },
  Low: { bg: "#F2F2EE", text: "#666666" },
};

export const PATTERN_CATEGORY_COLORS: Record<PatternCategory, { bg: string; text: string }> = {
  "Intent Input Patterns": { bg: "#E8F0FE", text: "#2F4A8A" },
  "Context Management Patterns": { bg: "#E6F6F8", text: "#1F5C66" },
  "Planning & Reasoning Patterns": { bg: "#F0EBFA", text: "#5A3F8C" },
  "Execution Feedback Patterns": { bg: "#EAF5EA", text: "#2F6B3A" },
  "Trust & Verification Patterns": { bg: "#FDF4E6", text: "#8A5A12" },
  "Output Handoff Patterns": { bg: "#F5F0E8", text: "#6B5344" },
};
