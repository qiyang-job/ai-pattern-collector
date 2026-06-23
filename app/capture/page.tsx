"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PanelRightClose } from "lucide-react";
import { toast } from "sonner";
import {
  MAX_SCREENSHOTS,
  useHydratedCaptureDraft,
  useCaptureDraftStore,
} from "@/lib/capture-draft-store";
import { useRecordsStore } from "@/lib/records-store";
import {
  getSaveBlockers,
  PatternExtractionWorkspace,
} from "@/components/capture-workspace";
import {
  Button,
  ErrorBanner,
  PageHeader,
  textareaClass,
} from "@/components/ui";
import {
  EvidenceMediaSlot,
  ImageLightbox,
  VideoLightbox,
} from "@/components/research-ui";
import {
  MAX_VIDEO_BYTES,
  captureVideoPoster,
  formatVideoMeta,
  isVideoMime,
  uploadVideoForAnalysis,
  VIDEO_ANALYZE_FPS,
} from "@/lib/evidence-media";
import { cn } from "@/lib/utils";
import { callCloudFunction, ensureAuth, isNotAuthenticatedError } from "@/lib/cloudbase";
import { markSessionExpired } from "@/lib/auth-store";
import { prepareImagesForAnalysis, parseAnalyzeCloudResult } from "@/lib/prepare-evidence-for-analyze";

const RESEARCH_NOTE_PLACEHOLDER =
  "这张图里值得研究的交互是什么，例如：修改代码前展示待改文件并要求确认。";

const WRITING_TEMPLATE =
  "[产品] 在 [用户阶段] 通过 [界面机制] 帮用户 [解决问题]";

const CAPTURE_DRAWER_MS = 280;

function buildEvidenceFingerprint(params: {
  imageDataUrl: string;
  extraImages: string[];
  videoFileID: string;
  videoName: string;
  rawNote: string;
  product: string;
  sourceUrl: string;
  taskContext: string;
}) {
  return JSON.stringify({
    images: params.imageDataUrl ? [params.imageDataUrl, ...params.extraImages] : params.extraImages,
    video: params.videoFileID || params.videoName,
    rawNote: params.rawNote.trim(),
    product: params.product.trim(),
    sourceUrl: params.sourceUrl.trim(),
    taskContext: params.taskContext.trim(),
  });
}

const createBrowserId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `record-${Date.now()}`;

/**
 * 防御性处理 AI 返回数据，确保所有字段有安全默认值
 */
