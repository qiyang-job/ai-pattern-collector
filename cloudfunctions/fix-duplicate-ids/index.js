const cloudbase = require("@cloudbase/node-sdk");

// ── 环境 ─────────────────────────────────────────────
const ENV_ID = "patterncollector-d6e3o08821ba3ee";

/**
 * 一次性修复脚本：检测并修复 records 集合中重复的 screenshotId / patternId
 *
 * 用法: 调用云函数，传入 { action: "fix" } 或不传参数（默认 dry-run）
 *   - 不传 / action=undefined → 仅扫描，返回重复情况（dry-run）
 *   - action="fix"              → 实际执行修复，重编号并更新计数器
 */
exports.main = async (event) => {
  const isDryRun = !event || event.action !== "fix";

  try {
    const app = cloudbase.init({ env: ENV_ID });
    const db = app.database();

    // 1) 获取全部记录
    const recRes = await db.collection("records").limit(999).get();
    const allRecords = recRes.data || [];

    if (allRecords.length === 0) {
      return { ok: true, message: "没有找到任何记录", total: 0 };
    }

    // 2) 按 screenshotId 分组，找出重复项
    const byScreenshotId = {};
    for (const r of allRecords) {
      const sid = String(r.screenshotId || "").trim() || "(empty)";
      if (!byScreenshotId[sid]) byScreenshotId[sid] = [];
      byScreenshotId[sid].push(r);
    }

    // 按 patternId 分组
    const byPatternId = {};
    for (const r of allRecords) {
      const pid = String(r.patternId || "").trim() || "(empty)";
      if (!byPatternId[pid]) byPatternId[pid] = [];
      byPatternId[pid].push(r);
    }

    const dupScreenshotIds = Object.entries(byScreenshotId)
      .filter(([, list]) => list.length > 1)
      .map(([id, list]) => ({
        id,
        count: list.length,
        recordIds: list.map((r) => ({ _id: r._id, createdAt: r.createdAt })),
      }));

    const dupPatternIds = Object.entries(byPatternId)
      .filter(([, list]) => list.length > 1)
      .map(([id, list]) => ({
        id,
        count: list.length,
        recordIds: list.map((r) => ({ _id: r._id, createdAt: r.createdAt })),
      }));

    // 如果没有重复，直接返回
    if (dupScreenshotIds.length === 0 && dupPatternIds.length === 0) {
      return {
        ok: true,
        message: "未发现重复编号",
        total: allRecords.length,
        uniqueScreenshotIds: Object.keys(byScreenshotId).length,
        uniquePatternIds: Object.keys(byPatternId).length,
      };
    }

    // Dry-run: 仅返回报告
    if (isDryRun) {
      return {
        ok: true,
        mode: "dry-run",
        message: `发现 ${dupScreenshotIds.length} 组重复 screenshotId, ${dupPatternIds.length} 组重复 patternId。传入 { action: "fix" } 以实际修复。`,
        total: allRecords.length,
        duplicateScreenshotIds: dupScreenshotIds,
        duplicatePatternIds: dupPatternIds,
      };
    }

    // ── 实际修复模式 ──────────────────────────────────

    // 3) 获取当前计数器最大值
    const counterRes = await db.collection("meta")
      .where({ key: "counters" })
      .get();
    let counter = counterRes.data?.[0]?.value || { screenshotSeq: 0, patternSeq: 0 };
    let newScreenshotSeq = counter.screenshotSeq;
    let newPatternSeq = counter.patternSeq;

    // 从现有记录中找实际使用的最大编号（防止计数器落后于实际数据）
    for (const r of allRecords) {
      const smatch = String(r.screenshotId || "").match(/S-(\d+)/i);
      const pmatch = String(r.patternId || "").match(/P-(\d+)/i);
      if (smatch) newScreenshotSeq = Math.max(newScreenshotSeq, Number(smatch[1]));
      if (pmatch) newPatternSeq = Math.max(newPatternSeq, Number(pmatch[1]));
    }

    // 4) 收集需要修复的记录（保留每组第一条，其余重新编号）
    const fixes = []; // { _id, newScreenshotId, newPatternId }
    const now = new Date().toISOString();

    // 处理 screenshotId 重复
    for (const group of dupScreenshotIds) {
      // 保留第一条（createdAt 最旧的），其余重编
      const sorted = [...group.recordIds].sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
      for (let i = 1; i < sorted.length; i++) {
        newScreenshotSeq++;
        newPatternSeq++;
        fixes.push({
          _id: sorted[i]._id,
          newScreenshotId: `S-${String(newScreenshotSeq).padStart(3, "0")}`,
          newPatternId: `P-${String(newPatternSeq).padStart(3, "0")}`,
        });
      }
    }

    // 处理 patternId 重复（排除已在上面一起修复的）
    for (const group of dupPatternIds) {
      const alreadyFixed = new Set(fixes.map((f) => f._id));
      const sorted = [...group.recordIds].sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
      for (let i = 1; i < sorted.length; i++) {
        if (alreadyFixed.has(sorted[i]._id)) continue; // 已在 screenshotId 修复时处理
        newPatternSeq++;
        fixes.push({
          _id: sorted[i]._id,
          newScreenshotId: null, // 仅修 patternId
          newPatternId: `P-${String(newPatternSeq).padStart(3, "0")}`,
        });
      }
    }

    if (fixes.length === 0) {
      return { ok: true, message: "无需修复", total: allRecords.length };
    }

    // 5) 批量更新记录
    for (const fix of fixes) {
      const updateData = {
        updatedAt: now,
      };
      if (fix.newScreenshotId) updateData.screenshotId = fix.newScreenshotId;
      if (fix.newPatternId) updateData.patternId = fix.newPatternId;

      await db.collection("records").doc(fix._id).update(updateData);
    }

    // 6) 更新计数器到最新值
    const counterDoc = counterRes.data?.[0];
    const newCounter = {
      screenshotSeq: newScreenshotSeq,
      patternSeq: newPatternSeq,
      lastReservedAt: now,
    };

    if (counterDoc?._id) {
      await db.collection("meta").doc(counterDoc._id).update({
        value: newCounter,
        updatedAt: now,
      });
    } else {
      await db.collection("meta").add({
        key: "counters",
        value: newCounter,
        updatedAt: now,
      });
    }

    return {
      ok: true,
      mode: "fixed",
      message: `成功修复 ${fixes.length} 条重复记录`,
      total: allRecords.length,
      fixedRecords: fixes,
      newCounter,
    };
  } catch (e) {
    return {
      ok: false,
      error: e && e.message ? e.message : String(e),
    };
  }
};
