"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  const { records, loadRecords, isLoading, error } = useRecordsStore();
  const [selected, setSelected] = useState<PatternRecord | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    productCategory: "",
    journeyStage: "",
    screenshotState: "",
    patternCategory: "",
    reuseLevel: "",
  });

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

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
    <div>
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
      <PageBody className="space-y-3">
        <ErrorBanner message={error} />

        <Panel noPadding className="p-2">
          <div className="grid gap-2 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
            <input
              className={inputClass}
              placeholder="搜索…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <FilterSelect value={filters.productCategory} options={PRODUCT_CATEGORIES} placeholder="产品类型" onChange={(v) => setFilters({ ...filters, productCategory: v })} />
            <FilterSelect value={filters.journeyStage} options={JOURNEY_STAGES} placeholder="旅程阶段" onChange={(v) => setFilters({ ...filters, journeyStage: v })} />
            <FilterSelect value={filters.screenshotState} options={SCREENSHOT_STATES} placeholder="截图状态" onChange={(v) => setFilters({ ...filters, screenshotState: v })} />
            <FilterSelect value={filters.patternCategory} options={PATTERN_CATEGORIES} placeholder="模式分类" onChange={(v) => setFilters({ ...filters, patternCategory: v })} />
            <FilterSelect value={filters.reuseLevel} options={REUSE_LEVELS} placeholder="复用等级" onChange={(v) => setFilters({ ...filters, reuseLevel: v })} />
          </div>
        </Panel>

        {isLoading ? <LoadingState label="正在读取本地数据…" /> : null}

        <Panel noPadding className="overflow-hidden">
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
                      <td className="tabular-nums mono text-[12px]">{averageLensScore(r).toFixed(1)}</td>
                      <td className="text-[11px] text-[var(--text-weak)]">{formatDate(r.updatedAt)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="!py-8">
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
    </div>
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
