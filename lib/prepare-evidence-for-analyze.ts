import { ensureAuth } from "@/lib/cloudbase";
import { tryUploadDataUrlForAnalysis } from "@/lib/db";

/** CloudBase callFunction 入参上限约 6MB，预留文本字段余量 */
export const MAX_ANALYZE_PAYLOAD_BYTES = 5_500_000;
const MAX_IMAGES = 9;

function isRemoteUrl(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

function isDataImage(src: string): boolean {
  return src.startsWith("data:image/");
}

/**
 * 将单张 data URL 压缩到目标体积内（用于 AI 分析入参）
 */
async function compressDataUrlToBudget(dataUrl: string, maxChars: number): Promise<string> {
  if (!isDataImage(dataUrl)) return dataUrl;
  if (dataUrl.length <= maxChars) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scales = [1, 0.85, 0.7, 0.55, 0.45];
      const maxBases = [1600, 1400, 1280, 1024, 896];
      const qualities = [0.72, 0.62, 0.52, 0.42, 0.35, 0.28];

      let best = dataUrl;

      for (const maxBase of maxBases) {
        for (const scale of scales) {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          const ratio = Math.min(1, (maxBase / Math.max(w, h, 1)) * scale);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);

          for (const q of qualities) {
            const result = canvas.toDataURL("image/jpeg", q);
            if (result.length < best.length) best = result;
            if (result.length <= maxChars) {
              resolve(result);
              return;
            }
          }
        }
      }

      resolve(best.length <= dataUrl.length ? best : dataUrl);
    };
    img.onerror = () => reject(new Error("图片加载失败，无法压缩"));
    img.src = dataUrl;
  });
}

function estimatePayloadBytes(imageDataUrls: string[], extra: Record<string, unknown>): number {
  return JSON.stringify({ imageDataUrls, ...extra }).length;
}

function perImageInlineBudget(imageCount: number, remoteCount: number): number {
  if (imageCount <= 0) return 550_000;
  const reserved = 80_000 + remoteCount * 400;
  return Math.min(450_000, Math.floor((MAX_ANALYZE_PAYLOAD_BYTES - reserved) / imageCount));
}

export type PrepareImagesOptions = {
  /** 尝试上传 base64 到云存储（失败时自动回退压缩直传） */
  storageKeyPrefix?: string;
  onProgress?: (message: string) => void;
};

/**
 * 为多图 AI 分析准备图片列表：
 * - HTTPS 链接原样传递
 * - base64 优先尝试上传云存储；失败则压缩后直传（兼容 localhost 未配安全域名）
 */
export async function prepareImagesForAnalysis(
  sources: string[],
  context: Record<string, unknown> = {},
  options: PrepareImagesOptions = {},
): Promise<string[]> {
  const urls = sources.filter(Boolean).slice(0, MAX_IMAGES);
  if (urls.length === 0) return [];

  const { storageKeyPrefix, onProgress } = options;
  const dataUrls = urls.filter(isDataImage);
  const remoteCount = urls.filter(isRemoteUrl).length;
  const inlineBudget = perImageInlineBudget(dataUrls.length, remoteCount);

  if (storageKeyPrefix && dataUrls.length > 0) {
    await ensureAuth();
  }

  const out: string[] = [];
  let dataIndex = 0;

  for (let i = 0; i < urls.length; i++) {
    const src = urls[i];
    if (isRemoteUrl(src)) {
      out.push(src);
      continue;
    }
    if (isDataImage(src)) {
      dataIndex += 1;
      const compressed = await compressDataUrlToBudget(src, inlineBudget);

      if (storageKeyPrefix) {
        onProgress?.(`正在处理截图 ${dataIndex}/${dataUrls.length}…`);
        const uploaded = await tryUploadDataUrlForAnalysis(
          `${storageKeyPrefix}-analyze-${i}`,
          compressed,
        );
        if (uploaded) {
          out.push(uploaded);
          continue;
        }
      }

      out.push(compressed);
      continue;
    }
    out.push(src);
  }

  let payloadSize = estimatePayloadBytes(out, context);
  if (payloadSize <= MAX_ANALYZE_PAYLOAD_BYTES) {
    return out;
  }

  // 二次压降：仅处理仍含 base64 的项
  const tighter = Math.max(180_000, Math.floor(inlineBudget * 0.6));
  const retried = await Promise.all(
    out.map((src) => (isDataImage(src) ? compressDataUrlToBudget(src, tighter) : src)),
  );
  payloadSize = estimatePayloadBytes(retried, context);

  if (payloadSize > MAX_ANALYZE_PAYLOAD_BYTES) {
    throw new Error(
      `证据过大（约 ${(payloadSize / 1024 / 1024).toFixed(1)}MB），请减少截图数量后重试`,
    );
  }

  return retried;
}

/** 解析云函数 analyze 返回体 */
export function parseAnalyzeCloudResult(raw: unknown): Record<string, unknown> {
  if (raw == null || typeof raw !== "object") {
    throw new Error("云函数返回为空，可能是分析超时，请稍后重试或减少截图数量");
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.error === "string" && obj.error) {
    throw new Error(obj.error);
  }
  const payload =
    typeof obj._serialized === "string" ? JSON.parse(obj._serialized) : obj;
  if (!payload || typeof payload !== "object") {
    throw new Error("AI 返回格式无效");
  }
  const record = payload as Record<string, unknown>;
  if (!String(record.patternName ?? "").trim()) {
    throw new Error("AI 未返回有效模式名称，请稍后重试或减少截图数量");
  }
  return record;
}
