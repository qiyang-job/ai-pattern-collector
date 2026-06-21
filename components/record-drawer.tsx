"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Braces, Trash2 } from "lucide-react";
import { RecordForm } from "@/components/record-form";
import { ExtractingPanel } from "@/components/extracting-panel";
import { RecordPreview } from "@/components/record-preview";
import { ReviewDrawerShell } from "@/components/review-drawer-shell";
import {
  Button,
  DualLabel,
  Field,
  formTextareaClass,
  inputClass,
} from "@/components/ui";
import {
  EvidenceMediaSlot,
  FormModule,
  ImageLightbox,
  VideoLightbox,
} from "@/components/research-ui";
import { MAX_SCREENSHOTS } from "@/lib/capture-draft-store";
import { recordToMarkdown, recordsToJson } from "@/lib/export";
import { getImageTempUrl } from "@/lib/db";
import {
  MAX_VIDEO_BYTES,
  isVideoMime,
  captureVideoPoster,
  uploadVideoForAnalysis,
  VIDEO_ANALYZE_FPS,
} from "@/lib/evidence-media";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternAnalysisResult, PatternRecord } from "@/lib/types";
import { cn, downloadTextFile, formatDate } from "@/lib/utils";
import { callCloudFunction, ensureAuth } from "@/lib/cloudbase";
import { prepareImagesForAnalysis, parseAnalyzeCloudResult } from "@/lib/prepare-evidence-for-analyze";

export function RecordDrawer({
  record,
  onClose,
}: {
  record: PatternRecord | null;
  onClose: () => void;
}) {
  if (!record) return null;
  return <RecordDrawerContent key={record.id} record={record} onClose={onClose} />;
}

