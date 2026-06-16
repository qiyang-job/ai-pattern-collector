"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCaptureDraftStore } from "@/lib/capture-draft-store";
import { useRecordsStore } from "@/lib/records-store";
import {
  CapturePipeline,
  getActiveStep,
  getCurrentTask,
  type EvidenceStepStatus,
  type ExtractStepStatus,
  type ReviewStepStatus,
} from "@/components/capture-pipeline";
import {
  getSaveBlockers,
  getWorkspacePhase,
  PatternExtractionWorkspace,
} from "@/components/capture-workspace";
import {
  Button,
  DualLabel,
  ErrorBanner,
  Field,
  inputClass,
  textareaClass,
} from "@/components/ui";
import {
  EvidenceSlot,
  HintChip,
  ImageLightbox,
  type EvidenceUiStatus,
} from "@/components/research-ui";

const RESEARCH_NOTE_PLACEHOLDER =
  "用一句话说明这张截图中值得研究的交互。例如：Cursor 在执行代码修改前展示将修改的文件，并要求用户确认。";

const WRITING_TEMPLATE =
  "[产品] 在 [用户阶段] 通过 [界面机制] 帮用户 [解决问题]";

const NOTE_HINTS = [
  "它解决了什么不确定性？",
  "AI 暴露了什么能力？",
  "用户如何确认或接管？",
] as const;

const createBrowserId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `record-${Date.now()}`;

