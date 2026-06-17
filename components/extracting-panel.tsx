"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EXTRACTING_ITEMS = [
  { key: "screenshot", label: "截图证据", done: true },
  { key: "note", label: "研究备注", done: true },
  { key: "product", label: "产品上下文", done: false },
  { key: "ui", label: "界面结构", done: false },
  { key: "trust", label: "信任机制", done: false },
  { key: "reuse", label: "复用潜力", done: false },
] as const;

type ExtractingItemKey = (typeof EXTRACTING_ITEMS)[number]["key"];

function getExtractingItemStatus(key: ExtractingItemKey, hasProduct: boolean): "done" | "active" {
  if (key === "screenshot" || key === "note") return "done";
  if (key === "product" && hasProduct) return "done";
  return "active";
}

export function ExtractingPanel({
  hasProduct,
  title = "正在提炼模式…",
}: {
  hasProduct: boolean;
  title?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % EXTRACTING_ITEMS.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const activeItem = EXTRACTING_ITEMS[activeIndex];
  const activeStatus = getExtractingItemStatus(activeItem.key, hasProduct);

  return (
    <div className="workspace-panel workspace-panel--extracting">
      <h3 className="workspace-panel-title">{title}</h3>

      <div className="extracting-carousel mt-3">
        <div className="extracting-carousel-viewport" aria-live="polite" aria-atomic="true">
          <div
            key={activeItem.key}
            className={cn("extracting-carousel-item", `is-${activeStatus}`)}
          >
            {activeItem.label}
          </div>
        </div>
      </div>
    </div>
  );
}
