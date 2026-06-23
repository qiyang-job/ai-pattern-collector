"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { EMPTY_ANALYSIS } from "@/lib/constants";
import { isNotAuthenticatedError } from "@/lib/cloudbase";
import { markSessionExpired } from "@/lib/auth-store";
import { reserveNextRecordIds } from "@/lib/db";
import type { PatternAnalysisResult } from "@/lib/types";

export type CaptureAnalysisStatus = "idle" | "analyzing" | "analyzed" | "failed";

export type ReservedIds = { screenshotId: string; patternId: string };

/** 最多支持截图数量 */
export const MAX_SCREENSHOTS = 9;

type CaptureDraftState = {
  reservedIds: ReservedIds | null;
  imageDataUrl: string;
  /** 额外截图 data URL 数组 */
  extraImages: string[];
  imageMeta: string;
  videoFile: File | null;
  videoPreviewUrl: string;
  videoFileID: string;
  videoName: string;
  videoMime: string;
  videoMeta: string;
  rawNote: string;
  sourceUrl: string;
  taskContext: string;
  analysis: PatternAnalysisResult;
  analysisStatus: CaptureAnalysisStatus;
  isAnalyzing: boolean;
  showReview: boolean;
  showAdvanced: boolean;
  error: string;
  generateIds: (options?: { force?: boolean }) => Promise<void>;
  clearReservedIds: () => void;
  setImage: (dataUrl: string, meta: string) => void;
  /** 追加一张额外截图（最多 MAX_SCREENSHOTS 张总计） */
  addExtraImage: (dataUrl: string, meta: string) => void;
  /** 移除指定索引的额外截图 */
  removeExtraImage: (index: number) => void;
  /** 按全局索引移除截图（0 为主图） */
  removeImageAt: (index: number) => void;
  /** 清空所有截图 */
  clearImages: () => void;
  setVideo: (file: File, previewUrl: string, meta: string) => void;
  setVideoFileID: (fileID: string) => void;
  clearVideo: () => void;
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
  extraImages: [] as string[],
  imageMeta: "等待截图",
  videoFile: null as File | null,
  videoPreviewUrl: "",
  videoFileID: "",
  videoName: "",
  videoMime: "",
  videoMeta: "等待录屏",
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
        s.extraImages.length > 0 ||
        s.videoPreviewUrl ||
        s.videoFileID ||
        s.rawNote.trim() ||
        s.sourceUrl.trim() ||
        s.taskContext.trim() ||
        s.analysis.product.trim() ||
        s.analysis.patternName.trim() ||
        s.analysisStatus !== "idle" ||
        s.showReview,
    );
  },

  async generateIds(options) {
    if (!options?.force && get().reservedIds) return;
    try {
      set({ reservedIds: await reserveNextRecordIds(), error: "" });
    } catch (error) {
      if (isNotAuthenticatedError(error)) markSessionExpired();
      set({
        error: error instanceof Error ? error.message : "编号生成失败",
      });
    }
  },

  clearReservedIds() {
    set({ reservedIds: null });
  },

  setImage(dataUrl, meta) {
    set({
      imageDataUrl: dataUrl,
      imageMeta: meta,
      analysisStatus: "idle",
      error: "",
    });
  },

  addExtraImage(dataUrl, meta) {
    const s = get();
    const total = (s.imageDataUrl ? 1 : 0) + s.extraImages.length;
    if (total >= MAX_SCREENSHOTS) {
      set({ error: `最多支持 ${MAX_SCREENSHOTS} 张截图（当前 ${total} 张）` });
      return;
    }
    set({
      extraImages: [...s.extraImages, dataUrl],
      imageMeta: meta,
      analysisStatus: "idle",
      error: "",
    });
  },

  removeExtraImage(index) {
    set((s) => ({
      extraImages: s.extraImages.filter((_, i) => i !== index),
    }));
  },

  removeImageAt(index) {
    set((s) => {
      const extras = [...s.extraImages];
      let nextPrimary = s.imageDataUrl;

      if (index === 0) {
        if (extras.length > 0) {
          nextPrimary = extras[0];
          extras.shift();
        } else {
          nextPrimary = "";
        }
      } else {
        extras.splice(index - 1, 1);
      }

      const hasImages = Boolean(nextPrimary) || extras.length > 0;
      return {
        imageDataUrl: nextPrimary,
        extraImages: extras,
        imageMeta: hasImages ? s.imageMeta : INITIAL_DRAFT.imageMeta,
      };
    });
  },

  clearImages() {
    set({
      imageDataUrl: "",
      extraImages: [],
      imageMeta: INITIAL_DRAFT.imageMeta,
      analysisStatus: "idle",
    });
  },

  setVideo(file, previewUrl, meta) {
    const prev = get().videoPreviewUrl;
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    set({
      videoFile: file,
      videoPreviewUrl: previewUrl,
      videoName: file.name,
      videoMime: file.type,
      videoMeta: meta,
      videoFileID: "",
      analysisStatus: "idle",
      error: "",
    });
  },

  setVideoFileID(fileID) {
    set({ videoFileID: fileID });
  },

  clearVideo() {
    const prev = get().videoPreviewUrl;
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    set({
      videoFile: null,
      videoPreviewUrl: "",
      videoFileID: "",
      videoName: "",
      videoMime: "",
      videoMeta: INITIAL_DRAFT.videoMeta,
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
    const prev = get().videoPreviewUrl;
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    set({
      reservedIds: null,
      ...INITIAL_DRAFT,
      extraImages: [],
      videoFile: null,
      analysis: { ...EMPTY_ANALYSIS },
    });
  },
}));

function getCaptureSsrSnapshot(store: CaptureDraftState): CaptureDraftState {
  return {
    ...store,
    reservedIds: null,
    imageDataUrl: "",
    extraImages: [],
    imageMeta: INITIAL_DRAFT.imageMeta,
    videoFile: null,
    videoPreviewUrl: "",
    videoFileID: "",
    videoName: "",
    videoMime: "",
    videoMeta: INITIAL_DRAFT.videoMeta,
    rawNote: "",
    sourceUrl: "",
    taskContext: "",
    analysis: { ...EMPTY_ANALYSIS },
    analysisStatus: "idle",
    isAnalyzing: false,
    showReview: false,
    showAdvanced: false,
    error: "",
  };
}

/** Align first client render with SSR before Zustand in-memory state is applied. */
export function useHydratedCaptureDraft(): CaptureDraftState {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const store = useCaptureDraftStore();
  return hydrated ? store : getCaptureSsrSnapshot(store);
}
