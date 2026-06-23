import { callCloudFunction, ensureAuth, getApp } from "@/lib/cloudbase";

/** 云存储路径仅允许字母数字与 / - _ . */
export function sanitizeStorageKey(key: string): string {
  const cleaned = key.replace(/[^0-9a-zA-Z/!._*\-]/g, "-").replace(/-+/g, "-");
  return cleaned || `draft-${Date.now()}`;
}

export type CloudUploadResult = {
  fileID: string;
  tempFileURL?: string;
};

export function formatCloudbaseStorageError(error: unknown, action = "文件上传"): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "未知错误";

  if (!raw.includes("[storage]") && !raw.includes("OPERATION_FAIL")) {
    return raw || `${action}失败`;
  }

  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
      return `${action}失败：当前开发域名（${host}）无法直传云存储，系统正在尝试云函数回退上传。若仍失败，请使用已部署站点重试。`;
    }
  }

  return `${action}云存储失败，请确认已登录且网络正常后重试`;
}

function isStorageOperationError(error: unknown): boolean {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.includes("[storage]") || raw.includes("OPERATION_FAIL");
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("分片读取失败"));
        return;
      }
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        reject(new Error("分片编码失败"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("分片读取失败"));
    reader.readAsDataURL(blob);
  });
}

const UPLOAD_FN_TIMEOUT_MS = 120_000;

async function uploadViaCloudFunction(
  cloudPath: string,
  file: File,
  onProgress?: (message: string) => void,
): Promise<CloudUploadResult> {
  const chunkSize = 2 * 1024 * 1024;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    onProgress?.(`正在上传录屏 ${chunkIndex + 1}/${totalChunks}…`);
    const blob = file.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize);
    const chunkBase64 = await blobToBase64(blob);
    const result = await callCloudFunction<{
      fileID?: string;
      tempFileURL?: string;
      error?: string;
    }>(
      "upload-evidence",
      {
        action: "chunk",
        uploadId,
        cloudPath,
        chunkIndex,
        totalChunks,
        chunkBase64,
        contentType: file.type || "application/octet-stream",
      },
      { timeoutMs: UPLOAD_FN_TIMEOUT_MS },
    );
    if (result.error) throw new Error(result.error);
    if (result.fileID) {
      return {
        fileID: result.fileID,
        tempFileURL: result.tempFileURL,
      };
    }
  }

  throw new Error("录屏上传未完成");
}

export async function getCloudFileTempUrlViaFunction(fileID: string): Promise<string | null> {
  try {
    const result = await callCloudFunction<{ tempFileURL?: string; error?: string }>(
      "upload-evidence",
      { action: "temp-url", fileID },
      { timeoutMs: 30_000 },
    );
    return result.tempFileURL ?? null;
  } catch {
    return null;
  }
}

export async function uploadBlobToCloud(
  cloudPath: string,
  file: File | Blob,
  fileName: string,
  options?: { onProgress?: (message: string) => void },
): Promise<CloudUploadResult> {
  await ensureAuth();
  const payload =
    file instanceof File
      ? file
      : new File([file], fileName, { type: file.type || "application/octet-stream" });

  try {
    const result = await getApp().uploadFile({
      cloudPath,
      filePath: payload as unknown as string,
    });
    if (!result?.fileID) throw new Error("云存储未返回 fileID");
    return { fileID: result.fileID };
  } catch (error) {
    if (!isStorageOperationError(error)) {
      throw new Error(formatCloudbaseStorageError(error, "录屏上传"));
    }
    return uploadViaCloudFunction(cloudPath, payload, options?.onProgress);
  }
}
