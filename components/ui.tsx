import type { ReactNode } from "react";
import type { PatternCategory, ProductCategory, ReuseLevel } from "@/lib/types";
import {
  PATTERN_CATEGORY_COLORS,
  PRODUCT_CATEGORY_COLORS,
  REUSE_LEVEL_COLORS,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/* ─── Layout ─── */

export function PageHeader({
  title,
  description,
  stats,
  actions,
}: {
  title: string;
  description?: string;
  stats?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-[12px] leading-5 text-[var(--text-muted)]">{description}</p>
          ) : null}
          {stats ? <div className="mt-2 flex flex-wrap items-center gap-3">{stats}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <main className={cn("p-4", className)}>{children}</main>;
}

export function Panel({
  children,
  className,
  noPadding,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--panel)]",
        !noPadding && "p-3",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--text)]">{title}</h2>
        {meta ? <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{meta}</div> : null}
      </div>
      {actions}
    </div>
  );
}

export function DualLabel({ zh, en }: { zh: string; en: string }) {
  return (
    <span className="inline-flex flex-col leading-tight">
      <span>{zh}</span>
      <span className="text-[10px] font-normal text-[var(--text-weak)]">{en}</span>
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      {children}
    </div>
  );
}

/* ─── Controls ─── */

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "text";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-[var(--radius-md)] border font-medium transition",
        size === "sm" ? "h-7 px-2 text-[12px]" : "h-8 px-3 text-[13px]",
        variant === "primary" &&
          "border-[var(--accent)] bg-[var(--accent)] text-white hover:brightness-95",
        variant === "secondary" &&
          "border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--panel-muted)]",
        variant === "danger" &&
          "border-[var(--danger)] bg-[var(--danger)] text-white hover:brightness-95",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--panel-muted)]",
        variant === "text" &&
          "h-auto border-transparent bg-transparent px-1 py-0 text-[12px] text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text)] hover:underline",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  compact,
}: {
  label: ReactNode;
  hint?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <label className={cn("block", compact ? "space-y-0.5" : "space-y-1")}>
      <span className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)]">
        {label}
        {hint ? <span className="font-normal text-[var(--text-weak)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "focus-ring h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--panel)] px-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-weak)]";

export const textareaClass =
  "focus-ring min-h-[52px] w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[13px] leading-5 text-[var(--text)] placeholder:text-[var(--text-weak)]";

export const selectClass = cn(inputClass, "select-field h-8 cursor-pointer");

export type IdBadgeKind = "evidence" | "pattern" | "stage" | "lens";

const ID_BADGE_STYLES: Record<IdBadgeKind, string> = {
  evidence: "border-[#D4D4CF] bg-[#EEEDE8] text-[#444]",
  pattern: "border-[#C5D0F0] bg-[#EEF2FF] text-[#2F4A8A]",
  stage: "border-[#C8E0E4] bg-[#E8F6F8] text-[#1F5C66]",
  lens: "border-[#DDD] bg-[#F5F5F2] text-[#555]",
};

export function TypedIdBadge({
  kind,
  children,
  className,
}: {
  kind: IdBadgeKind;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mono inline-flex items-center rounded-[var(--radius-sm)] border px-1.5 py-[2px] text-[11px] font-semibold tracking-tight",
        ID_BADGE_STYLES[kind],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Generic ID badge — prefer TypedIdBadge */
export function IdBadge({ children, className }: { children: ReactNode; className?: string }) {
  return <TypedIdBadge kind="lens" className={className}>{children}</TypedIdBadge>;
}

export function CategoryTag({
  label,
  category,
  reuseLevel,
}: {
  label: string;
  category?: ProductCategory | PatternCategory;
  reuseLevel?: ReuseLevel;
}) {
  let style = { bg: "var(--panel-muted)", text: "var(--text-muted)" };
  if (category && category in PRODUCT_CATEGORY_COLORS) {
    const c = PRODUCT_CATEGORY_COLORS[category as ProductCategory];
    style = { bg: c.bg, text: c.text };
  } else if (category && category in PATTERN_CATEGORY_COLORS) {
    const c = PATTERN_CATEGORY_COLORS[category as PatternCategory];
    style = { bg: c.bg, text: c.text };
  } else if (reuseLevel) {
    const c = REUSE_LEVEL_COLORS[reuseLevel];
    style = { bg: c.bg, text: c.text };
  }

  return (
    <span
      className="inline-flex max-w-full truncate rounded-[var(--radius-sm)] px-1.5 py-px text-[11px] font-medium"
      style={{ background: style.bg, color: style.text }}
      title={label}
    >
      {label}
    </span>
  );
}

export function ReuseTag({ level }: { level: ReuseLevel }) {
  const c = REUSE_LEVEL_COLORS[level];
  return (
    <span
      className="inline-flex rounded-[var(--radius-sm)] px-1.5 py-px text-[11px] font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {level}
    </span>
  );
}

/** @deprecated use CategoryTag or ReuseTag */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[var(--radius-sm)] px-1.5 py-px text-[11px] font-medium",
        tone === "neutral" && "bg-[var(--panel-muted)] text-[var(--text-muted)]",
        tone === "blue" && "bg-[var(--accent-muted)] text-[var(--accent)]",
        tone === "green" && "bg-[#EAF5EA] text-[#2F6B3A]",
        tone === "amber" && "bg-[#FDF4E6] text-[#8A5A12]",
        tone === "red" && "bg-[#FDECEA] text-[var(--danger)]",
      )}
    >
      {children}
    </span>
  );
}

/* ─── Data display ─── */

export function StatMetric({
  label,
  value,
  compact,
}: {
  label: string;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--panel)]",
        compact ? "px-2 py-1.5" : "px-3 py-2",
      )}
    >
      <div className="tabular-nums mono text-[14px] font-semibold text-[var(--text)]">{value}</div>
      <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

export function EvidenceThumbnail({
  src,
  alt,
  size = "sm",
  className,
}: {
  src: string;
  alt: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizes = {
    xs: "h-8 w-12",
    sm: "h-8 w-12",
    md: "h-10 w-16",
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(
        "rounded-[var(--radius-sm)] border border-[var(--border)] object-cover",
        sizes[size],
        className,
      )}
    />
  );
}

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  compact,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--panel-muted)] p-0.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={cn(
            "focus-ring rounded-[var(--radius-sm)] font-medium transition",
            compact ? "h-6 min-w-6 px-1.5 text-[11px]" : "h-7 min-w-7 px-2 text-[12px]",
            value === opt.value
              ? "bg-[var(--panel)] text-[var(--accent)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text)]",
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: "empty" | "ready" | "analyzing" | "analyzed";
}) {
  const map = {
    empty: { label: "空", color: "var(--text-weak)" },
    ready: { label: "就绪", color: "var(--warning)" },
    analyzing: { label: "分析中", color: "var(--accent)" },
    analyzed: { label: "已分析", color: "var(--success)" },
  };
  const { label, color } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ─── States ─── */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--panel)] px-6 py-8 text-center">
      <h2 className="text-[13px] font-semibold text-[var(--text)]">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-5 text-[var(--text-muted)]">
        {description}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-[#F5C2C0] bg-[#FDECEA] px-2.5 py-1.5 text-[12px] text-[var(--danger)]">
      {message}
    </div>
  );
}

export function LoadingState({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-[12px] text-[var(--text-muted)]">
      {label}
    </div>
  );
}

export function Divider() {
  return <hr className="border-0 border-t border-[var(--border)]" />;
}
