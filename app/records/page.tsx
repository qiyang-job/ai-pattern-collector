"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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
  DropdownSelect,
  ErrorBanner,
  EvidenceThumbnail,
  LoadingState,
  PageBody,
  PageFrame,
  PageHeader,
  Panel,
  ReuseTag,
  TypedIdBadge,
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

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      query.trim() ||
        filters.productCategory ||
        filters.journeyStage ||
        filters.screenshotState ||
        filters.patternCategory ||
        filters.reuseLevel,
    );
  }, [filters, query]);

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return records.filter((r) => {
      const tags = Array.isArray(r.tags) ? r.tags : [];
      const text = [r.patternName ?? "", r.product ?? "", r.rawNote ?? "", r.designJudgment ?? "", tags.join(" ")]
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
        title={
          <>
            记录
            <span className="text-[var(--text-weak)]"> · </span>
            <span className="mono tabular-nums font-normal text-[var(--text-muted)]">
              {records.length}
            </span>
          </>
        }
        description="模式证据数据库。"
      />
      <PageBody className="page-section-gap">
        <ErrorBanner message={error} />

        {isLoading && records.length === 0 ? (
          <LoadingState label="正在读取本地数据…" />
        ) : null}

        <Panel noPadding>
          <div className="records-toolbar">
            <div className="records-toolbar-main">
              <div className="records-search-wrap">
                <Search className="records-search-icon" strokeWidth={1.75} aria-hidden />
                <input
                  className="records-search"
                  placeholder="搜索模式、产品、标签…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="records-filter-row">
                <FilterSelect value={filters.productCategory} options={PRODUCT_CATEGORIES} optionLabels={PRODUCT_CATEGORY_LABELS} placeholder="产品类型" onChange={(v) => setFilters({ ...filters, productCategory: v })} />
                <FilterSelect value={filters.journeyStage} options={JOURNEY_STAGES} optionLabels={JOURNEY_STAGE_LABELS} placeholder="旅程阶段" onChange={(v) => setFilters({ ...filters, journeyStage: v })} />
                <FilterSelect value={filters.screenshotState} options={SCREENSHOT_STATES} optionLabels={SCREENSHOT_STATE_LABELS} placeholder="截图状态" onChange={(v) => setFilters({ ...filters, screenshotState: v })} />
                <FilterSelect value={filters.patternCategory} options={PATTERN_CATEGORIES} optionLabels={PATTERN_CATEGORY_LABELS} placeholder="模式分类" onChange={(v) => setFilters({ ...filters, patternCategory: v })} />
                <FilterSelect value={filters.reuseLevel} options={REUSE_LEVELS} optionLabels={REUSE_LEVEL_LABELS} placeholder="复用等级" onChange={(v) => setFilters({ ...filters, reuseLevel: v })} />
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="records-toolbar-clear"
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
                  清空
                </button>
              ) : null}
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
            <thead>
              <tr>
                <th>证据</th>
                <th>模式</th>
                <th>产品</th>
                <th>类型</th>
                <th>阶段</th>
                <th>状态</th>
                <th>复用</th>
                <th>Lens</th>
                <th>标签</th>
                <th>更新</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((r) => {
                  const isCore = CORE_JOURNEY_STAGES.some((s) => s === r.journeyStage);
                  return (
                    <tr key={r.id} data-clickable="true" onClick={() => setSelected(r)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <EvidenceThumbnail src={r.imageDataUrl} alt={r.screenshotId} />
                          <TypedIdBadge kind="evidence">{r.screenshotId}</TypedIdBadge>
                        </div>
                      </td>
                      <td>
                        <div className="max-w-[160px] truncate font-medium">{r.patternName}</div>
                        <TypedIdBadge kind="pattern" className="mt-0.5">{r.patternId}</TypedIdBadge>
                      </td>
                      <td className="text-[var(--text-muted)]">{r.product || "—"}</td>
                      <td><CategoryTag label={labelOf(r.productCategory, PRODUCT_CATEGORY_LABELS)} category={r.productCategory} /></td>
                      <td>
                        <span className={cn("text-[12px]", isCore ? "font-semibold text-[var(--accent)]" : "text-[var(--text-muted)]")}>
                          {journeyCode(r.journeyStage)}
                        </span>
                      </td>
                      <td className="text-[12px] text-[var(--text-muted)]">{labelOf(r.screenshotState, SCREENSHOT_STATE_LABELS)}</td>
                      <td><ReuseTag level={r.reuseLevel} /></td>
                      <td>
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
                      <td className="max-w-[120px] truncate text-[11px] text-[var(--text-muted)]">
                        {(Array.isArray(r.tags) && r.tags.length) ? r.tags.join(", ") : "—"}
                      </td>
                      <td className="text-[11px] text-[var(--text-weak)]">{formatDate(r.updatedAt)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="!py-8">
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
          </div>
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
    <DropdownSelect
      size="sm"
      variant="filter"
      value={value as T}
      options={options}
      optionLabels={optionLabels}
      placeholder={placeholder}
      onChange={(v) => onChange(v)}
      aria-label={placeholder}
    />
  );
}