function RecordDrawerContent({
  record,
  onClose,
}: {
  record: PatternRecord;
  onClose: () => void;
}) {
  const { saveRecord, deleteRecord } = useRecordsStore();
  const [draft, setDraft] = useState<PatternRecord>(record);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoLightboxOpen, setVideoLightboxOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);

  const extraImages = Array.isArray(draft.extraImages) ? draft.extraImages : [];
  const allImages = draft.imageDataUrl
    ? [draft.imageDataUrl, ...extraImages]
    : extraImages;
  const hasVideo = Boolean(videoPreviewUrl || draft.videoFileID || pendingVideoFile);
  const hasEvidence = allImages.length > 0 || hasVideo;

  useEffect(() => {
    let cancelled = false;
    if (pendingVideoFile) return;

    async function loadVideoUrl() {
      if (!draft.videoFileID) {
        setVideoPreviewUrl("");
        return;
      }
      const url = await getImageTempUrl(draft.videoFileID);
      if (!cancelled) {
        setVideoPreviewUrl(url ?? "");
      }
    }

    void loadVideoUrl();
    return () => {
      cancelled = true;
    };
  }, [draft.videoFileID, pendingVideoFile]);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件。");
        return;
      }
      try {
        const dataUrl = await readAndResizeImage(file);
        const total = allImages.length;
        if (total >= MAX_SCREENSHOTS) {
          toast.error(`最多支持 ${MAX_SCREENSHOTS} 张截图（当前已有 ${total} 张）`);
          return;
        }
        setDraft((prev) => {
          if (!prev.imageDataUrl) {
            return { ...prev, imageDataUrl: dataUrl };
          }
          return {
            ...prev,
            extraImages: [...(prev.extraImages ?? []), dataUrl],
          };
        });
        toast.success(total === 0 ? "截图已粘贴" : `已添加第 ${total + 1} 张截图`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "图片读取失败");
      }
    },
    [allImages.length],
  );

  useEffect(() => {
    if (isAnalyzing) return;

    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, input, [contenteditable='true']")) return;

      const file = Array.from(event.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );
      if (!file) return;

      event.preventDefault();
      void handleImageFile(file);
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleImageFile, isAnalyzing]);

  const handleVideoFile = useCallback(async (file: File) => {
    if (!isVideoMime(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
      toast.error("请选择 MP4、WebM 或 MOV 录屏文件。");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(`录屏文件过大（最大 ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB）`);
      return;
    }
    try {
      const previewUrl = URL.createObjectURL(file);
      setPendingVideoFile(file);
      setVideoPreviewUrl(previewUrl);
      setDraft((prev) => ({
        ...prev,
        videoFileID: undefined,
        videoName: file.name,
        videoMime: file.type,
      }));
      toast.success("录屏已添加");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "录屏读取失败");
    }
  }, []);

  function clearVideo() {
    if (videoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setPendingVideoFile(null);
    setVideoPreviewUrl("");
    setDraft((prev) => ({
      ...prev,
      videoFileID: undefined,
      videoName: undefined,
      videoMime: undefined,
    }));
  }

  function handleEvidenceFile(file: File) {
    if (isVideoMime(file.type) || /\.(mp4|webm|mov)$/i.test(file.name)) {
      void handleVideoFile(file);
      return;
    }
    if (file.type.startsWith("image/")) {
      void handleImageFile(file);
    }
  }

  function removeImageAt(index: number) {
    setDraft((prev) => {
      const extras = [...(prev.extraImages ?? [])];
      let nextPrimary = prev.imageDataUrl;

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

      return {
        ...prev,
        imageDataUrl: nextPrimary,
        extraImages: extras,
      };
    });
  }

  const analysisValue: PatternAnalysisResult = {
    product: draft.product,
    productCategory: draft.productCategory,
    journeyStage: draft.journeyStage,
    screenshotState: draft.screenshotState,
    secondaryScreenshotStates: Array.isArray(draft.secondaryScreenshotStates)
      ? draft.secondaryScreenshotStates
      : [],
    screenshotStateReason: draft.screenshotStateReason ?? "",
    patternName: draft.patternName,
    patternCategory: draft.patternCategory,
    userProblem: draft.userProblem,
    aiCapability: draft.aiCapability,
    uiAnatomy: draft.uiAnatomy,
    interactionRule: draft.interactionRule,
    systemFeedback: draft.systemFeedback,
    trustMechanism: draft.trustMechanism,
    failureHandling: draft.failureHandling,
    reuseLevel: draft.reuseLevel,
    designJudgment: draft.designJudgment,
    lensScore: draft.lensScore,
    tags: draft.tags,
  };

  async function saveDraft() {
    try {
      let next: PatternRecord = { ...draft, updatedAt: new Date().toISOString() };
      if (pendingVideoFile) {
        toast.loading("正在上传录屏…", { id: "drawer-video-upload" });
        const uploaded = await uploadVideoForAnalysis(draft.screenshotId, pendingVideoFile);
        toast.dismiss("drawer-video-upload");
        if (!next.imageDataUrl) {
          next.imageDataUrl = await captureVideoPoster(pendingVideoFile);
        }
        next = {
          ...next,
          videoFileID: uploaded.fileID,
          videoName: pendingVideoFile.name,
          videoMime: pendingVideoFile.type,
        };
        setPendingVideoFile(null);
      }
      setDraft(next);
      await saveRecord(next);
      toast.success("记录已更新。");
    } catch (err) {
      toast.dismiss("drawer-video-upload");
      const msg = err instanceof Error ? err.message : JSON.stringify(err ?? {});
      console.error("[saveDraft] 保存失败:", err);
      toast.error(`保存失败: ${msg}`);
    }
  }

  async function removeDraft() {
    if (!window.confirm(`确认删除 ${draft.patternId}？`)) return;
    try {
      await deleteRecord(draft.id);
      toast.success("记录已删除。");
      onClose();
    } catch (err) {
      console.error("[removeDraft] 删除失败:", err);
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(recordToMarkdown(draft));
    toast.success("Markdown 已复制。");
  }

  async function reanalyze() {
    if (!hasEvidence) {
      toast.error("该记录没有截图或录屏，无法重新提取。");
      return;
    }
    if (!draft.rawNote?.trim()) {
      toast.error("该记录没有备注，无法重新提取。请先填写研究备注。");
      return;
    }

    setIsAnalyzing(true);
    try {
      await ensureAuth();

      const analyzeContext = {
        rawNote: draft.rawNote,
        product: draft.product,
        sourceUrl: draft.sourceUrl ?? "",
        taskContext: draft.taskContext ?? "",
      };
      const compressedImages = await prepareImagesForAnalysis(allImages, analyzeContext, {
        storageKeyPrefix: draft.screenshotId,
        onProgress: (msg) => toast.loading(msg, { id: "drawer-analyze-upload" }),
      });
      toast.dismiss("drawer-analyze-upload");

      let videoUrl: string | undefined;
      let nextVideoFileID = draft.videoFileID;

      if (pendingVideoFile) {
        toast.loading("正在上传录屏…", { id: "drawer-reanalyze-video" });
        const uploaded = await uploadVideoForAnalysis(draft.screenshotId, pendingVideoFile);
        toast.dismiss("drawer-reanalyze-video");
        videoUrl = uploaded.videoUrl;
        nextVideoFileID = uploaded.fileID;
      } else if (draft.videoFileID) {
        videoUrl = (await getImageTempUrl(draft.videoFileID)) ?? undefined;
        if (!videoUrl) throw new Error("录屏临时链接失效，请重新上传录屏");
      }

      const rawPayload = await callCloudFunction<Record<string, unknown>>("ai-analyze-pattern", {
        ...(compressedImages.length > 0
          ? { imageDataUrls: compressedImages, imageDataUrl: compressedImages[0] }
          : {}),
        ...(videoUrl ? { videoUrl, videoFps: VIDEO_ANALYZE_FPS } : {}),
        ...analyzeContext,
      });

      const payload = parseAnalyzeCloudResult(rawPayload);
      const sanitized = sanitizePayload(payload);

      setDraft((prev) => ({
        ...prev,
        ...sanitized,
        ...(nextVideoFileID
          ? {
              videoFileID: nextVideoFileID,
              videoName: pendingVideoFile?.name ?? prev.videoName,
              videoMime: pendingVideoFile?.type ?? prev.videoMime,
            }
          : {}),
        updatedAt: new Date().toISOString(),
      }));
      if (pendingVideoFile) {
        setPendingVideoFile(null);
      }
      toast.success("重新提取完成，请检查并保存。");
    } catch (err) {
      toast.dismiss("drawer-analyze-upload");
      toast.dismiss("drawer-reanalyze-video");
      toast.error(err instanceof Error ? err.message : "重新提取失败");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const createdLabel = formatDate(draft.createdAt);
  const updatedLabel = formatDate(draft.updatedAt);
  const timeLabel =
    createdLabel === updatedLabel
      ? createdLabel
      : `${createdLabel} · 更新 ${updatedLabel}`;

  return (
    <>
      <ReviewDrawerShell
        kicker="Record Inspector"
        title={isAnalyzing ? "正在重新提取" : draft.patternName || "未命名模式"}
        ariaLabel={isAnalyzing ? "正在重新提取" : `记录校对 ${draft.patternId}`}
        onClose={onClose}
        hideClose={isAnalyzing}
        hideHeader={isAnalyzing}
        headerActions={
          isAnalyzing ? null : (
            <>
              <DrawerIconButton label="删除" onClick={removeDraft} danger>
                <Trash2 className="h-3.5 w-3.5" />
              </DrawerIconButton>
              <span className="drawer-header-divider" aria-hidden="true" />
              <DrawerIconButton label="复制 Markdown" onClick={copyMarkdown}>
                <Copy className="h-3.5 w-3.5" />
              </DrawerIconButton>
              <DrawerIconButton
                label="导出 JSON"
                onClick={() =>
                  downloadTextFile(
                    `${draft.patternId}.json`,
                    recordsToJson([draft]),
                    "application/json",
                  )
                }
              >
                <Braces className="h-3.5 w-3.5" />
              </DrawerIconButton>
            </>
          )
        }
        footer={
          isAnalyzing ? undefined : (
            <div className="workspace-save-footer">
              <div className="workspace-save-actions">
                <Button variant="primary" onClick={saveDraft}>
                  保存记录
                </Button>
                <Button variant="secondary" onClick={reanalyze}>
                  重新提取
                </Button>
              </div>
              <div className="workspace-save-meta">
                <p className="workspace-save-destinations text-[10px] leading-5 text-[var(--text-muted)]">
                  {timeLabel}
                </p>
              </div>
            </div>
          )
        }
      >
        <div className="pattern-workspace pattern-workspace--flush">
          <div
            className={cn(
              "pattern-workspace-body",
              isAnalyzing && "pattern-workspace-body--extracting",
            )}
          >
            {isAnalyzing ? (
              <ExtractingPanel hasProduct={Boolean(draft.product.trim())} />
            ) : (
              <div className="workspace-review">
                <RecordPreview
                patternId={draft.patternId}
                screenshotId={draft.screenshotId}
                analysis={analysisValue}
                previewLabel="记录预览 · Record Preview"
              />

              <FormModule
                letter="Ev"
                title="证据上下文"
                description="截图、录屏、研究备注与采集时的任务上下文"
              >
                <EvidenceMediaSlot
                  imageUrls={allImages}
                  videoUrl={videoPreviewUrl || undefined}
                  onFileSelect={handleEvidenceFile}
                  onRemoveImage={removeImageAt}
                  onRemoveVideo={hasVideo ? clearVideo : undefined}
                  onPreviewImage={(_url, index) => {
                    setPreviewIndex(index);
                    setPreviewOpen(true);
                  }}
                  onPlayVideo={() => setVideoLightboxOpen(true)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    const video = files.find(
                      (f) => isVideoMime(f.type) || /\.(mp4|webm|mov)$/i.test(f.name),
                    );
                    const image = files.find((f) => f.type.startsWith("image/"));
                    if (video) void handleVideoFile(video);
                    else if (image) void handleImageFile(image);
                  }}
                />

                <div className="capture-form-stack">
                  <Field label={<DualLabel zh="研究备注" en="Research Note" />} compact>
                    <textarea
                      className={formTextareaClass}
                      rows={3}
                      value={draft.rawNote}
                      onChange={(e) => setDraft({ ...draft, rawNote: e.target.value })}
                    />
                  </Field>
                  <div className="capture-form-grid">
                    <Field label={<DualLabel zh="来源链接" en="Source URL" />} compact>
                      <input
                        className={inputClass}
                        value={draft.sourceUrl ?? ""}
                        onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
                      />
                    </Field>
                    <Field label={<DualLabel zh="当时任务" en="Task Context" />} compact>
                      <input
                        className={inputClass}
                        placeholder="例如：让 AI 重构 auth 模块…"
                        value={draft.taskContext ?? ""}
                        onChange={(e) => setDraft({ ...draft, taskContext: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              </FormModule>

              <RecordForm
                variant="capture"
                value={analysisValue}
                patternId={draft.patternId}
                onChange={(next) => setDraft({ ...draft, ...next })}
              />
            </div>
            )}
          </div>
        </div>
      </ReviewDrawerShell>

      {previewOpen && allImages.length > 0 ? (
        <ImageLightbox
          images={allImages}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}

      {videoLightboxOpen && videoPreviewUrl ? (
        <VideoLightbox
          src={videoPreviewUrl}
          onClose={() => setVideoLightboxOpen(false)}
        />
      ) : null}
    </>
  );
}

function DrawerIconButton({
  label,
  onClick,
  children,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn("evidence-recap-edit focus-ring", danger && "evidence-recap-edit--danger")}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

async function readAndResizeImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const max = 1920;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      if (scale === 1) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function sanitizePayload(raw: Record<string, unknown>): Record<string, unknown> {
  const safeStr = (v: unknown, fallback = ""): string => {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "string") return v;
    try {
      return JSON.stringify(v);
    } catch {
      return fallback;
    }
  };

  return {
    patternName: safeStr(raw.patternName),
    patternCategory: safeStr(raw.patternCategory),
    product: safeStr(raw.product),
    productCategory: safeStr(raw.productCategory),
    journeyStage: safeStr(raw.journeyStage),
    screenshotState: safeStr(raw.screenshotState),
    secondaryScreenshotStates: Array.isArray(raw.secondaryScreenshotStates)
      ? raw.secondaryScreenshotStates.filter((s) => typeof s === "string")
      : [],
    screenshotStateReason: safeStr(raw.screenshotStateReason),
    userProblem: safeStr(raw.userProblem),
    aiCapability: safeStr(raw.aiCapability),
    uiAnatomy: safeStr(raw.uiAnatomy),
    interactionRule: safeStr(raw.interactionRule),
    systemFeedback: safeStr(raw.systemFeedback),
    trustMechanism: safeStr(raw.trustMechanism),
    failureHandling: safeStr(raw.failureHandling),
    reuseLevel: safeStr(raw.reuseLevel, "Low"),
    designJudgment: safeStr(raw.designJudgment),
    lensScore: raw.lensScore && typeof raw.lensScore === "object" ? raw.lensScore : {},
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}
