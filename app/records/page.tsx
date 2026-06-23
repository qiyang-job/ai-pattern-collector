"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CORE_JOURNEY_STAGES,
  JOURNEY_STAGE_LABELS,
  JOURNEY_STAGES,
  PATTERN_CATEGORIES,
  PATTERN_CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  REUSE_LEVELS,
  REUSE_LEVEL_LABELS,
  SCREENSHOT_STATE_LABELS,
  SCREENSHOT_STATES,
  labelOf,
} from "@/lib/constants";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternRecord } from "@/lib/types";
import {
  averageLensScore,
  cn,
  formatDate,
  journeyCode,
} from "@/lib/utils";
import {
  CategoryTag,
  ErrorBanner,
  EvidenceThumbnail,
  LoadingState,
  PageBody,
  PageFrame,
  PageHeader,
  Panel,
  ReuseTag,
  StatMetric,
  TypedIdBadge,
  inputClass,
} from "@/components/ui";
import { SlotEmpty } from "@/components/research-ui";
import { RecordDrawer } from "@/components/record-drawer";

export default function RecordsPage() {
  return (
    <Suspense fallback={null}>
      <RecordsView />
    </Suspense>
  );
}

function RecordsView() {
  const searchParams = useSearchParams();
  const { records, loadRecords, isLoading, error } = useRecordsStore();
  const [selected, setSelected] = useState<PatternRecord | null>(null);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [filters, setFilters] = useState(() => ({
    productCategory: searchParams.get("productCategory") ?? "",
    journeyStage: searchParams.get("journeyStage") ?? "",
    screenshotState: searchParams.get("screenshotState") ?? "",
    patternCategory: searchParams.get("patternCategory") ?? "",
    reuseLevel: searchParams.get("reuseLevel") ?? "",
  }));

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (query.trim()) {
      chips.push({ key: "query", label: `“${query.trim()}”`, clear: () => setQuery("") });
    }
    const chipLabelMaps: Record<keyof typeof filters, Record<string, string>> = {
      productCategory: PRODUCT_CATEGORY_LABELS,
      journeyStage: JOURNEY_STAGE_LABELS,
      screenshotState: SCREENSHOT_STATE_LABELS,
      patternCategory: PATTERN_CATEGORY_LABELS,
      reuseLevel: REUSE_LEVEL_LABELS,
    };
    const map: Array<[keyof typeof filters, string]> = [
      ["productCategory", filters.productCategory],
      ["journeyStage", filters.journeyStage],
      ["screenshotState", filters.screenshotState],
      ["patternCategory", filters.patternCategory],
      ["reuseLevel", filters.reuseLevel],
    ];
    for (const [key, value] of map) {
      if (value) {
        chips.push({
          key,
          label: labelOf(value, chipLabelMaps[key]),
          clear: () => setFilters((prev) => ({ ...prev, [key]: "" })),
        });
      }
    }
    return chips;
  }, [filters, query]);

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return records.filter((r) => {
      const tags = Array.isArray(r.tags) ? r.tags : [];
      const text = [r.patternId, r.screenshotId, r.patternName ?? "", r.product ?? "", r.rawNote ?? "", r.designJudgment ?? "", tags.join(" ")]
        .join(" ")
        .toLowerCase();
      return (
        (!kw || text.includes(kw)) &&
        (!filters.productCategory || r.productCategory === filters.productCategory) &&
        (!filters.journeyStage || r.journeyStage === filters.journeyStage) &&
        (!filters.screenshotState || r.screenshotState === filters.screenshotState) &&
        (!filters.patternCategory || r.patternCategory === filters.patternCategory) &&
        (!filters.reuseLevel || r.reuseLevel === filters.reuseLevel)
      );
    });
  }, [filters, query, records]);

  return (
    <PageFrame>
      <PageHeader
        eyebrow="模式资产"
        title="记录"
        description="从证据进入模式详情；筛选结果同时承接矩阵、旅程和模式库的下钻路径。"
        stats={
          <>
            <StatMetric label="总计" value={records.length} compact />
            <StatMetric label="当前显示" value={filtered.length} compact />
          </>
        }
      />
      <PageBody className="page-section-gap">
        <ErrorBanner message={error} />

        <Panel className="filter-panel record-filter-panel">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold text-[var(--text-muted)]">查询与筛选</div>
            <button
              type="button"
              className="text-[11px] text-[var(--text-weak)] hover:text-[var(--accent)]"
              onClick={() => {
                setQuery("");
                setFilters({
                  productCategory: "",
                  journeyStage: "",
                  screenshotState: "",
                  patternCategory: "",
                  reuseLevel: "",
                });
              }}
            >
              清空条件
            </button>
          </div>
          <div className="filter-grid">
            <input
              className={inputClass}
              placeholder="搜索模式、产品、标签或设计判断…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <FilterSelect value={filters.productCategory} options={PRODUCT_CATEGORIES} optionLabels={PRODUCT_CATEGORY_LABELS} placeholder="产品类型" onChange={(v) => setFilters({ ...filters, productCategory: v })} />
            <FilterSelect value={filters.journeyStage} options={JOURNEY_STAGES} optionLabels={JOURNEY_STAGE_LABELS} placeholder="旅程阶段" onChange={(v) => setFilters({ ...filters, journeyStage: v })} />
            <FilterSelect value={filters.screenshotState} options={SCREENSHOT_STATES} optionLabels={SCREENSHOT_STATE_LABELS} placeholder="截图状态" onChange={(v) => setFilters({ ...filters, screenshotState: v })} />
            <FilterSelect value={filters.patternCategory} options={PATTERN_CATEGORIES} optionLabels={PATTERN_CATEGORY_LABELS} placeholder="模式分类" onChange={(v) => setFilters({ ...filters, patternCategory: v })} />
            <FilterSelect value={filters.reuseLevel} options={REUSE_LEVELS} optionLabels={REUSE_LEVEL_LABELS} placeholder="复用等级" onChange={(v) => setFilters({ ...filters, reuseLevel: v })} />
          </div>
          {activeChips.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2.5">
              <span className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-weak)]">
                生效条件
              </span>
              {activeChips.map((chip) => (
                <span key={chip.key} className="filter-chip">
                  {chip.label}
                  <button type="button" aria-label="移除筛选" onClick={chip.clear}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </Panel>

        {isLoading && records.length === 0 ? (
          <LoadingState label="正在读取本地数据…" />
        ) : null}

        <Panel noPadding className="table-scroll">
          <table className="data-table records-primary-table">
            <thead>
              <tr>
                <th>证据</th>
                <th>模式与核心判断</th>
                <th>产品</th>
                <th>路径</th>
                <th>复用价值</th>
                <th>更新</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((r) => {
                  const isCore = CORE_JOURNEY_STAGES.some((s) => s === r.journeyStage);
                  return (
                    <tr
                      key={r.id}
                      data-clickable="true"
                      tabIndex={0}
                      aria-label={`打开模式记录：${r.patternName}`}
                      onClick={() => setSelected(r)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelected(r);
                        }
                      }}
                    >
                      <td data-label="证据">
                        <div className="flex items-center gap-2">
                          <EvidenceThumbnail src={r.imageDataUrl} alt={r.screenshotId} />
                          <TypedIdBadge kind="evidence">{r.screenshotId}</TypedIdBadge>
                        </div>
                      </td>
                      <td data-label="模式与核心判断">
                        <div className="max-w-[280px] truncate font-medium">{r.patternName}</div>
                        <TypedIdBadge kind="pattern" className="mt-0.5">{r.patternId}</TypedIdBadge>
                        <div className="record-row-finding" title={r.userProblem || r.designJudgment}>
                          {r.userProblem || r.designJudgment || "尚未补充核心判断"}
                        </div>
                      </td>
                      <td data-label="产品">
                        <div className="mb-1 text-[12px] text-[var(--text)]">{r.product || "—"}</div>
                        <CategoryTag label={labelOf(r.productCategory, PRODUCT_CATEGORY_LABELS)} category={r.productCategory} />
                      </td>
                      <td data-label="路径">
                        <div className={cn("text-[12px]", isCore ? "font-semibold text-[var(--accent)]" : "text-[var(--text-muted)]")}>
                          {journeyCode(r.journeyStage)} · {labelOf(r.journeyStage, JOURNEY_STAGE_LABELS)}
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--text-weak)]">
                          {labelOf(r.screenshotState, SCREENSHOT_STATE_LABELS)}
                        </div>
                      </td>
                      <td data-label="复用价值">
                        <ReuseTag level={r.reuseLevel} />
                        <span className="lens-meter" title={`平均 Lens ${averageLensScore(r).toFixed(1)} / 3`}>
                          <span className="lens-meter-track">
                            <span
                              className="lens-meter-fill"
                              style={{ width: `${Math.min(100, (averageLensScore(r) / 3) * 100)}%` }}
                            />
                          </span>
                          <span className="tabular-nums mono text-[12px]">{averageLensScore(r).toFixed(1)}</span>
                        </span>
                      </td>
                      <td data-label="更新" className="text-[11px] text-[var(--text-weak)]">{formatDate(r.updatedAt)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="!py-8">
                    <SlotEmpty>
                      {records.length === 0 ? (
                        <>
                          还没有模式记录。
                          <br />
                          <Link href="/capture" className="text-[var(--accent)] underline">
                            前往采集页粘贴第一张截图 →
                          </Link>
                        </>
                      ) : (
                        "没有符合当前筛选条件的记录。"
                      )}
                    </SlotEmpty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </PageBody>
      <RecordDrawer record={selected} onClose={() => setSelected(null)} />
    </PageFrame>
  );
}

function FilterSelect<T extends string>({
  value,
  options,
  optionLabels,
  placeholder,
  onChange,
}: {
  value: string;
  options: readonly T[];
  optionLabels?: Record<string, string>;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      className={cn("records-filter-select", value && "records-filter-select--active")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{optionLabels ? labelOf(o, optionLabels) : o}</option>
      ))}
    </select>
  );
}
