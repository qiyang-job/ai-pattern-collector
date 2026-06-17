"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getLatestInsights, importInsights } from "@/lib/db";
import { PATTERN_CATEGORIES, PATTERN_CATEGORY_LABELS, labelOf } from "@/lib/constants";
import {
  recordsToBackupJson,
  recordsToCsv,
  recordsToJson,
  recordsToMarkdownReport,
} from "@/lib/export";
import {
  parseImportJson,
  summarizeImportPayload,
  type ImportMode,
  type ImportPayload,
} from "@/lib/import";
import { useRecordsStore } from "@/lib/records-store";
import type { InsightsResult, PatternCategory } from "@/lib/types";
import { downloadTextFile } from "@/lib/utils";
import {
  Button,
  PageBody,
  PageFrame,
  PageHeader,
  Panel,
  PanelHeader,
  SegmentedControl,
  selectClass,
} from "@/components/ui";
import { SlotEmpty } from "@/components/research-ui";

type ExportFormat = "json" | "csv" | "markdown";
type ExportScope = "all" | "high-reuse" | "category";

export default function ExportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { records, loadRecords, importRecords } = useRecordsStore();
  const [latestInsights, setLatestInsights] = useState<InsightsResult | null>(null);
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [scope, setScope] = useState<ExportScope>("all");
  const [category, setCategory] = useState<PatternCategory>(PATTERN_CATEGORIES[0]);
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [importPreview, setImportPreview] = useState<ImportPayload | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadRecords();
    getLatestInsights().then((v) => {
      if (!v) return;
      try {
        setLatestInsights(JSON.parse(v));
      } catch {
        setLatestInsights(null);
      }
    });
  }, [loadRecords]);

  const exportRecords = useMemo(() => {
    if (scope === "high-reuse") return records.filter((r) => r.reuseLevel === "High");
    if (scope === "category") return records.filter((r) => r.patternCategory === category);
    return records;
  }, [records, scope, category]);

  const hasData = records.length > 0;
  const importSummary = importPreview ? summarizeImportPayload(importPreview) : null;

  const preview = useMemo(() => {
    if (!hasData) {
      return `# AI 产品设计模式研究报告

## 1. 研究范围
（等待采集记录）

## 2. 模式摘要
…

请至少保存一条模式记录以启用导出预览。`;
    }
    if (format === "json") {
      const json =
        scope === "all"
          ? recordsToBackupJson(exportRecords, latestInsights)
          : recordsToJson(exportRecords);
      return json.slice(0, 1800) + "\n…";
    }
    if (format === "csv") return recordsToCsv(exportRecords).slice(0, 1800) + "\n…";
    return recordsToMarkdownReport(exportRecords, latestInsights).slice(0, 2500) + "\n…";
  }, [exportRecords, format, latestInsights, hasData, scope]);

  const date = new Date().toISOString().slice(0, 10);

  function download() {
    if (!exportRecords.length) return;
    if (format === "json") {
      const content =
        scope === "all"
          ? recordsToBackupJson(exportRecords, latestInsights)
          : recordsToJson(exportRecords);
      const filename = scope === "all" ? `patterns-backup-${date}.json` : `patterns-${date}.json`;
      downloadTextFile(filename, content, "application/json");
    } else if (format === "csv") {
      downloadTextFile(`patterns-${date}.csv`, recordsToCsv(exportRecords), "text/csv");
    } else {
      downloadTextFile(
        `report-${date}.md`,
        recordsToMarkdownReport(exportRecords, latestInsights),
        "text/markdown",
      );
    }
    toast.success(scope === "all" && format === "json" ? "完整备份已下载。" : "已下载。");
  }

  async function copyPreview() {
    await navigator.clipboard.writeText(preview.replace(/\n…$/, ""));
    toast.success("已复制。");
  }

  async function handleImportFile(file: File) {
    setImportError("");
    setImportPreview(null);
    setImportFileName(file.name);

    try {
      const text = await file.text();
      const result = parseImportJson(text);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      if (!result.payload.records.length) {
        setImportError("备份文件中没有可导入的记录。");
        return;
      }
      setImportPreview(result.payload);
    } catch {
      setImportError("文件读取失败。");
    }
  }

  async function confirmImport() {
    if (!importPreview) return;

    if (importMode === "replace") {
      const confirmed = window.confirm(
        `将用备份中的 ${importPreview.records.length} 条记录覆盖当前本地数据，此操作不可撤销。继续？`,
      );
      if (!confirmed) return;
    }

    setIsImporting(true);
    try {
      const insights = importPreview.insights;
      const result = await importRecords(importPreview.records, importMode);
      if (insights) {
        await importInsights(typeof insights === 'string' ? insights : JSON.stringify(insights));
        setLatestInsights(insights);
      }

      setImportPreview(null);
      setImportFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (importMode === "merge") {
        toast.success(
          `已合并 ${result.imported} 条记录${result.skipped ? `，跳过 ${result.skipped} 条较新本地版本` : ""}。当前共 ${result.total} 条。`,
        );
      } else {
        toast.success(`已恢复 ${result.total} 条记录${insights ? "，含 Insights 报告" : ""}。`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导入失败");
    } finally {
      setIsImporting(false);
    }
  }

  function clearImportPreview() {
    setImportPreview(null);
    setImportFileName("");
    setImportError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <PageFrame>
      <PageHeader
        title="导出"
        description="导出控制台 — 备份 · 导入 · JSON · CSV · Markdown 研究报告。"
      />
      <PageBody>
        <div className="export-workbench">
          <div className="export-control-stack">
        <Panel>
          <PanelHeader title="数据导入" meta="换设备恢复" />
          <p className="text-[12px] leading-5 text-[var(--text-muted)]">
            在旧设备导出 JSON 完整备份，在新设备导入即可恢复记录与 Insights。仅支持 JSON 格式。
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">导入模式</div>
              <SegmentedControl
                value={importMode}
                options={[
                  { value: "replace" as const, label: "覆盖恢复" },
                  { value: "merge" as const, label: "合并同步" },
                ]}
                onChange={setImportMode}
              />
              <p className="mt-1.5 text-[10px] leading-4 text-[var(--text-weak)]">
                {importMode === "replace"
                  ? "清空本地后写入备份，适合换设备首次恢复。"
                  : "按记录 id 合并，保留 updatedAt 较新的版本。"}
              </p>
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">备份文件</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="block w-full text-[11px] text-[var(--text-muted)] file:mr-2 file:rounded-[var(--radius-sm)] file:bg-[var(--panel-muted)] file:px-2 file:py-1 file:text-[11px] file:text-[var(--text)]"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportFile(file);
                }}
              />
            </div>
          </div>

          {importError ? (
            <p className="mt-2 text-[11px] text-[var(--danger)]">{importError}</p>
          ) : null}

          {importPreview && importSummary ? (
            <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--panel-muted)] px-3 py-2">
              <div className="text-[11px] font-medium text-[var(--text)]">
                {importFileName || "已选择备份"}
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                {importSummary.recordCount} 条记录 · {importSummary.productCount} 个产品
                {importSummary.hasInsights ? " · 含 Insights 报告" : ""}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button onClick={confirmImport} disabled={isImporting}>
                  {isImporting ? "导入中…" : importMode === "replace" ? "确认覆盖恢复" : "确认合并同步"}
                </Button>
                <Button variant="secondary" onClick={clearImportPreview} disabled={isImporting}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <SlotEmpty>
                选择 JSON 备份文件以预览导入内容。
                <br />
                建议先在当前设备导出「全部 · JSON」完整备份。
              </SlotEmpty>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="导出设置" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">格式</div>
              <SegmentedControl
                value={format}
                options={[
                  { value: "json" as const, label: "JSON" },
                  { value: "csv" as const, label: "CSV" },
                  { value: "markdown" as const, label: "Markdown" },
                ]}
                onChange={setFormat}
              />
              {format === "json" ? (
                <p className="mt-1.5 text-[10px] leading-4 text-[var(--text-weak)]">
                  范围为「全部」时导出完整备份（含 Insights），可用于换设备导入。
                </p>
              ) : null}
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">范围</div>
              <SegmentedControl
                value={scope}
                options={[
                  { value: "all" as const, label: "全部" },
                  { value: "high-reuse" as const, label: "高复用" },
                  { value: "category" as const, label: "按分类" },
                ]}
                onChange={setScope}
              />
            </div>
          </div>
          {scope === "category" ? (
            <div className="mt-2">
              <div className="mb-1 text-[11px] text-[var(--text-muted)]">模式分类 Pattern Category</div>
              <select
                className={selectClass}
                value={category}
                onChange={(e) => setCategory(e.target.value as PatternCategory)}
                disabled={!hasData}
              >
                {PATTERN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{labelOf(c, PATTERN_CATEGORY_LABELS)}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={download} disabled={!hasData || !exportRecords.length}>
              下载
            </Button>
            <Button variant="secondary" onClick={copyPreview} disabled={!hasData}>
              复制预览
            </Button>
            <span className="text-[11px] text-[var(--text-weak)]">
              {hasData
                ? `范围内 ${exportRecords.length} 条记录`
                : "至少保存一条模式记录后才能导出"}
            </span>
          </div>
          {!hasData ? (
            <div className="mt-2">
              <SlotEmpty>
                至少保存一条模式记录以启用导出。
                <br />
                <Link href="/capture" className="text-[var(--accent)] underline">前往采集证据</Link>
              </SlotEmpty>
            </div>
          ) : null}
        </Panel>
          </div>

        <Panel className="export-preview-panel">
          <PanelHeader title="报告预览" meta={hasData ? "已截断" : "骨架"} />
          <pre className="code-preview max-h-96">{preview}</pre>
        </Panel>
        </div>
      </PageBody>
    </PageFrame>
  );
}
