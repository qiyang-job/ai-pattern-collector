const DEFAULT_BASE_URL = process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = process.env.AI_MODEL || "qwen-vl-max";
const MAX_PAYLOAD_BYTES = 5_500_000;

const PRODUCT_CATEGORIES = ["AI Chat", "AI Search", "Agent Task", "AI Workspace", "Coding Agent"];
const JOURNEY_STAGES = [
  "J-01 Entry", "J-02 Intent Capture", "J-03 Context Building", "J-04 Planning",
  "J-05 Execution", "J-06 Feedback", "J-07 Verification", "J-08 Refinement", "J-09 Handoff",
];
const SCREENSHOT_STATES = [
  "Default", "Input Assist", "Context Attach", "Plan Preview", "Tool Call", "Human Approval",
  "Partial Result", "Error Recovery", "Final Result", "Follow-up", "Export / Handoff",
];
const PATTERN_CATEGORIES = [
  "Intent Input Patterns", "Context Management Patterns", "Planning & Reasoning Patterns",
  "Execution Feedback Patterns", "Trust & Verification Patterns", "Output Handoff Patterns",
];
const REUSE_LEVELS = ["High", "Medium", "Low"];

const SYSTEM_PROMPT = `你是一个资深 AI 产品体验设计研究员，专门分析 AI-native 产品的交互设计模式。
你的目标不是描述截图，而是基于截图、用户备注、产品名和任务上下文，稳定输出高质量的「AI 产品设计模式分析结果」，服务于设计研究。

# 分析链路（依次完成）
Observe 观察(只基于可见内容/备注，不凭空补全) → Interpret 解释(用户在做什么任务/处于哪个阶段/解决什么问题/是否需确认等待判断接管/过程是否可见/结果是否可验证/能否进入下一步) → Abstract 抽象(抽象成可复用交互模式) → Classify 分类(只从固定枚举选择) → Score 评分(有依据) → Output 严格 JSON。

# Pattern Name 规则
英文短语 2-5 词，描述可复用交互模式；不要用产品名、不要太泛、不要写成页面名称。
正确：Editable Plan Preview / Human Approval Gate / Source-grounded Answer / Tool Call Timeline / Context Attachment Chip / File Change Diff Preview / Progressive Result Streaming / Recovery-oriented Error State。
错误：Cursor Planning / AI Result / Chat Interface / Search Page / User Input / Analysis Feature。

# 固定分类体系（必须从中选择，不允许新增）
Product Category: AI Chat | AI Search | Agent Task | AI Workspace | Coding Agent
Journey Stage: J-01 Entry | J-02 Intent Capture | J-03 Context Building | J-04 Planning | J-05 Execution | J-06 Feedback | J-07 Verification | J-08 Refinement | J-09 Handoff
Screenshot State: Default | Input Assist | Context Attach | Plan Preview | Tool Call | Human Approval | Partial Result | Error Recovery | Final Result | Follow-up | Export / Handoff
Pattern Category: Intent Input Patterns | Context Management Patterns | Planning & Reasoning Patterns | Execution Feedback Patterns | Trust & Verification Patterns | Output Handoff Patterns
Reuse Level: High | Medium | Low

# Journey Stage 判断
J-01 入口/首页/空白工作区/新建；J-02 帮助表达意图(输入框/Prompt 建议/模板/任务类型/上传/参数)；J-03 收集展示管理上下文(文件附件/知识库/链接/历史/Repo/Context chip/Memory/Selected files)；J-04 执行前展示计划/步骤/待办/修改范围/任务拆解；J-05 正在执行/调用工具/运行命令/改文件/浏览网页/生成内容/Terminal；J-06 过程状态/进度/等待/加载/部分完成/风险/失败；J-07 验证结果可信(引用/证据/Diff/Preview/测试/References/Explain why)；J-08 追问/修改/分支/重试/调参/编辑结果；J-09 导出/分享/保存/复制/进入代码或文档或工作流/Commit。

# Product Category 判断
AI Chat 对话式多轮通用；AI Search 查询+结果+来源引用+网页摘要；Agent Task 多步骤任务+调用浏览器工具外部系统+计划执行等待审批；AI Workspace AI 嵌入文档/白板/表格/设计/内容生产；Coding Agent 代码生成/读文件/Repo 上下文/Diff/Terminal/Commit/Test/IDE 集成。

# Pattern Category 判断
Intent Input 帮表达意图；Context Management 获取展示编辑追溯上下文；Planning & Reasoning 让任务拆解计划推理可见；Execution Feedback 展示执行过程/工具调用/进度/部分结果；Trust & Verification 帮判断可信/正确/可追溯；Output Handoff 帮结果进入下一步工作流。

# 字段质量要求
userProblem 指出具体不确定性/风险/认知负担/操作成本，写成清晰判断，禁止"帮助用户更好使用 AI"。aiCapability 说明界面暴露 AI 的什么能力，禁止"AI 可以帮助用户完成任务"。uiAnatomy 拆解界面关键组成部分，不要笼统描述。interactionRule 说明用户如何触发/确认/修改/暂停/重试/接管，不要只写"点击按钮"。systemFeedback 说明系统如何反馈状态/进度/风险/结果。trustMechanism 说明如何建立信任，禁止"让用户更信任 AI"。failureHandling 截图无失败处理证据时必须写"截图中未体现明显失败恢复机制"，不要编造。designJudgment 必须含 适用场景+复用价值+复用风险，不要只总结。

# Lens Score（有依据，不要平均给分）
0 Not visible / 1 Weak / 2 Usable / 3 Excellent。维度：intentClarity、contextVisibility、processTransparency、userControl、trustBuilding、errorRecoverability(截图无错误内容通常给 0 或 1)、outputUsability、reusability。

# 不确定性
不允许凭空猜测；无证据时用"截图中未体现/无法从截图判断/根据备注可推测但证据有限"，但 JSON 字段仍必须完整输出。

# 语言与格式
分析内容用中文；patternName 用英文；productCategory/journeyStage/screenshotState/patternCategory/reuseLevel 用固定英文枚举；tags 可英文短标签。不要输出 Markdown 或 JSON 之外的任何文字。

# 输出 JSON Schema（严格输出，不要代码块包裹）
{"product":"string","productCategory":"...","journeyStage":"...","screenshotState":"...","patternName":"string","patternCategory":"...","userProblem":"string","aiCapability":"string","uiAnatomy":"string","interactionRule":"string","systemFeedback":"string","trustMechanism":"string","failureHandling":"string","reuseLevel":"High|Medium|Low","designJudgment":"string","lensScore":{"intentClarity":0,"contextVisibility":0,"processTransparency":0,"userControl":0,"trustBuilding":0,"errorRecoverability":0,"outputUsability":0,"reusability":0},"tags":["string"]}`;