export default function CapturePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveRecord } = useRecordsStore();
  const {
    reservedIds,
    imageDataUrl,
    imageMeta,
    rawNote,
    sourceUrl,
    taskContext,
    analysis,
    analysisStatus,
    isAnalyzing,
    showReview,
    showAdvanced,
    error,
    ensureIds,
    setImage,
    setRawNote,
    setSourceUrl,
    setTaskContext,
    setAnalysis,
    patchAnalysis,
    setAnalysisStatus,
    setIsAnalyzing,
    setShowReview,
    toggleAdvanced,
    setError,
    resetDraft,
  } = useCaptureDraftStore();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const hasEvidence = Boolean(imageDataUrl);
  const hasRawNote = Boolean(rawNote.trim());
  const hasProduct = Boolean(analysis.product.trim());
  const hasTaskContext = Boolean(taskContext.trim());
  const analyzeReady = hasEvidence && hasRawNote;
  const canExtract = analyzeReady && !isAnalyzing;

  const saveBlockers = getSaveBlockers({ hasEvidence, hasRawNote, analysis });
  const canSave = saveBlockers.length === 0;

  const inReview = showReview || analysisStatus === "analyzed";
  const workspacePhase = getWorkspacePhase({
    isAnalyzing,
    analysisStatus,
    showReview,
    analyzeReady,
  });

  const evidenceStatus: EvidenceStepStatus = !hasEvidence
    ? "缺失截图"
    : !hasRawNote
      ? "缺失备注"
      : "已就绪";

  const extractStatus: ExtractStepStatus = isAnalyzing
    ? "提炼中"
    : analysisStatus === "analyzed"
      ? "已完成"
      : analysisStatus === "failed"
        ? "失败"
        : analyzeReady
          ? "可提炼"
          : "未开始";

  const reviewStatus: ReviewStepStatus = !inReview
    ? "未解锁"
    : canSave
      ? "可保存"
      : "待校对";

  const evidenceUiStatus: EvidenceUiStatus = isAnalyzing
    ? "analyzing"
    : analysisStatus === "analyzed"
      ? "analyzed"
      : hasEvidence
        ? "ready"
        : "empty";

  const currentTask = getCurrentTask({
    savedFlash,
    inReview,
    analyzeReady,
    hasEvidence,
    hasRawNote,
  });

  const activeStep = getActiveStep({
    savedFlash,
    inReview,
    isAnalyzing,
    analyzeReady,
    evidenceReady: evidenceStatus === "已就绪",
  });

  useEffect(() => {
    ensureIds();
  }, [ensureIds]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) {
        event.preventDefault();
        void handleImageFile(file);
        toast.success("截图已粘贴");
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件。");
      return;
    }
    try {
      const dataUrl = await readAndResizeImage(file);
      const kb = Math.round(file.size / 1024);
      setImage(dataUrl, `${file.type} · ${kb} KB · ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "图片读取失败");
    }
  }

  async function reset() {
    setPreviewOpen(false);
    setSavedFlash(false);
    await resetDraft();
  }

  function appendHint(hint: string) {
    const prev = rawNote;
    if (!prev.trim()) {
      setRawNote(`${hint} `);
      return;
    }
    if (prev.includes(hint)) return;
    setRawNote(`${prev.trimEnd()}\n${hint} `);
  }

  async function analyze() {
    if (!imageDataUrl) return setError("请先添加截图证据。");
    if (!rawNote.trim()) return setError("请填写研究备注。");
    setIsAnalyzing(true);
    setAnalysisStatus("analyzing");
    setError("");
    try {
      const res = await fetch("/api/analyze-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          rawNote,
          product: analysis.product,
          sourceUrl,
          taskContext,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "AI 分析失败");
      setAnalysis({ ...payload, product: payload.product || analysis.product });
      setAnalysisStatus("analyzed");
      setShowReview(true);
      toast.success("模式提炼完成，请校对后保存");
    } catch (e) {
      setAnalysisStatus("failed");
      setError(e instanceof Error ? e.message : "AI 分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function save() {
    if (!reservedIds || !canSave) return;
    const now = new Date().toISOString();
    await saveRecord({
      id: createBrowserId(),
      screenshotId: reservedIds.screenshotId,
      imageDataUrl,
      rawNote,
      sourceUrl: sourceUrl || undefined,
      taskContext: taskContext || undefined,
      patternId: reservedIds.patternId,
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

  return (
    <div className="capture-workbench">
      <CapturePipeline
        screenshotId={reservedIds?.screenshotId ?? "S---"}
        patternId={inReview ? reservedIds?.patternId : undefined}
        evidenceStatus={evidenceStatus}
        extractStatus={extractStatus}
        reviewStatus={reviewStatus}
        savedStatus={savedFlash ? "已保存" : "未保存"}
        currentTask={currentTask}
        activeStep={activeStep}
      />

      <div className="capture-columns">
        <div className="capture-evidence-column">
          <header className="mb-3 border-b border-[var(--border)] pb-2">
            <h1 className="text-[13px] font-semibold text-[var(--text)]">证据编排</h1>
            <p className="mt-0.5 text-[10px] text-[var(--text-weak)]">
              截图 · 研究备注 · 上下文
            </p>
          </header>

          <section className="composer-section">
            <div className="composer-section-title">截图证据</div>
            <p className="composer-section-hint">
              截图是研究证据，不只是图片上传。它将与研究备注一起提炼为模式记录。
            </p>
            <div className="mt-2">
              <EvidenceSlot
                screenshotId={reservedIds?.screenshotId ?? "S---"}
                status={evidenceUiStatus}
                imageDataUrl={imageDataUrl}
                meta={imageMeta}
                onUploadClick={() => fileInputRef.current?.click()}
                onPreviewClick={() => imageDataUrl && setPreviewOpen(true)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = Array.from(e.dataTransfer.files).find((x) =>
                    x.type.startsWith("image/"),
                  );
                  if (f) void handleImageFile(f);
                }}
              />
            </div>
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
          </section>

          <section className="composer-section">
            <div className="composer-section-title">研究备注</div>
            <p className="composer-section-hint">说明这张图为什么值得研究</p>
            <div className="mt-2">
              <Field label={<DualLabel zh="研究备注" en="Research Note" />} hint="必填" compact>
                <textarea
                  className={textareaClass}
                  rows={4}
                  placeholder={RESEARCH_NOTE_PLACEHOLDER}
                  value={rawNote}
                  onChange={(e) => setRawNote(e.target.value)}
                />
              </Field>
              <div className="writing-template">
                <span className="font-medium text-[var(--text-muted)]">推荐写法：</span>
                {WRITING_TEMPLATE}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {NOTE_HINTS.map((hint) => (
                  <HintChip key={hint} onClick={() => appendHint(hint)}>
                    {hint}
                  </HintChip>
                ))}
              </div>
            </div>
          </section>

          <section className="composer-section">
            <div className="composer-section-title">上下文</div>
            <div className="mt-2 space-y-2">
              <Field label={<DualLabel zh="产品" en="Product" />} hint="建议填写" compact>
                <input
                  className={inputClass}
                  placeholder="Cursor / Claude / Notion AI…"
                  value={analysis.product}
                  onChange={(e) => patchAnalysis({ product: e.target.value })}
                />
              </Field>
              <p className="field-hint -mt-1">用于提高 AI 分类准确性</p>

              <Field label={<DualLabel zh="任务上下文" en="Task Context" />} hint="可选" compact>
                <input
                  className={inputClass}
                  placeholder="例如：代码重构、调研总结、多文件编辑…"
                  value={taskContext}
                  onChange={(e) => setTaskContext(e.target.value)}
                />
              </Field>
              <p className="field-hint -mt-1">说明你当时让 AI 做的任务</p>

              <button
                type="button"
                className="flex w-full items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
                onClick={toggleAdvanced}
              >
                {showAdvanced ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                高级上下文
              </button>

              {showAdvanced ? (
                <Field label={<DualLabel zh="来源链接" en="Source URL" />} compact>
                  <input
                    className={inputClass}
                    placeholder="https://…"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </Field>
              ) : null}
            </div>
          </section>

          {workspacePhase === "ready" || workspacePhase === "waiting" ? (
            <div className="border-t border-[var(--border)] pt-3">
              <Button className="w-full" onClick={analyze} disabled={!canExtract}>
                {isAnalyzing ? "提炼中…" : "提炼设计模式"}
              </Button>
              <p className="mt-1 text-center text-[10px] text-[var(--text-weak)]">
                使用 AI 从证据中提炼设计模式
              </p>
              {!canExtract && !isAnalyzing ? (
                <p className="mt-1 text-center text-[10px] text-[var(--text-weak)]">
                  {!hasEvidence && !hasRawNote
                    ? "需要截图和研究备注才能提炼。"
                    : !hasEvidence
                      ? "需要截图才能提炼。"
                      : "需要研究备注才能提炼。"}
                </p>
              ) : null}
              <ErrorBanner message={error} />
            </div>
          ) : null}
        </div>

        <div className="capture-analysis-column">
          <PatternExtractionWorkspace
            phase={workspacePhase}
            hasEvidence={hasEvidence}
            hasRawNote={hasRawNote}
            hasProduct={hasProduct}
            hasTaskContext={hasTaskContext}
            isAnalyzing={isAnalyzing}
            patternId={reservedIds?.patternId}
            screenshotId={reservedIds?.screenshotId ?? "S---"}
            analysis={analysis}
            saveBlockers={saveBlockers}
            canSave={canSave}
            canExtract={canExtract}
            onExtract={analyze}
            onRetry={analyze}
            onManualFill={() => setShowReview(true)}
            onChange={setAnalysis}
            onSave={save}
            onReset={reset}
          />
          {workspacePhase !== "waiting" && workspacePhase !== "ready" ? (
            <div className="mt-2">
              <ErrorBanner message={error} />
            </div>
          ) : null}
        </div>
      </div>

      {previewOpen && imageDataUrl ? (
        <ImageLightbox
          src={imageDataUrl}
          alt={reservedIds?.screenshotId ?? "screenshot"}
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
