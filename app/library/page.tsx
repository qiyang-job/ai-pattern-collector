"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PATTERN_CATEGORIES, PATTERN_CATEGORY_DESCRIPTIONS } from "@/lib/constants";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternRecord } from "@/lib/types";
import { journeyCode } from "@/lib/utils";
import {
  CategoryTag,
  EvidenceThumbnail,
  PageBody,
  PageFrame,
  PageHeader,
  Panel,
  PanelHeader,
  ReuseTag,
  StatMetric,
  TypedIdBadge,
} from "@/components/ui";
import { SlotEmpty } from "@/components/research-ui";
import { RecordDrawer } from "@/components/record-drawer";

function categorySlug(category: string) {
  return `lib-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export default function LibraryPage() {
  const { records, loadRecords } = useRecordsStore();
  const [selected, setSelected] = useState<PatternRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <PageFrame>
      <PageHeader
        title="模式库"
        description="模式图谱 — 六大设计模式分类。"
        stats={<StatMetric label="模式总数" value={records.length} compact />}
      />
      <PageBody className="page-section-gap">
        <Panel>
          <PanelHeader title="模式分类概览" meta="点击跳转" />
          <div className="library-overview">
            {PATTERN_CATEGORIES.map((category) => {
              const count = records.filter((r) => r.patternCategory === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  className="library-overview-chip"
                  data-empty={count === 0}
                  onClick={() =>
                    document
                      .getElementById(categorySlug(category))
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium text-[var(--text)]">
                      {category}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[var(--text-weak)]">
                      {count > 0 ? `${count} 条模式` : "待采样"}
                    </span>
                  </span>
                  <span className="library-overview-chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        {PATTERN_CATEGORIES.map((category) => {
          const items = records.filter((r) => r.patternCategory === category);
          const products = [...new Set(items.map((r) => r.product).filter(Boolean))];

          return (
            <Panel key={category} id={categorySlug(category)} noPadding className="scroll-mt-4 overflow-hidden">
              <div className="capture-column-header library-category-header flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="capture-column-header-title">{category}</h2>
                    <span className="tabular-nums mono text-[11px] text-[var(--text-weak)]">
                      {items.length}
                    </span>
                  </div>
                  <p className="capture-column-header-subtitle">
                    {PATTERN_CATEGORY_DESCRIPTIONS[category]}
                  </p>
                  {products.length > 0 ? (
                    <p className="mt-0.5 text-[10px] text-[var(--text-weak)]">
                      产品：{products.join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <CategoryTag label={category} category={category} />
                  {items.length > 0 ? (
                    <Link
                      href={`/records?patternCategory=${encodeURIComponent(category)}`}
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
                    >
                      在记录中查看 →
                    </Link>
                  ) : null}
                </div>
              </div>

              {items.length > 0 ? (
                <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>证据</th>
                      <th>模式</th>
                      <th>产品</th>
                      <th>阶段</th>
                      <th>复用</th>
                      <th>用户问题</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id} data-clickable="true" onClick={() => setSelected(r)}>
                        <td>
                          <div className="flex items-center gap-2">
                            <EvidenceThumbnail src={r.imageDataUrl} alt={r.screenshotId} />
                            <TypedIdBadge kind="evidence">{r.screenshotId}</TypedIdBadge>
                          </div>
                        </td>
                        <td>
                          <div className="max-w-[140px] truncate font-medium">{r.patternName}</div>
                          <TypedIdBadge kind="pattern" className="mt-0.5">{r.patternId}</TypedIdBadge>
                        </td>
                        <td className="text-[var(--text-muted)]">{r.product || "—"}</td>
                        <td><TypedIdBadge kind="stage">{journeyCode(r.journeyStage)}</TypedIdBadge></td>
                        <td><ReuseTag level={r.reuseLevel} /></td>
                        <td className="max-w-[180px] truncate text-[12px] text-[var(--text-muted)]">
                          {r.userProblem}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              ) : (
                <div className="page-gutter">
                  <SlotEmpty>
                    该分类下尚无模式。
                    <br />
                    采集截图以填充此模式分组。
                  </SlotEmpty>
                </div>
              )}
            </Panel>
          );
        })}
      </PageBody>
      <RecordDrawer record={selected} onClose={() => setSelected(null)} />
    </PageFrame>
  );
}
