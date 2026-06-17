const DEFAULT_BASE_URL = process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = process.env.AI_MODEL || "qwen-vl-max";

const SYSTEM_PROMPT = `你是一个资深 AI 产品体验设计研究员和设计模式库负责人。
你的任务是基于一组已经结构化的 Pattern Records，生成研究洞察。
你不是在做普通总结，也不是在复述记录列表。你要从多个截图证据和模式记录中，归纳 AI 产品体验设计规律，识别高价值设计模式，比较不同产品类型和用户阶段的成熟度，并给出可迁移的设计建议。你必须基于输入记录进行分析，不要凭空引入外部案例。

# 分析目标
1. Research Scope：当前样本覆盖了哪些产品、产品类型、用户流程阶段、界面状态和模式分类。
2. Product Coverage：比较 5 类 Product Category(AI Chat/AI Search/AI Agent/AI Workspace/Coding Agent)的样本数量与覆盖质量，指出哪些类型样本不足。
3. Journey Coverage：分析 J-01 到 J-09 哪些阶段样本丰富，哪些缺失。
4. Screenshot State Distribution：分析 14 类界面状态(Idle…Export Ready/Unknown)的覆盖与密度，指出过度集中或缺失的状态；结合 secondaryScreenshotStates 看共现关系。
5. Pattern Category Distribution：分析 8 类 Pattern Category(含新增 Refinement Patterns 优化迭代、Failure Recovery Patterns 失败恢复)的覆盖，指出薄弱分类。
6. High-value Patterns：识别高复用价值 Pattern，说明为什么值得复用。
7. Cross-product Comparison：比较不同产品类型在 AI 体验设计上的差异。
8. Stage Maturity：判断不同用户阶段的设计成熟度，尤其关注 J-03 到 J-07。
9. Missing States：指出尚未采集到的界面状态/分类盲区，给出补采方向。
10. Design Opportunities：指出当前样本暴露出的设计机会点。
11. Recommendations：给出对 AI 产品设计的可迁移建议。

# 输出质量要求
- 不要泛泛总结（禁止"这些模式有助于提升用户体验"这类空话），要基于样本给出具体判断。
- 必须指出样本盲区：哪些 Product Category / Journey Stage / Screenshot State / Pattern Category 覆盖不足，以及当前洞察的置信度限制。
- 每个洞察尽量包含：观察 → 解释 → 设计意义 → 建议。

# 语言与格式
统一使用中文输出（枚举字段可保留英文）。严格输出 JSON，不要输出 Markdown，不要输出解释性文字。

# 输出 JSON Schema
{"researchScope":"string","productCoverage":"string","journeyCoverage":"string","screenshotStateDistribution":"string","patternCategoryDistribution":"string","highValuePatterns":"string","crossProductComparison":"string","stageMaturity":"string","missingStates":"string","designOpportunities":"string","recommendations":"string"}`;

function buildUserText(records) {
  return [
    "请基于以下 Pattern Records 生成 AI 产品设计模式研究洞察。",
    "注意：",
    "1. 只能基于输入 records 分析，不要引入外部案例。",
    "2. 不要复述每条记录，要做跨记录归纳。",
    "3. 必须指出样本覆盖不足和研究盲区。",
    "4. 必须给出可迁移的设计建议。",
    "5. 输出严格 JSON，不要 Markdown，不要解释性文字。",
    "Pattern Records 摘要：",
    JSON.stringify(records, null, 2),
  ].join("\n");
}

function parseJsonLoose(content) {
  if (!content) return null;
  let text = String(content).trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  try { return JSON.parse(text); } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { return null; } }
    return null;
  }
}

const str = (v) => (typeof v === "string" ? v : "");

function normalizeInsights(parsed) {
  return {
    researchScope: str(parsed.researchScope),
    productCoverage: str(parsed.productCoverage),
    journeyCoverage: str(parsed.journeyCoverage),
    screenshotStateDistribution: str(parsed.screenshotStateDistribution),
    patternCategoryDistribution: str(parsed.patternCategoryDistribution),
    highValuePatterns: str(parsed.highValuePatterns),
    crossProductComparison: str(parsed.crossProductComparison),
    stageMaturity: str(parsed.stageMaturity),
    missingStates: str(parsed.missingStates),
    designOpportunities: str(parsed.designOpportunities),
    recommendations: str(parsed.recommendations),
  };
}

exports.main = async (event) => {
  try {
    const { records } = event;
    if (!records || !Array.isArray(records)) return { error: "records 数组必填" };
    if (records.length === 0) return { error: "暂无可分析的 Pattern Records", code: 422 };

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return { error: "AI API 未配置", code: 503 };

    const res = await fetch(`${DEFAULT_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserText(records) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return { error: payload.error?.message || `AI API error: ${res.status}`, code: 502 };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { error: "AI 返回内容为空", code: 502 };

    const parsed = parseJsonLoose(content);
    if (!parsed || typeof parsed !== "object") {
      console.error(`[ai-insights] 无法解析 JSON:`, String(content).slice(0, 300));
      return { error: "AI 返回不是有效 JSON，请重新生成", code: 422 };
    }

    const result = normalizeInsights(parsed);
    // 序列化为字符串返回，防止 CloudBase SDK 传输层丢弃空值属性
    const serialized = JSON.stringify(result);
    console.log(`[ai-insights] success: keys=${Object.keys(result).length} size=${(serialized.length / 1024).toFixed(1)}KB`);
    return { _serialized: serialized };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "洞察生成失败", code: 500 };
  }
};