function sanitizePayload(raw: Record<string, unknown>): Record<string, unknown> {
  const safeStr = (v: unknown, fallback = ""): string => {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch { return fallback; }
  };
  
  const safeObj = (v: unknown): Record<string, unknown> => {
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    return {};
  };
  
  return {
    patternName: safeStr(raw.patternName),
    componentFamily: safeStr(raw.componentFamily),
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

function ComposerInlineField({
  zh,
  placeholder,
  value,
  onChange,
}: {
  zh: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const fieldId = `context-${zh}`;

  return (
    <div className="composer-inline-field">
      <label className="composer-inline-field-label" htmlFor={fieldId}>
        {zh}
      </label>
      <input
        id={fieldId}
        className="composer-inline-field-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function CapturePage() {
  const { saveRecord } = useRecordsStore();
  const {
    reservedIds,
    imageDataUrl,
    extraImages,
    videoFile,
    videoPreviewUrl,
    videoFileID,
    videoName,
    videoMime,
    rawNote,
    sourceUrl,
    taskContext,
    analysis,
    analysisStatus,
    isAnalyzing,
    showReview,
    error,
    generateIds,
    clearReservedIds,
    setImage,
    addExtraImage,
    removeImageAt,
    clearImages,
    setVideo,
    setVideoFileID,
    clearVideo,
    setRawNote,
    setSourceUrl,
    setTaskContext,
    setAnalysis,
    patchAnalysis,
    setAnalysisStatus,
    setIsAnalyzing,
    setShowReview,
    setError,
    resetDraft,
  } = useHydratedCaptureDraft();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoLightboxOpen, setVideoLightboxOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [drawerDismissed, setDrawerDismissed] = useState(false);
  const [drawerPresent, setDrawerPresent] = useState(false);
  const [drawerEntered, setDrawerEntered] = useState(false);
  const [analyzedFingerprint, setAnalyzedFingerprint] = useState<string | null>(null);

  const totalImages = (imageDataUrl ? 1 : 0) + extraImages.length;
  const hasVideo = Boolean(videoPreviewUrl || videoFileID);
  const hasEvidence = totalImages > 0 || hasVideo;
  const hasRawNote = Boolean(rawNote.trim());
  const hasProduct = Boolean(analysis.product.trim());
  const analyzeReady = hasEvidence && hasRawNote;
  const canExtract = analyzeReady && !isAnalyzing;

  const evidenceFingerprint = useMemo(
    () =>
      buildEvidenceFingerprint({
        imageDataUrl,
        extraImages,
        videoFileID,
        videoName,
        rawNote,
        product: analysis.product,
        sourceUrl,
        taskContext,
      }),
    [imageDataUrl, extraImages, videoFileID, videoName, rawNote, analysis.product, sourceUrl, taskContext],
  );

  const inReview = showReview || analysisStatus === "analyzed";
  const evidenceStale =
    inReview &&
    analyzedFingerprint !== null &&
    analyzedFingerprint !== evidenceFingerprint;
  const inReviewReady = inReview && !evidenceStale;
  const saveBlockers = getSaveBlockers({ hasEvidence, hasRawNote, analysis });
  const canSave = saveBlockers.length === 0;

  const handleImageFile = useCallback(async (file: File, forcePrimary = false) => {
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件。");
      return;
    }
    try {
      const dataUrl = await readAndResizeImage(file);
      const kb = Math.round(file.size / 1024);
      const meta = `${file.type} · ${kb} KB · ${new Date().toLocaleTimeString()}`;
      // 如果没有主图，或者强制设置为主图，则设为主图
      if (forcePrimary || !imageDataUrl) {
        setImage(dataUrl, meta);
        toast.success(totalImages === 0 ? "截图已粘贴" : `已添加第 ${totalImages + 1} 张截图`);
      } else if (totalImages < MAX_SCREENSHOTS) {
        // 否则添加为额外截图
        addExtraImage(dataUrl, meta);
        toast.success(`已添加第 ${totalImages + 1} 张截图`);
      } else {
        setError(`最多支持 ${MAX_SCREENSHOTS} 张截图（当前已有 ${totalImages} 张）`);
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "图片读取失败");
    }
  }, [setError, setImage, addExtraImage, imageDataUrl, totalImages]);

  const handleVideoFile = useCallback(
    async (file: File) => {
      if (!isVideoMime(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
        setError("请选择 MP4、WebM 或 MOV 录屏文件。");
        return;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        setError(`录屏文件过大（最大 ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB）`);
        return;
      }
      try {
        const previewUrl = URL.createObjectURL(file);
        setVideo(file, previewUrl, formatVideoMeta(file));
        toast.success("录屏已添加");
      } catch (e) {
        setError(e instanceof Error ? e.message : "录屏读取失败");
      }
    },
    [setError, setVideo],
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, input, [contenteditable='true']")) return;

      const file = Array.from(event.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) {
        event.preventDefault();
        void handleImageFile(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleImageFile, totalImages]);

  /** 打开预览（支持多图） */
  function handleEvidenceFile(file: File) {
    if (isVideoMime(file.type) || /\.(mp4|webm|mov)$/i.test(file.name)) {
      void handleVideoFile(file);
      return;
    }
    if (file.type.startsWith("image/")) {
      void handleImageFile(file);
    }
  }

  function openPreview(url: string, index: number) {
    const all = imageDataUrl ? [imageDataUrl, ...extraImages] : [...extraImages];
    setPreviewUrls(all);
    setPreviewIndex(index);
    setPreviewOpen(true);
  }

  async function reset() {
    setPreviewOpen(false);
    setReviewDrawerOpen(false);
    setAnalyzedFingerprint(null);
    await resetDraft();
  }

  function insertWritingTemplate() {
    if (!rawNote.trim()) {
      setRawNote(`${WRITING_TEMPLATE} `);
      return;
    }
    if (rawNote.includes(WRITING_TEMPLATE)) return;
    setRawNote(`${rawNote.trimEnd()}\n${WRITING_TEMPLATE} `);
  }

  async function analyze() {
    if (!hasEvidence) return setError("请先添加截图或录屏证据。");
    if (!rawNote.trim()) return setError("请填写研究备注。");
    setIsAnalyzing(true);
    setAnalysisStatus("analyzing");
    setDrawerDismissed(false);
    setError("");
    try {
      await ensureAuth();
      const allImages = imageDataUrl ? [imageDataUrl, ...extraImages] : [...extraImages];
      const analyzeContext = {
        rawNote,
        product: analysis.product,
        sourceUrl,
        taskContext,
      };
      const storageKey = reservedIds?.screenshotId || `draft-${Date.now()}`;
      const compressedImages = await prepareImagesForAnalysis(allImages, analyzeContext, {
        storageKeyPrefix: storageKey,
        onProgress: (msg) => toast.loading(msg, { id: "analyze-upload" }),
      });
      toast.dismiss("analyze-upload");

      let videoUrl: string | undefined;
      let nextVideoFileID = videoFileID;

      if (videoFile) {
        const uploadKey = reservedIds?.screenshotId || `draft-${Date.now()}`;
        toast.loading("正在上传录屏…", { id: "video-upload" });
        const uploaded = await uploadVideoForAnalysis(uploadKey, videoFile, (msg) => {
          toast.loading(msg, { id: "video-upload" });
        });
        toast.dismiss("video-upload");
        videoUrl = uploaded.videoUrl;
        nextVideoFileID = uploaded.fileID;
        setVideoFileID(uploaded.fileID);
      } else if (videoFileID) {
        const { getImageTempUrl } = await import("@/lib/db");
        videoUrl = (await getImageTempUrl(videoFileID)) ?? undefined;
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
      const nextProduct = (sanitized.product as string) || analysis.product;
      setAnalysis({ ...sanitized, product: nextProduct } as any);
      setAnalysisStatus("analyzed");
      setShowReview(true);
      setReviewDrawerOpen(true);
      setDrawerDismissed(false);
      setAnalyzedFingerprint(
        buildEvidenceFingerprint({
          imageDataUrl,
          extraImages,
          videoFileID: nextVideoFileID,
          videoName,
          rawNote,
          product: nextProduct,
          sourceUrl,
          taskContext,
        }),
      );
      toast.success("模式提炼完成，请校对后保存");
    } catch (e) {
      toast.dismiss("analyze-upload");
      toast.dismiss("video-upload");
      if (isNotAuthenticatedError(e)) markSessionExpired();
      setAnalysisStatus("failed");
      setDrawerDismissed(false);
      setError(
        isNotAuthenticatedError(e)
          ? "登录已过期，请重新登录后再提炼"
          : e instanceof Error
            ? e.message
            : "AI 分析失败",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function save() {
    if (!canSave) return;
    // 每次保存都重新分配，避免复用上次未落库或已漂高的预占编号
    clearReservedIds();
    await generateIds({ force: true });
    const ids = useCaptureDraftStore.getState().reservedIds;
    if (!ids) return;
    const now = new Date().toISOString();
    let poster = imageDataUrl;
    if (!poster && videoFile) {
      poster = await captureVideoPoster(videoFile);
    }
    const state = useCaptureDraftStore.getState();
    await saveRecord({
      id: createBrowserId(),
      screenshotId: ids.screenshotId,
      imageDataUrl: poster,
      ...(extraImages.length > 0 ? { extraImages } : {}),
      ...(state.videoFileID
        ? {
            videoFileID: state.videoFileID,
            videoName: state.videoName || undefined,
            videoMime: state.videoMime || undefined,
          }
        : {}),
      rawNote,
      sourceUrl: sourceUrl || undefined,
      taskContext: taskContext || undefined,
      patternId: ids.patternId,
      ...analysis,
      createdAt: now,
      updatedAt: now,
    });
    toast.success("模式记录已保存");
    window.setTimeout(() => {
      void reset();
    }, 1400);
  }

  function handleBottomAction() {
    if (isAnalyzing) return;
    if (inReviewReady) {
      setReviewDrawerOpen(true);
      setDrawerDismissed(false);
      return;
    }
    void analyze();
  }

  const bottomActionLabel = isAnalyzing
    ? "AI 正在提炼…"
    : inReviewReady
      ? "打开 Review 校对"
      : "提取设计模式";

  const drawerIntent =
    isAnalyzing ||
    analysisStatus === "failed" ||
    (reviewDrawerOpen && inReviewReady);

  const drawerOpen = drawerIntent && !drawerDismissed;

  function closeDrawer() {
    setDrawerDismissed(true);
    if (inReviewReady) {
      setReviewDrawerOpen(false);
    }
  }

  const drawerPhase = isAnalyzing
    ? "extracting"
    : analysisStatus === "failed"
      ? "failed"
      : "review";

  const drawerTitle = drawerPhase === "extracting"
    ? "正在提炼模式"
    : drawerPhase === "failed"
      ? "提炼失败"
      : "结果校对";

  useEffect(() => {
    if (evidenceStale) {
      setReviewDrawerOpen(false);
    }
  }, [evidenceStale]);

  useEffect(() => {
    if (drawerOpen) {
      setDrawerPresent(true);
      let enterFrame = 0;
      const mountFrame = requestAnimationFrame(() => {
        enterFrame = requestAnimationFrame(() => setDrawerEntered(true));
      });
      return () => {
        cancelAnimationFrame(mountFrame);
        cancelAnimationFrame(enterFrame);
      };
    }

    setDrawerEntered(false);
    const timer = window.setTimeout(() => setDrawerPresent(false), CAPTURE_DRAWER_MS);
    return () => window.clearTimeout(timer);
  }, [drawerOpen]);

  return (
    <div className="capture-workbench flex-1">
      <PageHeader
        title="采集"
        description="粘贴截图或上传录屏与研究备注，提炼 AI 产品设计模式。"
      />

      <div className="capture-columns">
        <div className="capture-evidence-column">
          <div className="capture-evidence-body">
            <EvidenceMediaSlot
              imageUrls={imageDataUrl ? [imageDataUrl, ...extraImages] : extraImages}
              videoUrl={videoPreviewUrl || undefined}
              onFileSelect={handleEvidenceFile}
              onRemoveImage={removeImageAt}
              onRemoveVideo={clearVideo}
              onPreviewImage={openPreview}
              onPlayVideo={() => setVideoLightboxOpen(true)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                const video = files.find((x) => isVideoMime(x.type) || /\.(mp4|webm|mov)$/i.test(x.name));
                const image = files.find((x) => x.type.startsWith("image/"));
                if (video) void handleVideoFile(video);
                else if (image) void handleImageFile(image);
              }}
            />

            <div className="composer-evidence-card">
              <div className="composer-evidence-card-header">
                <div className="composer-evidence-card-title">研究备注</div>
                <span className="composer-label-mark">必填</span>
              </div>

              <textarea
                className={cn(textareaClass, "composer-evidence-card-input")}
                placeholder={RESEARCH_NOTE_PLACEHOLDER}
                value={rawNote}
                onChange={(e) => setRawNote(e.target.value)}
              />

              <div className="composer-evidence-card-footer">
                <button
                  type="button"
                  className="composer-evidence-card-template"
                  onClick={insertWritingTemplate}
                >
                  句式：{WRITING_TEMPLATE}
                </button>
              </div>

              <div className="composer-evidence-card-divider" aria-hidden="true" />

              <div className="composer-evidence-card-context">
                <div className="composer-evidence-card-fields">
                  <ComposerInlineField
                    zh="产品"
                    placeholder="AI 产品，如 Cursor、Claude、Notion AI"
                    value={analysis.product}
                    onChange={(value) => patchAnalysis({ product: value })}
                  />

                  <ComposerInlineField
                    zh="当时任务"
                    placeholder="具体任务，如总结论文、生成 PRD、批量改代码"
                    value={taskContext}
                    onChange={setTaskContext}
                  />

                  <ComposerInlineField
                    zh="来源链接"
                    placeholder="页面或功能 URL，便于回溯证据"
                    value={sourceUrl}
                    onChange={setSourceUrl}
                  />
                </div>
              </div>
            </div>

            {error ? <ErrorBanner message={error} /> : null}
          </div>
        </div>
      </div>

      <div className="capture-bottom-action" role="region" aria-label="提炼模式操作">
        <Button
          onClick={handleBottomAction}
          disabled={isAnalyzing || (!inReviewReady && !canExtract)}
        >
          {bottomActionLabel}
        </Button>
      </div>

      {drawerPresent ? (
        <div className="capture-drawer-layer">
          <button
            type="button"
            className="capture-drawer-backdrop"
            aria-label="关闭面板"
            onClick={closeDrawer}
          />
          <aside
            className={cn("capture-review-drawer", drawerEntered && "is-open")}
            role="dialog"
            aria-modal="true"
            aria-label={drawerTitle}
            aria-hidden={!drawerEntered}
          >
            {drawerPhase !== "extracting" ? (
              <header className="capture-drawer-header page-gutter-x">
                <div className="min-w-0">
                  <div className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-weak)]">
                    Pattern Review
                  </div>
                  <h2 className="capture-drawer-title display-serif">{drawerTitle}</h2>
                </div>
                {drawerPhase === "review" ? (
                  <button
                    type="button"
                    className="evidence-recap-edit focus-ring"
                    onClick={closeDrawer}
                    aria-label="收起"
                    title="收起"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </header>
            ) : null}
            <PatternExtractionWorkspace
              phase={drawerPhase}
              hasProduct={hasProduct}
              isAnalyzing={isAnalyzing}
              patternId={reservedIds?.patternId}
              screenshotId={reservedIds?.screenshotId}
              analysis={analysis}
              saveBlockers={saveBlockers}
              canSave={canSave}
              onRetry={analyze}
              onManualFill={() => {
                setShowReview(true);
                setReviewDrawerOpen(true);
                setDrawerDismissed(false);
              }}
              onChange={setAnalysis}
              onSave={save}
            />
            {drawerPhase !== "review" && error ? (
              <div className="px-3 pb-3">
                <ErrorBanner message={error} />
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {previewOpen && previewUrls.length > 0 ? (
        <ImageLightbox
          images={previewUrls}
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
    </div>
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
