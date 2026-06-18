import { ensureAuth, getApp } from "@/lib/cloudbase";

export const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80MB，留余量给云函数/API
export const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";
export const VIDEO_ANALYZE_FPS = 2;

export function isVideoMime(type: string): boolean {
  return type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(type);
}

export function formatVideoMeta(file: File): string {
  const mb = (file.size / 1024 / 1024).toFixed(1);
  return `${file.type || "video"} · ${mb} MB`;
}

/** 上传录屏到 CloudBase 云存储，返回 fileID */
export async function uploadVideoFile(recordKey: string, file: File): Promise<string> {
  await ensureAuth();
  const ext =
    file.name.match(/\.(\w+)$/)?.[1]?.toLowerCase() ||
    (file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4");
  const cloudPath = `videos/${recordKey}.${ext}`;
  const result = await getApp().uploadFile({
    cloudPath,
    filePath: file as unknown as string,
  });
  if (!result.fileID) throw new Error("录屏上传失败");
  return result.fileID;
}

/** 上传录屏并获取可供模型访问的临时 HTTPS URL */
export async function uploadVideoForAnalysis(
  recordKey: string,
  file: File,
): Promise<{ fileID: string; videoUrl: string }> {
  const fileID = await uploadVideoFile(recordKey, file);
  const videoUrl = await getCloudFileTempUrl(fileID);
  if (!videoUrl) throw new Error("录屏临时链接获取失败，请重试");
  return { fileID, videoUrl };
}

async function getCloudFileTempUrl(fileID: string): Promise<string | null> {
  try {
    await ensureAuth();
    const res = await getApp().getTempFileURL({
      fileList: [{ fileID, maxAge: 3600 }],
    });
    return res.fileList?.[0]?.tempFileURL ?? res.fileList?.[0]?.download_url ?? null;
  } catch {
    return null;
  }
}

/** 从录屏截取封面帧，用于列表缩略图 */
export async function captureVideoPoster(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<string>((resolve, reject) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const t = Number.isFinite(video.duration)
          ? Math.min(0.8, Math.max(0, video.duration * 0.15))
          : 0;
        video.currentTime = t;
      };

      video.onseeked = () => {
        try {
          const max = 1280;
          const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight, 1));
          const w = Math.max(1, Math.round(video.videoWidth * scale));
          const h = Math.max(1, Math.round(video.videoHeight * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")?.drawImage(video, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (e) {
          reject(e instanceof Error ? e : new Error("封面截取失败"));
        }
      };

      video.onerror = () => reject(new Error("视频加载失败"));
      video.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
