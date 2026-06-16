"use client";

import { useEffect, useState } from "react";
import { PATTERN_CATEGORIES, PATTERN_CATEGORY_DESCRIPTIONS } from "@/lib/constants";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternRecord } from "@/lib/types";
import { journeyCode } from "@/lib/utils";
import {
  CategoryTag,
  EvidenceThumbnail,
  PageBody,
  PageHeader,
  ReuseTag,
  StatMetric,
  TypedIdBadge,
} from "@/components/ui";
import { SlotEmpty } from "@/components/research-ui";
import { RecordDrawer } from "@/components/record-drawer";

export default function LibraryPage() {
  const { records, loadRecords } = useRecordsStore();
  const [selected, setSelected] = useState<PatternRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <div>
      <PageHeader
        title="模式库"
        description="模式图谱 — 六大设计模式分类。"
        stats={<StatMetric label="模式总数" value={records.length} compact />}
      />
      <PageBody className="space-y-3">
        {PATTERN_CATEGORIES.map((category) => {
          const items = records.filter((r) => r.patternCategory === category);
          const products = [...new Set(items.map((r) => r.product).filter(Boolean))];

          return (
            <section
              key={category}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--panel)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[12px] font-semibold">{category}</h2>
                    <span className="tabular-nums mono text-[11px] text-[var(--text-weak)]">
                      {items.length}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    {PATTERN_CATEGORY_DESCRIPTIONS[category]}
                  </p>
                  {products.length > 0 ? (
                    <p className="mt-0.5 text-[10px] text-[var(--text-weak)]">
                      产品：{products.join(", ")}
                    </p>
                  ) : null}
                </div>
                <CategoryTag label={category} category={category} />
              </div>

              {items.length > 0 ? (
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
              ) : (
                <div className="p-3">
                  <SlotEmpty>
                    该分类下尚无模式。
                    <br />
                    采集截图以填充此模式分组。
                  </SlotEmpty>
                </div>
              )}
            </section>
          );
        })}
      </PageBody>
      <RecordDrawer record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