function buildUserText({ product, rawNote, taskContext, sourceUrl }) {
  return [
    "请分析下面这张 AI 产品截图，并输出结构化 Pattern Record。",
    "输入信息：",
    `【Product】\n${product || "用户未填写"}`,
    `【Raw Note / Research Note】\n${rawNote}`,
    `【Task Context】\n${taskContext || "用户未填写"}`,
    `【Source URL】\n${sourceUrl || "用户未填写"}`,
    "【Image】\n已附加截图。",
    "请根据截图证据和用户备注完成分析。",
    "重点要求：",
    "1. 不要只描述截图，要抽象成可复用设计模式。",
    "2. Pattern Name 必须是英文短语，描述交互模式，而不是页面名称。",
    "3. 分类必须从固定枚举中选择。",
    "4. 如果截图证据不足，请明确说明，不要编造。",
    "5. Lens Score 必须基于截图证据和备注判断。",
    "6. 输出严格 JSON，不要 Markdown，不要解释性文字。",
  ].join("\n");
}

// 清理 Markdown 代码块包裹的 JSON 并解析
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

// 枚举映射，无法映射返回 fallback
function mapEnum(value, options, fallback) {
  if (typeof value !== "string") return fallback;
  const raw = value.trim();
  if (!raw) return fallback;
  const exact = options.find((o) => o.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const codeMatch = raw.match(/J[-\s]?0?(\d)/i);
  if (codeMatch) {
    const byCode = options.find((o) => o.startsWith(`J-0${codeMatch[1]}`));
    if (byCode) return byCode;
  }
  const partial = options.find(
    (o) => raw.toLowerCase().includes(o.toLowerCase()) || o.toLowerCase().includes(raw.toLowerCase()),
  );
  return partial || fallback;
}

function clampScore(v) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n);
  return r < 0 ? 0 : r > 3 ? 3 : r;
}

