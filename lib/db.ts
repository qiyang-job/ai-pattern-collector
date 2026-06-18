import { getDb, ensureAuth, getApp } from "./cloudbase";
import { normalizeRecord } from "./normalize";
import type { PatternRecord } from "./types";

// ── 类型 ──────────────────────────────────────────────

export interface CounterMeta {
  screenshotSeq: number;
  patternSeq: number;
  /** 上次分配编号的时间戳，用于防止短时间内重复分配 */
  lastReservedAt?: string;
}

// ── 防重入锁：同一秒内不重复分配 ────────────────────────
let _lastReservedMs = 0;
const RESERVE_DEBOUNCE_MS = 1000; // 1s 内不重复分配

/** 基于已保存记录分配下一个编号，并回写 meta 计数器保持同步 */
export async function reserveNextRecordIds(): Promise<{
  screenshotId: string;
  patternId: string;
}> {
  const now = Date.now();
  if (now - _lastReservedMs < RESERVE_DEBOUNCE_MS) {
    throw new Error("编号分配过于频繁，请稍后再试");
  }
  _lastReservedMs = now;

  return authed(async () => {
    const savedMax = await readMaxSavedSeq();
    const next = {
      screenshotSeq: savedMax.screenshotSeq + 1,
      patternSeq: savedMax.patternSeq + 1,
      lastReservedAt: new Date().toISOString(),
    };
    await writeCounters(next);
    return formatRecordIds(next);
  });
}

export interface InsightMeta {
  value: string;
  updatedAt: string;
}

// ── 内部：确保已认证再操作 ─────────────────────────────

function records() {
  return getDb().collection("records");
}

function meta() {
  return getDb().collection("meta");
}

async function authed<T>(fn: () => Promise<T>): Promise<T> {
  await ensureAuth();
  return fn();
}

// ─── 截图上传云存 ────────────────────────────────────

/** 将 base64 dataURL 上传到 CloudBase 云存，返回 fileID；失败时返回 undefined */
async function uploadDataUrlToStorage(
  storageKey: string,
  imageDataUrl: string,
): Promise<string | undefined> {
  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) return undefined;

  try {
    const [header, base64] = imageDataUrl.split(",");
    const mime = header.match(/data:(.*?);/)?.[1] ?? "image/png";
    const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const file = new File([blob], `${storageKey}.${ext}`, { type: mime });

    const cloudPath = `screenshots/${storageKey}.${ext}`;
    const result = await getApp().uploadFile({
      cloudPath,
      // Web SDK 浏览器端传入 File 对象（类型声明为 string）
      filePath: file as unknown as string,
    });
    if (!result?.fileID) return undefined;
    return result.fileID;
  } catch (e) {
    console.warn("[cloudbase] 图片上传失败", storageKey, e);
    return undefined;
  }
}

/** 将 base64 dataURL 上传到 CloudBase 云存，返回 fileID；失败时返回 undefined */
async function uploadImageIfNeeded(
  id: string,
  imageDataUrl: string,
  existingFileID?: string,
): Promise<string | undefined> {
  if (existingFileID) return existingFileID; // 已上传过，跳过
  return uploadDataUrlToStorage(id, imageDataUrl);
}

/** 上传截图并返回可供模型访问的临时 HTTPS URL；失败返回 null（不抛错） */
export async function tryUploadDataUrlForAnalysis(
  storageKey: string,
  imageDataUrl: string,
): Promise<string | null> {
  try {
    return await uploadDataUrlForAnalysis(storageKey, imageDataUrl);
  } catch (e) {
    console.warn("[cloudbase] 分析用截图上传跳过，将使用压缩直传", storageKey, e);
    return null;
  }
}

/** 上传截图并返回可供模型访问的临时 HTTPS URL（用于 AI 分析入参瘦身） */
export async function uploadDataUrlForAnalysis(
  storageKey: string,
  imageDataUrl: string,
): Promise<string> {
  await ensureAuth();
  const fileID = await uploadDataUrlToStorage(storageKey, imageDataUrl);
  if (!fileID) throw new Error("截图上传云存储失败");
  const url = await getImageTempUrl(fileID);
  if (!url) throw new Error("截图临时链接获取失败");
  return url;
}

