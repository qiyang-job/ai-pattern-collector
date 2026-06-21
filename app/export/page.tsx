"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getLatestInsights, importInsights } from "@/lib/db";
import {
  CORE_JOURNEY_STAGES,
  JOURNEY_STAGE_LABELS,
  PATTERN_CATEGORIES,
  PATTERN_CATEGORY_LABELS,
  PRODUCT_CATEGORY_LABELS,
  SCREENSHOT_STATE_LABELS,
  labelOf,
} from "@/lib/constants";
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
import { computeRecordStats } from "@/lib/stats";
import type { InsightsResult, PatternCategory, PatternRecord } from "@/lib/types";
import { downloadTextFile, journeyCode, journeyName } from "@/lib/utils";
import {
  Button,
  CategoryTag,
  PageBody,
  PageFrame,
  PageHeader,
  Panel,
  PanelHeader,
  ReuseTag,
  SegmentedControl,
  TypedIdBadge,
  selectClass,
} from "@/components/ui";
import { DistributionRow, ReportSkeletonSection, SlotEmpty } from "@/components/research-ui";

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

  const date = new Date().toISOString().slice(0, 10);

  function getExportContent() {
    if (format === "json") {
      return scope === "all"
        ? recordsToBackupJson(exportRecords, latestInsights)
        : recordsToJson(exportRecords);
    }
    if (format === "csv") return recordsToCsv(exportRecords);
    return recordsToMarkdownReport(exportRecords, latestInsights);
  }

  function download() {
    if (!exportRecords.length) return;
    if (format === "json") {
      const filename = scope === "all" ? `patterns-backup-${date}.json` : `patterns-${date}.json`;
      downloadTextFile(filename, getExportContent(), "application/json");
    } else if (format === "csv") {
      downloadTextFile(`patterns-${date}.csv`, getExportContent(), "text/csv");
    } else {
      downloadTextFile(`report-${date}.md`, getExportContent(), "text/markdown");
    }
    toast.success(scope === "all" && format === "json" ? "完整备份已下载。" : "已下载。");
  }

  async function copyPreview() {
    if (!hasData || !exportRecords.length) return;
    await navigator.clipboard.writeText(getExportContent());
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
          <PanelHeader
            title="导出预览"
            meta={
              !hasData
                ? "骨架"
                : format === "markdown"
                  ? `${exportRecords.length} 条 · 报告结构`
                  : `${exportRecords.length} 条 · ${format.toUpperCase()}`
            }
          />
          <ExportPreviewList
            format={format}
            scope={scope}
            records={exportRecords}
            insights={latestInsights}
            hasData={hasData}
          />
        </Panel>
        </div>
      </PageBody>
    </PageFrame>
  );
}

const PREVIEW_RECORD_LIMIT = 12;

const EXPORT_INSIGHT_KEYS: Array<{ key: keyof InsightsResult; title: string; num: string }> = [
  { key: "researchScope", title: "研究范围", num: "01" },
  { key: "productCoverage", title: "产品覆盖", num: "02" },
  { key: "journeyCoverage", title: "旅程覆盖", num: "03" },
  { key: "highValuePatterns", title: "高价值模式", num: "04" },
  { key: "recommendations", title: "设计建议", num: "05" },
];

