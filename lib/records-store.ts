"use client";

import { create } from "zustand";
import {
  deleteRecord as deleteRecordFromDb,
  listRecords,
  saveRecord as saveRecordToDb,
} from "@/lib/db";
import type { PatternRecord } from "@/lib/types";

type RecordsState = {
  records: PatternRecord[];
  isLoading: boolean;
  error: string;
  loadRecords: () => Promise<void>;
  saveRecord: (record: PatternRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
};

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  isLoading: false,
  error: "",
  async loadRecords() {
    set({ isLoading: true, error: "" });
    try {
      const records = await listRecords();
      set({ records, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "数据库读取失败",
        isLoading: false,
      });
    }
  },
  async saveRecord(record) {
    await saveRecordToDb(record);
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
    await deleteRecordFromDb(id);
    set({ records: get().records.filter((record) => record.id !== id) });
  },
}));