/** 根据 fileID 获取临时访问 URL */
export async function getImageTempUrl(
  fileID: string,
): Promise<string | null> {
  if (!fileID) return null;
  try {
    await ensureAuth();
    const res = await getApp().getTempFileURL({
      fileList: [{ fileID, maxAge: 3600 }],
    });
    return (
      res.fileList?.[0]?.tempFileURL ??
      res.fileList?.[0]?.download_url ??
      null
    );
  } catch {
    return null;
  }
}

// ─── 计数器 (meta 集合) ────────────────────────────────

function countersDoc() {
  return meta().where({ key: "counters" }).get();
}

async function readCounters(): Promise<CounterMeta> {
  const res = await countersDoc();
  if (res.data?.[0]?.value) return res.data[0].value as CounterMeta;
  return { screenshotSeq: 0, patternSeq: 0 };
}

function parseSeq(id: string | undefined, prefix: "S" | "P"): number {
  const match = String(id ?? "").match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
  return match ? Number.parseInt(match[1], 10) : 0;
}

async function readAllRecordsRaw(): Promise<Record<string, unknown>[]> {
  const pageSize = 100;
  let skip = 0;
  const all: Record<string, unknown>[] = [];

  while (true) {
    const res = await records().skip(skip).limit(pageSize).get();
    const batch = (res.data ?? []) as Record<string, unknown>[];
    all.push(...batch);
    if (batch.length < pageSize) break;
    skip += pageSize;
  }

  return all;
}

/** 从已保存记录推导当前最大序号（唯一可信来源） */
async function readMaxSavedSeq(): Promise<Pick<CounterMeta, "screenshotSeq" | "patternSeq">> {
  const items = await readAllRecordsRaw();
  let screenshotSeq = 0;
  let patternSeq = 0;

  for (const raw of items) {
    const record = normalizeRecord(raw);
    screenshotSeq = Math.max(screenshotSeq, parseSeq(record.screenshotId, "S"));
    patternSeq = Math.max(patternSeq, parseSeq(record.patternId, "P"));
  }

  return { screenshotSeq, patternSeq };
}

function formatRecordIds(seq: Pick<CounterMeta, "screenshotSeq" | "patternSeq">) {
  return {
    screenshotId: `S-${String(seq.screenshotSeq).padStart(3, "0")}`,
    patternId: `P-${String(seq.patternSeq).padStart(3, "0")}`,
  };
}