function ExportPreviewList({
  format,
  scope,
  records,
  insights,
  hasData,
}: {
  format: ExportFormat;
  scope: ExportScope;
  records: PatternRecord[];
  insights: InsightsResult | null;
  hasData: boolean;
}) {
  const stats = useMemo(() => computeRecordStats(records), [records]);
  const previewRecords = records.slice(0, PREVIEW_RECORD_LIMIT);
  const remaining = Math.max(0, records.length - previewRecords.length);

  if (!hasData) {
    return (
      <div className="export-preview-list">
        <ExportPreviewSection title="研究范围">
          <SlotEmpty>等待采集记录以生成导出预览。</SlotEmpty>
        </ExportPreviewSection>
        <ExportPreviewSection title="分布概览">
          <div className="export-preview-skeleton">
            {["产品覆盖", "旅程覆盖", "模式分类", "高价值模式"].map((label) => (
              <div key={label} className="export-preview-skeleton-row">
                <span>{label}</span>
                <span className="export-preview-skeleton-bar" />
                <span>—</span>
              </div>
            ))}
          </div>
        </ExportPreviewSection>
        <ExportPreviewSection title="模式记录">
          <SlotEmpty>保存后将在此列出范围内的模式记录。</SlotEmpty>
        </ExportPreviewSection>
      </div>
    );
  }

  if (format !== "markdown") {
    const scopeLabel =
      scope === "all" ? "全部记录" : scope === "high-reuse" ? "高复用" : "按分类筛选";
    const fields =
      format === "csv"
        ? [
            "patternId",
            "screenshotId",
            "product",
            "productCategory",
            "journeyStage",
            "patternName",
            "patternCategory",
            "reuseLevel",
            "designJudgment",
            "tags",
            "createdAt",
          ]
        : scope === "all"
          ? ["version", "exportedAt", "records[]", "insights"]
          : ["patternId", "patternName", "product", "journeyStage", "patternCategory", "lensScore", "…"];

    return (
      <div className="export-preview-list">
        <ExportPreviewSection title="导出清单">
          <ul className="export-meta-list">
            <li>
              <span>格式</span>
              <span className="mono">{format.toUpperCase()}</span>
            </li>
            <li>
              <span>范围</span>
              <span>{scopeLabel}</span>
            </li>
            <li>
              <span>记录数</span>
              <span className="mono tabular-nums">{records.length}</span>
            </li>
            {format === "json" && scope === "all" ? (
              <li>
                <span>Insights</span>
                <span>{insights ? "含最新报告" : "无"}</span>
              </li>
            ) : null}
          </ul>
        </ExportPreviewSection>
        <ExportPreviewSection title="字段结构">
          <ul className="export-field-list">
            {fields.map((field) => (
              <li key={field} className="mono">
                {field}
              </li>
            ))}
          </ul>
        </ExportPreviewSection>
        <ExportPreviewSection title="记录列表" meta={`前 ${previewRecords.length} 条`}>
          <RecordManifestList records={previewRecords} remaining={remaining} />
        </ExportPreviewSection>
      </div>
    );
  }

  const journeyMax = Math.max(1, ...stats.journeyCounts.map((item) => item.count));
  const productMax = Math.max(1, ...stats.productCategoryCounts.map((item) => item.count));
  const patternMax = Math.max(1, ...stats.patternCategoryCounts.map((item) => item.count));

  return (
    <div className="export-preview-list">
      <ExportPreviewSection title="研究范围">
        <ul className="export-meta-list">
          <li>
            <span>模式记录</span>
            <span className="mono tabular-nums">{stats.totalPatterns}</span>
          </li>
          <li>
            <span>覆盖产品</span>
            <span className="mono tabular-nums">{stats.coveredProducts}</span>
          </li>
          <li>
            <span>平均 Lens</span>
            <span className="mono tabular-nums">{stats.averageLensScore.toFixed(1)}</span>
          </li>
          <li>
            <span>高复用模式</span>
            <span className="mono tabular-nums">{stats.highReusePatterns.length}</span>
          </li>
        </ul>
        {stats.products.length > 0 ? (
          <p className="export-preview-note">{stats.products.join(" · ")}</p>
        ) : null}
      </ExportPreviewSection>

      <div className="export-preview-grid">
        <ExportPreviewSection title="产品覆盖">
          <div className="dist-list">
            {stats.productCategoryCounts.map((item) => (
              <DistributionRow
                key={item.category}
                label={labelOf(item.category, PRODUCT_CATEGORY_LABELS)}
                count={item.count}
                max={productMax}
              />
            ))}
          </div>
        </ExportPreviewSection>

        <ExportPreviewSection title="旅程覆盖">
          <div className="dist-list">
            {stats.journeyCounts.map((item) => {
              const isCore = CORE_JOURNEY_STAGES.some((stage) => stage === item.stage);
              return (
                <DistributionRow
                  key={item.stage}
                  label={
                    <span className="flex items-center gap-2">
                      <span className="mono text-[10px] text-[var(--text-weak)]">
                        {journeyCode(item.stage)}
                      </span>
                      {journeyName(item.stage)}
                    </span>
                  }
                  count={item.count}
                  max={journeyMax}
                  accent={isCore}
                  core={isCore}
                />
              );
            })}
          </div>
        </ExportPreviewSection>

        <ExportPreviewSection title="模式分类">
          <div className="dist-list">
            {stats.patternCategoryCounts.map((item) => (
              <DistributionRow
                key={item.category}
                label={labelOf(item.category, PATTERN_CATEGORY_LABELS)}
                count={item.count}
                max={patternMax}
              />
            ))}
          </div>
        </ExportPreviewSection>

        <ExportPreviewSection title="高价值模式">
          {stats.highReusePatterns.length > 0 ? (
            <RecordManifestList
              records={stats.highReusePatterns.slice(0, PREVIEW_RECORD_LIMIT)}
              remaining={Math.max(0, stats.highReusePatterns.length - PREVIEW_RECORD_LIMIT)}
              compact
            />
          ) : (
            <p className="export-preview-note">当前范围内暂无高复用模式。</p>
          )}
        </ExportPreviewSection>
      </div>

      {insights ? (
        <ExportPreviewSection title="Insights 摘要">
          <div className="export-insight-list">
            {EXPORT_INSIGHT_KEYS.map(({ key, title, num }) =>
              insights[key] ? (
                <ReportSkeletonSection key={key} num={num} title={title} content={insights[key]} />
              ) : null,
            )}
          </div>
        </ExportPreviewSection>
      ) : null}

      <ExportPreviewSection title="模式记录" meta={`前 ${previewRecords.length} 条`}>
        <RecordManifestList records={previewRecords} remaining={remaining} />
      </ExportPreviewSection>
    </div>
  );
}

function ExportPreviewSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="export-preview-section">
      <div className="export-preview-section-head">
        <h3 className="export-preview-section-title">{title}</h3>
        {meta ? <span className="mono text-[10px] text-[var(--text-weak)]">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

function RecordManifestList({
  records,
  remaining,
  compact,
}: {
  records: PatternRecord[];
  remaining: number;
  compact?: boolean;
}) {
  if (records.length === 0) {
    return <p className="export-preview-note">当前范围内没有记录。</p>;
  }

  return (
    <>
      <ul className="export-record-list">
        {records.map((record) => (
          <li key={record.id} className={compact ? "export-record-row export-record-row--compact" : "export-record-row"}>
            <TypedIdBadge kind="pattern">{record.patternId}</TypedIdBadge>
            <div className="export-record-row-main">
              <div className="export-record-row-name">{record.patternName || "未命名模式"}</div>
              {!compact ? (
                <div className="export-record-row-meta">
                  <span>{record.product || "—"}</span>
                  <span>{journeyCode(record.journeyStage)} {labelOf(record.journeyStage, JOURNEY_STAGE_LABELS)}</span>
                  <span>{labelOf(record.screenshotState, SCREENSHOT_STATE_LABELS)}</span>
                </div>
              ) : null}
            </div>
            {!compact ? (
              <>
                <CategoryTag
                  label={labelOf(record.productCategory, PRODUCT_CATEGORY_LABELS)}
                  category={record.productCategory}
                />
                <ReuseTag level={record.reuseLevel} />
              </>
            ) : (
              <span className="text-[11px] text-[var(--text-weak)]">{record.product || "—"}</span>
            )}
          </li>
        ))}
      </ul>
      {remaining > 0 ? (
        <p className="export-preview-more mono">… 还有 {remaining} 条未展示</p>
      ) : null}
    </>
  );
}
