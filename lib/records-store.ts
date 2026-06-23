"use client";

import { create } from "zustand";
import { markSessionExpired } from "@/lib/auth-store";
import { isNotAuthenticatedError } from "@/lib/cloudbase";
import {
  deleteRecord as deleteRecordFromDb,
  importRecords as importRecordsToDb,
  listRecords,
  saveRecord as saveRecordToDb,
  type ImportRecordsResult,
} from "@/lib/db";
import type { ImportMode } from "@/lib/import";
import type { PatternRecord } from "@/lib/types";

function dbErrorMessage(error: unknown): string {
  if (isNotAuthenticatedError(error)) {
    markSessionExpired();
    return "登录已过期，请重新登录";
  }
  return error instanceof Error ? error.message : "数据库操作失败";
}

type RecordsState = {
  records: PatternRecord[];
  isLoading: boolean;
  error: string;
  loadRecords: () => Promise<void>;
  saveRecord: (record: PatternRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  importRecords: (records: PatternRecord[], mode: ImportMode) => Promise<ImportRecordsResult>;
};

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  isLoading: false,
  error: "",
  async loadRecords() {
    const hasCache = get().records.length > 0;
    if (!hasCache) {
      set({ isLoading: true, error: "" });
    }
    try {
      const records = await listRecords();
      set({ records, isLoading: false });
    } catch (error) {
      set({
        error: dbErrorMessage(error),
        isLoading: false,
      });
    }
  },
  async saveRecord(record) {
    try {
      await saveRecordToDb(record);
    } catch (error) {
      throw new Error(dbErrorMessage(error));
    }
    const current = get().records;
    const exists = current.some((item) => item.id === record.id);
    set({
      records: exists
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current],
    });
    await get().loadRecords();
  },
  async deleteRecord(id) {
    try {
      await deleteRecordFromDb(id);
      set({ records: get().records.filter((record) => record.id !== id) });
    } catch (error) {
      throw new Error(dbErrorMessage(error));
    }
  },
  async importRecords(records, mode) {
    try {
      const result = await importRecordsToDb(records, mode);
      await get().loadRecords();
      return result;
    } catch (error) {
      throw new Error(dbErrorMessage(error));
    }
  },
}));
