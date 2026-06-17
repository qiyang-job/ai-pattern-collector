"use client";

import { useState } from "react";
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
import { FormModule, ImageLightbox } from "@/components/research-ui";
import { recordToMarkdown, recordsToJson } from "@/lib/export";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternAnalysisResult, PatternRecord } from "@/lib/types";
import { cn, downloadTextFile, formatDate } from "@/lib/utils";
import { callCloudFunction, ensureAuth } from "@/lib/cloudbase";

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
  const [previewIndex, setPreviewIndex] = useState(0);

  const allImages = draft.imageDataUrl
    ? [draft.imageDataUrl, ...(Array.isArray(draft.extraImages) ? draft.extraImages : [])]
    : Array.isArray(draft.extraImages)
      ? draft.extraImages
      : [];

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
      await saveRecord({ ...draft, updatedAt: new Date().toISOString() });
      toast.success("记录已更新。");
    } catch (err) {
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
    if (allImages.length === 0) {
      toast.error("该记录没有截图，无法重新提取。");
      return;
    }
    if (!draft.rawNote?.trim()) {
      toast.error("该记录没有备注，无法重新提取。请先填写研究备注。");
      return;
    }

    setIsAnalyzing(true);
    try {
      await ensureAuth();

      const compressedImages = await Promise.all(allImages.map((img) => compressImage(img)));
      const rawPayload = await callCloudFunction<Record<string, unknown>>("ai-analyze-pattern", {
        imageDataUrls: compressedImages,
        imageDataUrl: compressedImages[0],
        rawNote: draft.rawNote,
        product: draft.product,
        sourceUrl: draft.sourceUrl ?? "",
        taskContext: draft.taskContext ?? "",
      });

      const payload =
        rawPayload && typeof rawPayload._serialized === "string"
          ? JSON.parse(rawPayload._serialized)
          : rawPayload;

      const sanitized = sanitizePayload(payload);

      setDraft((prev) => ({
        ...prev,
        ...sanitized,
        updatedAt: new Date().toISOString(),
      }));
      toast.success("重新提取完成，请检查并保存。");
    } catch (err) {
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
              <ExtractingPanel
                hasProduct={Boolean(draft.product.trim())}
                title="正在重新提取…"
              />
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
                description="截图、研究备注与采集时的任务上下文"
              >
                {allImages.length === 1 ? (
                  <button
                    type="button"
                    className="record-evidence-hero-btn"
                    onClick={() => {
                      setPreviewIndex(0);
                      setPreviewOpen(true);
                    }}
                    title="点击放大预览"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={allImages[0]}
                      alt={draft.screenshotId}
                      className="record-evidence-hero"
                    />
                  </button>
                ) : allImages.length > 1 ? (
                  <div className="record-evidence-gallery">
                    {allImages.map((url, index) => (
                      <button
                        key={`${url.slice(0, 24)}-${index}`}
                        type="button"
                        className={cn(
                          "record-evidence-thumb",
                          index === 0 && "record-evidence-thumb--primary",
                        )}
                        onClick={() => {
                          setPreviewIndex(index);
                          setPreviewOpen(true);
                        }}
                        title={`截图 ${index + 1} · 点击放大`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={index === 0 ? draft.screenshotId : `截图 ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-weak)]">暂无截图证据</p>
                )}

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
          src={allImages[previewIndex]}
          alt={`截图 ${previewIndex + 1}/${allImages.length}`}
          onClose={() => setPreviewOpen(false)}
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

async function compressImage(dataUrl: string): Promise<string> {
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

      let result = canvas.toDataURL("image/jpeg", 0.75);
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
