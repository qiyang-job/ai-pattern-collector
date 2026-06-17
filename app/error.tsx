"use client";

import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 保留错误信息便于排查，但不让单条脏数据 / 渲染异常拖垮整站
    console.error("[route-error]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600 }}>页面渲染遇到问题</div>
      <p style={{ maxWidth: 420, fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)" }}>
        当前页面在处理数据时出错（通常是某条记录字段不完整）。其它页面不受影响，可重试或返回首页。
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={reset}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 12,
            cursor: "pointer",
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          重试
        </button>
        <a
          href="/"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 12,
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
