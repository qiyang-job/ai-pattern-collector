"use client";

import { create } from "zustand";
import { EMPTY_ANALYSIS } from "@/lib/constants";
import { reserveNextRecordIds } from "@/lib/db";
import type { PatternAnalysisResult } from "@/lib/types";

export type CaptureAnalysisStatus = "idle" | "analyzing" | "analyzed" | "failed";

export type ReservedIds = { screenshotId: string; patternId: string };

type CaptureDraftState = {
  reservedIds: ReservedIds | null;
  imageDataUrl: string;
  imageMeta: string;
  rawNote: string;
  sourceUrl: string;
  taskContext: string;
  analysis: PatternAnalysisResult;
  analysisStatus: CaptureAnalysisStatus;
  isAnalyzing: boolean;
  showReview: boolean;
  showAdvanced: boolean;
  error: string;
  ensureIds: () => Promise<void>;
  setImage: (dataUrl: string, meta: string) => void;
  setRawNote: (value: string) => void;
  setSourceUrl: (value: string) => void;
  setTaskContext: (value: string) => void;
  setAnalysis: (value: PatternAnalysisResult) => void;
  patchAnalysis: (patch: Partial<PatternAnalysisResult>) => void;
  setAnalysisStatus: (status: CaptureAnalysisStatus) => void;
  setIsAnalyzing: (value: boolean) => void;
  setShowReview: (value: boolean) => void;
  toggleAdvanced: () => void;
  setError: (message: string) => void;
  resetDraft: () => Promise<void>;
  hasDraftContent: () => boolean;
};

const INITIAL_DRAFT = {
  imageDataUrl: "",
  imageMeta: "等待截图",
  rawNote: "",
  sourceUrl: "",
  taskContext: "",
  analysis: EMPTY_ANALYSIS,
  analysisStatus: "idle" as const,
  isAnalyzing: false,
  showReview: false,
  showAdvanced: false,
  error: "",
};

export const useCaptureDraftStore = create<CaptureDraftState>((set, get) => ({
  reservedIds: null,
  ...INITIAL_DRAFT,

  hasDraftContent() {
    const s = get();
    return Boolean(
      s.imageDataUrl ||
        s.rawNote.trim() ||
        s.sourceUrl.trim() ||
        s.taskContext.trim() ||
        s.analysis.product.trim() ||
        s.analysis.patternName.trim() ||
        s.analysisStatus !== "idle" ||
        s.showReview,
    );
  },

  async ensureIds() {
    if (get().reservedIds) return;
    try {
      set({ reservedIds: await reserveNextRecordIds(), error: "" });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "编号生成失败",
      });
    }
  },

  setImage(dataUrl, meta) {
    set({
      imageDataUrl: dataUrl,
      imageMeta: meta,
      analysisStatus: "idle",
      error: "",
    });
  },

  setRawNote(value) {
    set({ rawNote: value });
  },

  setSourceUrl(value) {
    set({ sourceUrl: value });
  },

  setTaskContext(value) {
    set({ taskContext: value });
  },

  setAnalysis(value) {
    set({ analysis: value });
  },

  patchAnalysis(patch) {
    set({ analysis: { ...get().analysis, ...patch } });
  },

  setAnalysisStatus(status) {
    set({ analysisStatus: status });
  },

  setIsAnalyzing(value) {
    set({ isAnalyzing: value });
  },

  setShowReview(value) {
    set({ showReview: value });
  },

  toggleAdvanced() {
    set({ showAdvanced: !get().showAdvanced });
  },

  setError(message) {
    set({ error: message });
  },

  async resetDraft() {
    try {
      const reservedIds = await reserveNextRecordIds();
      set({
        reservedIds,
        ...INITIAL_DRAFT,
        analysis: { ...EMPTY_ANALYSIS },
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "编号生成失败",
      });
    }
  },
}));