const str = (v) => (typeof v === "string" ? v : "");

function normalizeResult(parsed) {
  const ls = parsed.lensScore && typeof parsed.lensScore === "object" ? parsed.lensScore : {};
  return {
    product: str(parsed.product),
    productCategory: mapEnum(parsed.productCategory, PRODUCT_CATEGORIES, "AI Chat"),
    journeyStage: mapEnum(parsed.journeyStage, JOURNEY_STAGES, "J-01 Entry"),
    screenshotState: mapEnum(parsed.screenshotState, SCREENSHOT_STATES, "Default"),
    patternName: str(parsed.patternName),
    patternCategory: mapEnum(parsed.patternCategory, PATTERN_CATEGORIES, "Intent Input Patterns"),
    userProblem: str(parsed.userProblem),
    aiCapability: str(parsed.aiCapability),
    uiAnatomy: str(parsed.uiAnatomy),
    interactionRule: str(parsed.interactionRule),
    systemFeedback: str(parsed.systemFeedback),
    trustMechanism: str(parsed.trustMechanism),
    failureHandling: str(parsed.failureHandling),
    reuseLevel: mapEnum(parsed.reuseLevel, REUSE_LEVELS, "Medium"),
    designJudgment: str(parsed.designJudgment),
    lensScore: {
      intentClarity: clampScore(ls.intentClarity),
      contextVisibility: clampScore(ls.contextVisibility),
      processTransparency: clampScore(ls.processTransparency),
      userControl: clampScore(ls.userControl),
      trustBuilding: clampScore(ls.trustBuilding),
      errorRecoverability: clampScore(ls.errorRecoverability),
      outputUsability: clampScore(ls.outputUsability),
      reusability: clampScore(ls.reusability),
    },
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === "string") : [],
  };
}

exports.main = async (event) => {
  try {
    const { imageDataUrl, rawNote, product, sourceUrl, taskContext } = event;

    if (!imageDataUrl) return { error: "请先上传或粘贴截图" };
    if (!rawNote) return { error: "Raw Note 是必填项" };

    const payloadSize = JSON.stringify(event).length;
    if (payloadSize > MAX_PAYLOAD_BYTES) {
      return { error: `截图太大(${(payloadSize / 1024 / 1024).toFixed(1)}MB)，请裁剪后重试`, code: 413 };
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return { error: "AI API 未配置", code: 503 };

    console.log(`[ai-analyze] payload: ${(payloadSize / 1024).toFixed(0)}KB`);

    const res = await fetch(`${DEFAULT_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: buildUserText({ product, rawNote, taskContext, sourceUrl }) },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = payload.error?.message || `AI API error: ${res.status}`;
      console.error(`[ai-analyze] AI API error:`, res.status, errMsg);
      return { error: errMsg, code: 502 };
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { error: "AI 返回内容为空", code: 502 };

    const parsed = parseJsonLoose(content);
    if (!parsed || typeof parsed !== "object") {
      console.error(`[ai-analyze] 无法解析 JSON:`, String(content).slice(0, 300));
      return { error: "AI 返回不是有效 JSON，请重新分析", code: 422 };
    }

    const result = normalizeResult(parsed);
    console.log(`[ai-analyze] success:`, { patternName: result.patternName, journeyStage: result.journeyStage, patternCategory: result.patternCategory });
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ai-analyze] exception:`, msg);
    return { error: msg, code: 500 };
  }
};
