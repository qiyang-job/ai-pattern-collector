const cloudbase = require("@cloudbase/node-sdk");

const ENV_ID = "patterncollector-d6e3o08821ba3ee";
const COLLECTIONS = ["records", "meta"];

/**
 * 数据归属迁移：把历史数据（匿名身份创建）的 _openid 改为指定账号 uid。
 *
 * action="test"  : 试改一条记录的 _openid 并读回，验证 admin 是否可写该字段
 * action="claim" : 把 records + meta 全部文档的 _openid 改为 targetOpenId（幂等）
 */
exports.main = async (event) => {
  const app = cloudbase.init({ env: ENV_ID });
  const db = app.database();
  const action = event && event.action;

  if (action === "test") {
    const target = String((event && event.target) || "__TEST_OPENID__");
    const res = await db.collection("records").limit(1).get();
    if (!res.data || !res.data.length) return { ok: false, error: "无记录可测试" };
    const doc = res.data[0];
    const before = doc._openid;
    await db.collection("records").doc(doc._id).update({ _openid: target });
    const re = await db.collection("records").doc(doc._id).get();
    const after = re.data && re.data[0] ? re.data[0]._openid : undefined;
    return { ok: true, id: doc._id, before, requested: target, after, writable: after === target };
  }

  if (action === "claim") {
    const target = String((event && event.targetOpenId) || "").trim();
    if (!target) return { ok: false, error: "缺少 targetOpenId" };
    const summary = {};
    for (const coll of COLLECTIONS) {
      const res = await db.collection(coll).limit(999).get();
      const docs = res.data || [];
      let updated = 0;
      for (const d of docs) {
        if (d._openid === target) continue;
        await db.collection(coll).doc(d._id).update({ _openid: target });
        updated++;
      }
      summary[coll] = { total: docs.length, updated };
    }
    return { ok: true, target, ...summary };
  }

  return { ok: false, error: "未知 action（支持 test / claim）" };
};
