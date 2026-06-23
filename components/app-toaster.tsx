"use client";

import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import { useThemeStore } from "@/lib/theme-store";

const toasterStyle = {
  "--width": "max-content",
  left: "50vw",
  right: "auto",
  width: "max-content",
  transform: "translateX(-50%)",
} as CSSProperties;

export function AppToaster() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <Toaster
      position="top-center"
      theme={theme}
      richColors={false}
      expand={false}
      visibleToasts={3}
      closeButton={false}
      gap={6}
      offset={{ top: 14 }}
      style={toasterStyle}
      toastOptions={{
        classNames: {
          toast: "app-toast",
          title: "app-toast-title",
          description: "app-toast-description",
        },
      }}
    />
  );
}
