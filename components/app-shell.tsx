"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  Archive,
  BarChart3,
  Boxes,
  Download,
  FileSearch,
  Grid3X3,
  Lightbulb,
} from "lucide-react";
import { Toaster } from "sonner";
import { useRecordsStore } from "@/lib/records-store";
import { computeMatrixCoverage } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { CoverageBar } from "@/components/research-ui";

const navItems = [
  { href: "/capture", label: "采集", icon: FileSearch },
  { href: "/records", label: "记录", icon: Archive },
  { href: "/matrix", label: "矩阵", icon: Grid3X3 },
  { href: "/journey", label: "旅程", icon: BarChart3 },
  { href: "/library", label: "模式库", icon: Boxes },
  { href: "/insights", label: "洞察", icon: Lightbulb },
  { href: "/export", label: "导出", icon: Download },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { records, loadRecords } = useRecordsStore();

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const products = useMemo(
    () => new Set(records.map((r) => r.product).filter(Boolean)).size,
    [records],
  );
  const coverage = useMemo(() => computeMatrixCoverage(records), [records]);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--panel)]">
        <div className="shrink-0 border-b border-[var(--border)] px-3 py-3">
          <div className="text-[13px] font-semibold tracking-tight">AI Pattern Collector</div>
          <div className="mt-0.5 text-[11px] text-[var(--text-weak)]">AI 产品设计模式研究工作台</div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative mb-px flex h-8 items-center gap-2 rounded-[var(--radius-md)] px-2 text-[13px] transition",
                  isActive
                    ? "bg-[var(--accent-muted)] font-medium text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]",
                )}
              >
                {isActive ? (
                  <span className="absolute bottom-1 left-0 top-1 w-0.5 rounded-full bg-[var(--accent)]" />
                ) : null}
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--panel)] p-3 pb-4">
          <div className="mb-2 text-[10px] font-semibold tracking-wide text-[var(--text-weak)]">
            研究覆盖度
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <SidebarStat label="截图" value={records.length} />
            <SidebarStat label="模式" value={records.length} />
            <SidebarStat label="产品" value={products} />
            <SidebarStat label="覆盖率" value={`${coverage.percent}%`} />
          </div>
          <CoverageBar percent={coverage.percent} />
          <div className="mt-1.5 text-[9px] text-[var(--text-weak)]">
            矩阵已填充 {coverage.filled}/{coverage.total} 格
          </div>
        </div>
      </aside>

      <div className="ml-[220px] min-h-screen flex-1">{children}</div>
      <Toaster
        position="top-right"
        richColors
        expand={false}
        visibleToasts={3}
        closeButton={false}
      />
    </div>
  );
}

function SidebarStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--panel-muted)] px-2 py-1">
      <div className="tabular-nums mono text-[12px] font-semibold">{value}</div>
      <div className="text-[10px] text-[var(--text-weak)]">{label}</div>
    </div>
  );
}
