"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";

const REVIEW_DRAWER_MS = 280;

export function ReviewDrawerShell({
  kicker,
  title,
  ariaLabel,
  headerActions,
  children,
  footer,
  onClose,
  hideClose = false,
  hideHeader = false,
}: {
  kicker: string;
  title: string;
  ariaLabel?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  hideClose?: boolean;
  hideHeader?: boolean;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let enterFrame = 0;
    const mountFrame = requestAnimationFrame(() => {
      enterFrame = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(mountFrame);
      cancelAnimationFrame(enterFrame);
    };
  }, []);

  function handleClose() {
    setEntered(false);
    window.setTimeout(onClose, REVIEW_DRAWER_MS);
  }

  return (
    <div className="capture-drawer-layer">
      <button
        type="button"
        className="capture-drawer-backdrop"
        aria-label="关闭面板"
        onClick={handleClose}
      />
      <aside
        className={cn("capture-review-drawer", entered && "is-open")}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        aria-hidden={!entered}
      >
        {hideHeader ? null : (
          <header className="capture-drawer-header page-gutter-x">
            <div className="min-w-0">
              <div className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-weak)]">
                {kicker}
              </div>
              <h2 className="capture-drawer-title display-serif">{title}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerActions}
              {hideClose ? null : (
                <button
                  type="button"
                  className="evidence-recap-edit focus-ring"
                  onClick={handleClose}
                  aria-label="收起"
                  title="收起"
                >
                  <PanelRightClose className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </header>
        )}
        <div className="capture-review-drawer-body">{children}</div>
        {footer}
      </aside>
    </div>
  );
}
