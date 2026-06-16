"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CORE_JOURNEY_STAGES,
  JOURNEY_STAGES,
  PRODUCT_CATEGORIES,
} from "@/lib/constants";
import { useRecordsStore } from "@/lib/records-store";
import { computeMatrixCoverage, getMatrixCellRecords } from "@/lib/stats";
import type { PatternRecord } from "@/lib/types";
import { average, cn, journeyCode, journeyName } from "@/lib/utils";
import { PageBody, PageHeader, StatMetric, TypedIdBadge } from "@/components/ui";
import { RecordDrawer } from "@/components/record-drawer";

export default function MatrixPage() {
  const { records, loadRecords } = useRecordsStore();
  const [selected, setSelected] = useState<PatternRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const coverage = useMemo(() => computeMatrixCoverage(records), [records]);

  return (
    <div>
      <PageHeader
        title="矩阵"
        description="产品类型 × 旅程阶段 — 方法论覆盖地图。"
        stats={
          <>
            <StatMetric label="模式数" value={records.length} compact />
            <StatMetric label="矩阵格" value={`${coverage.filled}/${coverage.total}`} compact />
            <StatMetric label="覆盖率" value={`${coverage.percent}%`} compact />
          </>
        }
      />
      <PageBody>
        <div className="overflow-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--panel)]">
          <table className="matrix-table min-w-[1100px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-32 bg-[var(--panel-muted)]">阶段</th>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <th key={cat} className="min-w-[130px]">{cat}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JOURNEY_STAGES.map((stage) => {
                const isCore = CORE_JOURNEY_STAGES.some((s) => s === stage);
                return (
                  <tr key={stage}>
                    <th
                      className={cn(
                        "sticky left-0 z-10 w-32 bg-[var(--panel-muted)] px-2 py-1.5 text-left",
                        isCore && "matrix-row-label--core",
                      )}
                    >
                      <TypedIdBadge kind="stage">{journeyCode(stage)}</TypedIdBadge>
                      <div className={cn("mt-0.5 text-[11px]", isCore ? "font-semibold" : "text-[var(--text-muted)]")}>
                        {journeyName(stage)}
                      </div>
                      {isCore ? (
                        <div className="mt-0.5 text-[9px] font-medium uppercase text-[var(--accent)]">核心</div>
                      ) : null}
                    </th>
                    {PRODUCT_CATEGORIES.map((cat) => {
                      const cell = getMatrixCellRecords(records, cat, stage);
                      const products = [...new Set(cell.map((r) => r.product).filter(Boolean))];
                      const avgReuse = average(cell.map((r) => r.lensScore.reusability));
                      const filled = cell.length > 0;
                      return (
                        <td
                          key={`${stage}-${cat}`}
                          className={cn(
                            "matrix-cell",
                            filled ? "matrix-cell--filled" : "matrix-cell--empty",
                            isCore && "matrix-cell--core",
                            filled && "cursor-pointer hover:bg-[var(--accent-muted)]",
                          )}
                          onClick={() => filled && setSelected(cell[0])}
                        >
                          {filled ? (
                            <>
                              <div className="flex gap-2 text-[10px] text-[var(--text-muted)]">
                                <span><strong className="tabular-nums text-[var(--text)]">{cell.length}</strong> 个模式</span>
                                <span><strong className="tabular-nums text-[var(--text)]">{cell.length}</strong> 张截图</span>
                              </div>
                              <div className="mt-1 space-y-0.5">
                                {cell.slice(0, 3).map((r) => (
                                  <div key={r.id} className="truncate text-[11px] font-medium">{r.patternName}</div>
                                ))}
                              </div>
                              <div className="mt-1 text-[10px] text-[var(--text-weak)]">
                                平均复用性 {avgReuse.toFixed(1)}
                                {products.length ? ` · ${products.slice(0, 2).join(", ")}` : ""}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-[10px] font-medium uppercase text-[var(--text-weak)]">空</div>
                              <div className="mt-1 text-[10px] text-[var(--text-weak)]">0 个模式</div>
                              <div className="text-[10px] text-[var(--text-weak)]">0 张截图</div>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageBody>
      <RecordDrawer record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
