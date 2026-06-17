"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, RefreshCw, Copy, Braces, Save, Trash2 } from "lucide-react";
import { RecordForm } from "@/components/record-form";
import {
  Button,
  Field,
  PanelHeader,
  TypedIdBadge,
  SectionLabel,
  inputClass,
  textareaClass,
} from "@/components/ui";
import { ImageLightbox } from "@/components/research-ui";
import { CLASSIFICATION_DIMENSIONS_OVERVIEW_HINT } from "@/lib/constants";
import { recordToMarkdown, recordsToJson } from "@/lib/export";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternAnalysisResult, PatternRecord } from "@/lib/types";
import { downloadTextFile, formatDate } from "@/lib/utils";
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

  /** 获取所有图片（主图 + 额外图） */
  const allImages = draft.imageDataUrl
    ? [draft.imageDataUrl, ...(Array.isArray(draft.extraImages) ? draft.extraImages : [])]
    : (Array.isArray(draft.extraImages) ? draft.extraImages : []);

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
      toast.error("该记录没有截图，无法重新分析。");
      return;
    }
    if (!draft.rawNote?.trim()) {
      toast.error("该记录没有备注，无法重新分析。请先填写 Raw Note。");
      return;
    }

    setIsAnalyzing(true);
    try {
      await ensureAuth();

      // 压缩所有图片
      const compressedImages = await Promise.all(allImages.map(img => compressImage(img)));
      const totalBefore = allImages.reduce((s, u) => s + u.length, 0);
      const totalAfter = compressedImages.reduce((s, u) => s + u.length, 0);
      console.log(`[reanalyze] ${allImages.length}张图片压缩: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);

      const rawPayload = await callCloudFunction<Record<string, unknown>>("ai-analyze-pattern", {
        imageDataUrls: compressedImages,
        imageDataUrl: compressedImages[0], // 兼容旧字段
        rawNote: draft.rawNote,
        product: draft.product,
        sourceUrl: draft.sourceUrl ?? "",
        taskContext: draft.taskContext ?? "",
      });

      // 云函数通过 _serialized 字符串返回完整结果，防止 CloudBase 传输层丢弃空值属性
      const payload = (rawPayload && typeof rawPayload._serialized === "string")
        ? JSON.parse(rawPayload._serialized)
        : rawPayload;

      // 防御性处理 AI 返回数据
      const sanitized = sanitizePayload(payload);

      setDraft((prev) => ({
        ...prev,
        ...sanitized,
        updatedAt: new Date().toISOString(),
      }));
      toast.success("重新分析完成，请检查并保存。");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重新分析失败");
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
    <div className="fixed inset-0 z-40">
      <div className="inspector-overlay absolute inset-0" onClick={onClose} />
      <aside className="inspector-panel absolute inset-y-0 right-0 flex w-[min(800px,90vw)] flex-col">
        <header className="page-gutter-x border-b border-[var(--border)] py-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="display-serif min-w-0 flex-1 text-[18px] leading-snug">{draft.patternName}</h2>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0"
                onClick={copyMarkdown}
                aria-label="复制 Markdown"
                title="复制 Markdown"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0"
                onClick={() =>
                  downloadTextFile(
                    `${draft.patternId}.json`,
                    recordsToJson([draft]),
                    "application/json",
                  )
                }
                aria-label="导出 JSON"
                title="导出 JSON"
              >
                <Braces className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0"
                onClick={reanalyze}
                disabled={isAnalyzing}
                aria-label={isAnalyzing ? "分析中" : "重新分析"}
                title={isAnalyzing ? "分析中" : "重新分析"}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0"
                onClick={saveDraft}
                aria-label="保存"
                title="保存"
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0"
                onClick={removeDraft}
                aria-label="删除"
                title="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0"
                onClick={onClose}
                aria-label="关闭"
                title="关闭"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="mt-1.5 flex min-w-0 items-center gap-x-2 overflow-hidden whitespace-nowrap">
            <TypedIdBadge kind="pattern">{draft.patternId}</TypedIdBadge>
            <TypedIdBadge kind="evidence">{draft.screenshotId}</TypedIdBadge>
            <span className="shrink-0 text-[var(--text-weak)]" aria-hidden="true">
              ·
            </span>
            <p className="min-w-0 truncate text-[11px] text-[var(--text-weak)]" title={timeLabel}>
              {timeLabel}
            </p>
          </div>
        </header>

        <div className="inspector-scroll min-h-0 flex-1 overflow-auto">
          <section className="inspector-section-card">
            <SectionLabel>
              证据
              {allImages.length > 1 && (
                <span className="ml-2 mono text-[10px] text-[var(--text-weak)]">
                  {allImages.length} 张截图
                </span>
              )}
            </SectionLabel>

            {allImages.length <= 1 ? (
              allImages[0] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={allImages[0]}
                  alt={draft.screenshotId}
                  className="max-h-48 w-full rounded-[var(--radius-md)] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => { setPreviewIndex(0); setPreviewOpen(true); }}
                  title="点击放大"
                />
              ) : null
            ) : (
              <div className="flex flex-wrap gap-2">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    className="flex size-[120px] shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--panel-muted)] ring-1 ring-[var(--border)] cursor-pointer hover:ring-[var(--border-strong)] transition-shadow"
                    onClick={() => { setPreviewIndex(i); setPreviewOpen(true); }}
                    title={`截图 ${i + 1} - 点击放大`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={i === 0 ? draft.screenshotId : `截图 ${i + 1}`}
                      className="size-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 space-y-2">
              <Field label="原始备注" compact>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={draft.rawNote}
                  onChange={(e) => setDraft({ ...draft, rawNote: e.target.value })}
                />
              </Field>
              <Field label="来源链接" compact>
                <input
                  className={inputClass}
                  value={draft.sourceUrl ?? ""}
                  onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
                />
              </Field>
              <Field label="当时任务" compact>
                <input
                  className={inputClass}
                  placeholder="例如：让 AI 重构 auth 模块…"
                  value={draft.taskContext ?? ""}
                  onChange={(e) => setDraft({ ...draft, taskContext: e.target.value })}
                />
              </Field>
            </div>
          </section>

          <section className="inspector-section-card">
            <PanelHeader
              title="模式分析"
              hint={CLASSIFICATION_DIMENSIONS_OVERVIEW_HINT}
            />
            <RecordForm
              value={analysisValue}
              onChange={(next) => setDraft({ ...draft, ...next })}
            />
          </section>
        </div>

        {previewOpen && allImages.length > 0 ? (
          <ImageLightbox
            src={allImages[previewIndex]}
            alt={`截图 ${previewIndex + 1}/${allImages.length}`}
            onClose={() => setPreviewOpen(false)}
          />
        ) : null}
      </aside>
    </div>
  );
}

/**
 * 压缩图片 base64，确保不超过云函数 6MB 入参限制
 */
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

/**
 * 防御性处理 AI 返回数据
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
