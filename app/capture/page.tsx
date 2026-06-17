"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useHydratedCaptureDraft, useCaptureDraftStore } from "@/lib/capture-draft-store";
import { useRecordsStore } from "@/lib/records-store";
import {
  CapturePipeline,
  getActiveStep,
  type EvidenceStepStatus,
  type ExtractStepStatus,
  type ReviewStepStatus,
} from "@/components/capture-pipeline";
import {
  getSaveBlockers,
  PatternExtractionWorkspace,
} from "@/components/capture-workspace";
import {
  Button,
  ErrorBanner,
  textareaClass,
} from "@/components/ui";
import {
  ImageLightbox,
  MultiImageEvidenceSlot,
} from "@/components/research-ui";
import { cn } from "@/lib/utils";
import { callCloudFunction } from "@/lib/cloudbase";

const RESEARCH_NOTE_PLACEHOLDER =
  "这张图里值得研究的交互是什么，例如：修改代码前展示待改文件并要求确认。";

const WRITING_TEMPLATE =
  "[产品] 在 [用户阶段] 通过 [界面机制] 帮用户 [解决问题]";

const createBrowserId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `record-${Date.now()}`;

/**
 * 压缩图片 base64，确保不超过云函数 6MB 入参限制
 * - 缩放到最大 1920px 宽度
 * - JPEG 质量 0.75
 */
