"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const EXTRACTING_ITEMS = [
  { key: "evidence", label: "读取证据与研究备注" },
  { key: "ui", label: "识别界面结构与交互规则" },
  { key: "trust", label: "判断信任机制与恢复路径" },
  { key: "reuse", label: "评估复用价值并生成摘要" },
] as const;

type ExtractingItemKey = (typeof EXTRACTING_ITEMS)[number]["key"];

function getExtractingItemStatus(
  key: ExtractingItemKey,
  index: number,
  activeIndex: number,
  hasProduct: boolean,
): "done" | "active" | "waiting" {
  if (key === "evidence" && hasProduct) return "done";
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "active";
  return "waiting";
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
      setActiveIndex((index) => Math.min(index + 1, EXTRACTING_ITEMS.length - 1));
    }, 2400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="workspace-panel workspace-panel--extracting">
      <h3 className="workspace-panel-title">{title}</h3>
      <p className="workspace-panel-subtitle">证据与备注已保留，可以安全等待或稍后重试。</p>

      <ol className="extracting-stage-list" aria-live="polite">
        {EXTRACTING_ITEMS.map((item, index) => {
          const status = getExtractingItemStatus(item.key, index, activeIndex, hasProduct);
          return (
            <li key={item.key} className={cn("extracting-stage", `is-${status}`)}>
              <span className="extracting-stage-marker" aria-hidden="true">
                {status === "done" ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