async function writeCounters(val: CounterMeta): Promise<void> {
  const existing = await countersDoc();
  if (existing.data?.[0]?._id) {
    await meta().doc(existing.data[0]._id).update({
      value: val,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await meta().add({
      key: "counters",
      value: val,
      updatedAt: new Date().toISOString(),
    });
  }
}

// ─── Records CRUD ──────────────────────────────────────

export async function saveRecord(record: PatternRecord): Promise<void> {
  await authed(async () => {
    const now = new Date().toISOString();
    const existing = await records()
      .where({ id: record.id })
      .get();

    // 截图上云存：有 base64 但无 fileID 时自动上传
    const imageFileID = await uploadImageIfNeeded(
      record.id,
      record.imageDataUrl,
      existing.data?.[0]?.imageFileID,
    );

    const payload: Record<string, unknown> = {
      ...record,
      imageFileID: imageFileID ?? existing.data?.[0]?.imageFileID ?? undefined,
      createdAt: existing.data?.[0]?.createdAt ?? record.createdAt ?? now,
      updatedAt: now,
    };

    if (existing.data?.length) {
      await records().doc(existing.data[0]._id).update(payload);
    } else {
      await records().add(payload);
    }
  });
}

/** 对有 fileID 无 dataUrl 的记录，批量回填临时 URL */
async function hydrateImageUrls(
  items: PatternRecord[],
): Promise<PatternRecord[]> {
  const needsFetch = items.filter(
    (r) => !r.imageDataUrl && r.imageFileID,
  );
  if (needsFetch.length === 0) return items;

  await ensureAuth();
  const fileList = needsFetch.map((r) => ({
    fileID: r.imageFileID!,
    maxAge: 3600,
  }));

  try {
    const res = await getApp().getTempFileURL({ fileList });
    const urlMap = new Map<string, string | undefined>();
    (res.fileList ?? []).forEach((f, i) => {
      urlMap.set(fileList[i].fileID, f.tempFileURL ?? f.download_url);
    });

    return items.map((r) => {
      if (!r.imageDataUrl && r.imageFileID) {
        const url = urlMap.get(r.imageFileID);
        if (url) return { ...r, imageDataUrl: url };
      }
      return r;
    });
  } catch {
    // 回填失败不影响主流程
    return items;
  }
}

export async function getRecord(id: string): Promise<PatternRecord | null> {
  return authed(async () => {
    const res = await records().where({ id }).get();
    if (!res.data?.length) return null;
    const { _id, _openid, ...rest } = res.data[0];
    const rec = normalizeRecord(rest);
    const hydrated = await hydrateImageUrls([rec]);
    return hydrated[0] ?? rec;
  });
}

export async function listRecords(): Promise<PatternRecord[]> {
  return authed(async () => {
    // NoSQL 不支持 orderBy，在内存中排序
    const res = await records().limit(999).get();
    const items = (res.data ?? []).map(({ _id, _openid, ...rest }) => normalizeRecord(rest));
    // 新的在上，旧的在下：按 updatedAt 降序（updatedAt 更准确反映实际操作时间）
    const sorted = items.sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
    );
    return hydrateImageUrls(sorted);
  });
}

export async function deleteRecord(id: string): Promise<void> {
  await authed(async () => {
    const res = await records().where({ id }).get();
    if (res.data?.[0]?._id) {
      // 同时删除关联的云存储图片
      const rec = res.data[0];
      if (rec.imageFileID) {
        try {
          await getApp().deleteFile({ fileList: [rec.imageFileID] });
        } catch {
          /* 删除失败不阻断 */
        }
      }
      if (rec.videoFileID) {
        try {
          await getApp().deleteFile({ fileList: [rec.videoFileID] });
        } catch {
          /* 删除失败不阻断 */
        }
      }
      await records().doc(res.data[0]._id).remove();
    }
  });
}

// ─── Insights (meta 集合) ──────────────────────────────

export async function saveLatestInsights(value: string): Promise<void> {
  await authed(async () => {
    const existing = await meta().where({ key: "latestInsights" }).get();
    const payload = {
      key: "latestInsights",
      value,
      updatedAt: new Date().toISOString(),
    };
    if (existing.data?.[0]?._id) {
      await meta().doc(existing.data[0]._id).update(payload);
    } else {
      await meta().add(payload);
    }
  });
}

export async function getLatestInsights(): Promise<string | null> {
  return authed(async () => {
    const res = await meta().where({ key: "latestInsights" }).get();
    return res.data?.[0]?.value ?? null;
  });
}

// ─── 导入/导出辅助 ─────────────────────────────────────

export interface ImportRecordsResult {
  imported: number;
  skipped: number;
  total: number;
}

export async function importRecords(
  incoming: PatternRecord[],
  mode: "merge" | "replace" = "merge",
): Promise<ImportRecordsResult> {
  return authed(async () => {
    let imported = 0;
    let skipped = 0;

    for (const rec of incoming) {
      if (mode === "replace") {
        // replace 模式：直接 upsert
        await saveRecord(rec);
        imported++;
        continue;
      }

      // merge 模式：跳过已存在
      const existing = await records().where({ id: rec.id }).get();
      if (existing.data?.length) {
        skipped++;
      } else {
        await saveRecord(rec);
        imported++;
      }
    }

    return { imported, skipped, total: incoming.length };
  });
}

export async function importInsights(insights: string): Promise<void> {
  await saveLatestInsights(insights);
}