async function compressImage(dataUrl: string): Promise<string> {
  // 已经很小就不处理
  if (dataUrl.length < 2_000_000) return dataUrl;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 1920;
      const MAX_H = 1920;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      
      if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      
      // 先试 0.75 quality
      let result = canvas.toDataURL("image/jpeg", 0.75);
      // 如果还是太大（>4MB），继续降低质量
      if (result.length > 4_000_000) {
        for (const q of [0.6, 0.5, 0.4]) {
          result = canvas.toDataURL("image/jpeg", q);
          if (result.length <= 4_000_000) break;
        }
      }
      
      URL.revokeObjectURL(img.src as string);
      resolve(result);
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = dataUrl;
  });
}

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
        className="composer-inline-field-input focus-ring"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function CapturePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveRecord } = useRecordsStore();
  const {
    reservedIds,
    imageDataUrl,
    extraImages,
    rawNote,
    sourceUrl,
    taskContext,
    analysis,
    analysisStatus,
    isAnalyzing,
    showReview,
    error,
    ensureIds,
    generateIds,
    setImage,
    addExtraImage,
    removeExtraImage,
    clearImages,
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
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);

  const totalImages = (imageDataUrl ? 1 : 0) + extraImages.length;
  const hasEvidence = totalImages > 0;
  const hasRawNote = Boolean(rawNote.trim());
  const hasProduct = Boolean(analysis.product.trim());
  const analyzeReady = hasEvidence && hasRawNote;
  const canExtract = analyzeReady && !isAnalyzing;

  const saveBlockers = getSaveBlockers({ hasEvidence, hasRawNote, analysis });
  const canSave = saveBlockers.length === 0;

  const inReview = showReview || analysisStatus === "analyzed";
  const evidenceStatus: EvidenceStepStatus = !hasEvidence
    ? "缺失截图"
    : !hasRawNote
      ? "缺失备注"
      : "证据就绪";

  const extractStatus: ExtractStepStatus = isAnalyzing
    ? "提炼中"
    : analysisStatus === "analyzed"
      ? "已完成"
      : analysisStatus === "failed"
        ? "提炼失败"
        : analyzeReady
          ? "可提炼"
          : "尚未提炼";

  const reviewStatus: ReviewStepStatus = !inReview
    ? "已锁定"
    : canSave
      ? "可保存"
      : "需校对";

  const activeStep = getActiveStep({
    savedFlash,
    inReview,
    isAnalyzing,
    analyzeReady,
    evidenceReady: evidenceStatus === "证据就绪",
  });

  useEffect(() => {
    ensureIds();
  }, [ensureIds]);

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
      } else if (totalImages < 5) {
        // 否则添加为额外截图
        addExtraImage(dataUrl, meta);
        toast.success(`已添加第 ${totalImages + 1} 张截图`);
      } else {
        setError(`最多支持 5 张截图（当前已有 ${totalImages} 张）`);
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "图片读取失败");
    }
  }, [setError, setImage, addExtraImage, imageDataUrl, totalImages]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) {
        event.preventDefault();
        void handleImageFile(file);
        toast.success(totalImages === 0 ? "截图已粘贴" : `已添加第 ${totalImages + 1} 张截图`);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleImageFile, totalImages]);

  /** 打开预览（支持多图） */
  function openPreview(url: string, index: number) {
    const all = imageDataUrl ? [imageDataUrl, ...extraImages] : [...extraImages];
    setPreviewUrls(all);
    setPreviewIndex(index);
    setPreviewOpen(true);
  }

  function previewNext() {
    setPreviewIndex((i) => Math.min(i + 1, previewUrls.length - 1));
  }

  function previewPrev() {
    setPreviewIndex((i) => Math.max(i - 1, 0));
  }

  async function reset() {
    setPreviewOpen(false);
    setSavedFlash(false);
    setReviewDrawerOpen(false);
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
    if (totalImages === 0) return setError("请先添加截图证据。");
    if (!rawNote.trim()) return setError("请填写研究备注。");
    setIsAnalyzing(true);
    setAnalysisStatus("analyzing");
    setError("");
    try {
      // 收集所有图片并压缩
      const allImages = imageDataUrl ? [imageDataUrl, ...extraImages] : [...extraImages];
      const compressedImages = await Promise.all(allImages.map(img => compressImage(img)));
      const totalBefore = allImages.reduce((s, u) => s + u.length, 0);
      const totalAfter = compressedImages.reduce((s, u) => s + u.length, 0);
      console.log(`[AI] ${allImages.length}张图片压缩: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);

      const rawPayload = await callCloudFunction<Record<string, unknown>>("ai-analyze-pattern", {
        imageDataUrls: compressedImages,
        imageDataUrl: compressedImages[0], // 兼容旧字段
        rawNote,
        product: analysis.product,
        sourceUrl,
        taskContext,
      });
      
      // 云函数通过 _serialized 字符串返回完整结果，防止 CloudBase 传输层丢弃空值属性
      const payload = (rawPayload && typeof rawPayload._serialized === "string")
        ? JSON.parse(rawPayload._serialized)
        : rawPayload;
      
      console.log(`[AI] 云函数返回数据:`, JSON.stringify(payload).slice(0, 1000));
      console.log(`[AI] 云函数返回 keys:`, Object.keys(payload));
      
      // 防御性处理：确保所有字段都有安全默认值
      const sanitized = sanitizePayload(payload);
      setAnalysis({ ...sanitized, product: (sanitized.product as string) || analysis.product } as any);
      setAnalysisStatus("analyzed");
      setShowReview(true);
      setReviewDrawerOpen(true);
      toast.success("模式提炼完成，请校对后保存");
    } catch (e) {
      setAnalysisStatus("failed");
      setError(e instanceof Error ? e.message : "AI 分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function save() {
    if (!canSave) return;
    // 保存时才分配编号，避免预占但未保存导致编号跳跃
    if (!reservedIds) {
      await generateIds();
    }
    const ids = useCaptureDraftStore.getState().reservedIds;
    if (!ids) return;
    const now = new Date().toISOString();
    await saveRecord({
      id: createBrowserId(),
      screenshotId: ids.screenshotId,
      imageDataUrl,
      ...(extraImages.length > 0 ? { extraImages } : {}),
      rawNote,
      sourceUrl: sourceUrl || undefined,
      taskContext: taskContext || undefined,
      patternId: ids.patternId,
      ...analysis,
      createdAt: now,
      updatedAt: now,
    });
    setSavedFlash(true);
    toast.success("模式记录已保存");
    window.setTimeout(() => {
      void reset();
    }, 1400);
  }

  function handleBottomAction() {
    if (isAnalyzing) return;
    if (inReview) {
      setReviewDrawerOpen(true);
      return;
    }
    void analyze();
  }

  const bottomActionLabel = isAnalyzing
    ? "AI 正在提炼…"
    : inReview
      ? "打开 Review 校对"
      : "提取设计模式";

  const drawerOpen =
    isAnalyzing ||
    analysisStatus === "failed" ||
    (reviewDrawerOpen && inReview);

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

  return (
    <div className="capture-workbench flex-1">
      <CapturePipeline
        screenshotId={reservedIds?.screenshotId ?? "S---"}
        patternId={inReview ? reservedIds?.patternId : undefined}
        evidenceStatus={evidenceStatus}
        extractStatus={extractStatus}
        reviewStatus={reviewStatus}
        savedStatus={savedFlash ? "已保存" : "未保存"}
        activeStep={activeStep}
      />

      <div className="capture-columns">
        <div className="capture-evidence-column">
          <div className="capture-evidence-body">
            <MultiImageEvidenceSlot
              screenshotId={reservedIds?.screenshotId ?? "S---"}
              primaryUrl={imageDataUrl}
              extraUrls={extraImages}
              onAddClick={() => fileInputRef.current?.click()}
              onRemoveExtra={removeExtraImage}
              onPreview={openPreview}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = Array.from(e.dataTransfer.files).find((x) =>
                  x.type.startsWith("image/"),
                );
                if (f) void handleImageFile(f);
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImageFile(f);
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
          disabled={isAnalyzing || (!inReview && !canExtract)}
        >
          {bottomActionLabel}
        </Button>
      </div>

      {drawerOpen ? (
        <div className="capture-drawer-layer">
          <aside className="capture-review-drawer" role="dialog" aria-modal="false" aria-label={drawerTitle}>
            <header className="capture-drawer-header">
              <div>
                <div className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-weak)]">
                  Pattern Review
                </div>
                <h2 className="capture-drawer-title">{drawerTitle}</h2>
              </div>
              {drawerPhase === "review" ? (
                <button
                  type="button"
                  className="evidence-recap-edit focus-ring"
                  onClick={() => setReviewDrawerOpen(false)}
                >
                  收起
                </button>
              ) : null}
            </header>
            <PatternExtractionWorkspace
              phase={drawerPhase}
              hasProduct={hasProduct}
              isAnalyzing={isAnalyzing}
              patternId={reservedIds?.patternId}
              screenshotId={reservedIds?.screenshotId ?? "S---"}
              analysis={analysis}
              saveBlockers={saveBlockers}
              canSave={canSave}
              onRetry={analyze}
              onManualFill={() => {
                setShowReview(true);
                setReviewDrawerOpen(true);
              }}
              onChange={setAnalysis}
              onSave={save}
              onReset={reset}
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
          src={previewUrls[previewIndex]}
          alt={`截图 ${previewIndex + 1}/${previewUrls.length}`}
          onClose={() => setPreviewOpen(false)}
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
