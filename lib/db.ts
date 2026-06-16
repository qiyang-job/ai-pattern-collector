import Dexie, { type Table } from "dexie";
import type { PatternRecord } from "@/lib/types";

export type CounterMeta = {
  key: "counters";
  screenshotSeq: number;
  patternSeq: number;
};

export type InsightMeta = {
  key: "latestInsights";
  value: string;
  updatedAt: string;
};

type MetaRecord = CounterMeta | InsightMeta;

class PatternCollectorDatabase extends Dexie {
  records!: Table<PatternRecord, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super("ai-pattern-collector");
    this.version(1).stores({
      records:
        "id, screenshotId, patternId, product, productCategory, journeyStage, screenshotState, patternCategory, reuseLevel, createdAt, updatedAt",
      meta: "key",
    });
  }
}

export const db = new PatternCollectorDatabase();

const formatId = (prefix: "S" | "P", value: number) =>
  `${prefix}-${String(value).padStart(3, "0")}`;

export async function reserveNextRecordIds() {
  return db.transaction("rw", db.meta, async () => {
    const counters = (await db.meta.get("counters")) as CounterMeta | undefined;
    const nextCounters: CounterMeta = {
      key: "counters",
      screenshotSeq: counters?.screenshotSeq ?? 1,
      patternSeq: counters?.patternSeq ?? 1,
    };

    await db.meta.put({
      key: "counters",
      screenshotSeq: nextCounters.screenshotSeq + 1,
      patternSeq: nextCounters.patternSeq + 1,
    });

    return {
      screenshotId: formatId("S", nextCounters.screenshotSeq),
      patternId: formatId("P", nextCounters.patternSeq),
    };
  });
}

export async function listRecords() {
  return db.records.orderBy("createdAt").reverse().toArray();
}

export async function getRecord(id: string) {
  return db.records.get(id);
}

export async function saveRecord(record: PatternRecord) {
  const now = new Date().toISOString();
  const existing = await db.records.get(record.id);

  await db.records.put({
    ...record,
    createdAt: existing?.createdAt ?? record.createdAt ?? now,
    updatedAt: now,
  });
}

export async function deleteRecord(id: string) {
  await db.records.delete(id);
}

export async function saveLatestInsights(value: string) {
  await db.meta.put({
    key: "latestInsights",
    value,
    updatedAt: new Date().toISOString(),
  });
}

export async function getLatestInsights() {
  const latest = (await db.meta.get("latestInsights")) as InsightMeta | undefined;
  return latest?.value ?? "";
}
