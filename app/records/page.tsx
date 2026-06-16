"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CORE_JOURNEY_STAGES,
  JOURNEY_STAGES,
  PATTERN_CATEGORIES,
  PRODUCT_CATEGORIES,
  REUSE_LEVELS,
  SCREENSHOT_STATES,
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
  selectClass,
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

  const clearFilter = (key: keyof typeof filters) =>
    setFilters((prev) => ({ ...prev, [key]: "" }));

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (query.trim()) {
      chips.push({ key: "query", label: `“${query.trim()}”`, clear: () => setQuery("") });
    }
    const map: Array<[keyof typeof filters, string]> = [
      ["productCategory", filters.productCategory],
      ["journeyStage", filters.journeyStage],
      ["screenshotState", filters.screenshotState],
      ["patternCategory", filters.patternCategory],
      ["reuseLevel", filters.reuseLevel],
    ];
    for (const [key, value] of map) {
      if (value) chips.push({ key, label: value, clear: () => clearFilter(key) });
    }
    return chips;
  }, [filters, query]);

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return records.filter((r) => {
      const text = [r.patternName, r.product, r.rawNote, r.designJudgment, r.tags.join(" ")]
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
        title="记录"
        description="模式证据数据库。"
        stats={
          <>
            <StatMetric label="总计" value={records.length} compact />
            <StatMetric label="当前显示" value={filtered.length} compact />
          </>
        }
      />
      <PageBody className="page-section-gap">
        <ErrorBanner message={error} />

        <Panel className="filter-panel">
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
            <FilterSelect value={filters.productCategory} options={PRODUCT_CATEGORIES} placeholder="产品类型" onChange={(v) => setFilters({ ...filters, productCategory: v })} />
            <FilterSelect value={filters.journeyStage} options={JOURNEY_STAGES} placeholder="旅程阶段" onChange={(v) => setFilters({ ...filters, journeyStage: v })} />
            <FilterSelect value={filters.screenshotState} options={SCREENSHOT_STATES} placeholder="截图状态" onChange={(v) => setFilters({ ...filters, screenshotState: v })} />
            <FilterSelect value={filters.patternCategory} options={PATTERN_CATEGORIES} placeholder="模式分类" onChange={(v) => setFilters({ ...filters, patternCategory: v })} />
            <FilterSelect value={filters.reuseLevel} options={REUSE_LEVELS} placeholder="复用等级" onChange={(v) => setFilters({ ...filters, reuseLevel: v })} />
          </div>
          {activeChips.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] pt-2.5">
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

        {isLoading ? <LoadingState label="正在读取本地数据…" /> : null}

        <Panel noPadding className="table-scroll">
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
                      <td><CategoryTag label={r.productCategory} category={r.productCategory} /></td>
                      <td>
                        <span className={cn("text-[12px]", isCore ? "font-semibold text-[var(--accent)]" : "text-[var(--text-muted)]")}>
                          {journeyCode(r.journeyStage)}
                        </span>
                      </td>
                      <td className="text-[12px] text-[var(--text-muted)]">{r.screenshotState}</td>
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
                        {r.tags.length ? r.tags.join(", ") : "—"}
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
        </Panel>
      </PageBody>
      <RecordDrawer record={selected} onClose={() => setSelected(null)} />
    </PageFrame>
  );
}

function FilterSelect<T extends string>({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: readonly T[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
