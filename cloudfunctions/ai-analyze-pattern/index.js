const DEFAULT_BASE_URL = process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = process.env.AI_MODEL || "qwen3.7-plus";
const MAX_PAYLOAD_BYTES = 5_500_000;

const PRODUCT_CATEGORIES = ["AI Chat", "AI Search", "AI Agent", "AI Workspace", "Coding Agent"];
const JOURNEY_STAGES = [
  "J-01 Entry", "J-02 Intent Capture", "J-03 Context Building", "J-04 Planning",
  "J-05 Execution", "J-06 Feedback", "J-07 Verification", "J-08 Refinement", "J-09 Handoff",
];
const SCREENSHOT_STATES = [
  "Idle", "Inputting", "Context Ready", "Thinking", "Planning Ready", "Running",
  "Waiting Approval", "Streaming", "Reviewing", "Error", "Completed",
  "Follow-up Ready", "Export Ready", "Unknown",
];
const PATTERN_CATEGORIES = [
  "Intent Input Patterns", "Context Management Patterns", "Planning & Reasoning Patterns",
  "Execution Feedback Patterns", "Trust & Verification Patterns", "Refinement Patterns",
  "Output Handoff Patterns", "Failure Recovery Patterns",
];
const REUSE_LEVELS = ["High", "Medium", "Low"];

// 旧值迁移表（历史数据 / AI 偶发旧值 → 新枚举），与前端 lib/constants.ts 保持一致
const PRODUCT_CATEGORY_MIGRATION = { "Agent Task": "AI Agent", "AI Task": "AI Agent", "Agent": "AI Agent" };
const SCREENSHOT_STATE_MIGRATION = {
  "Default": "Idle", "Input Assist": "Inputting", "Context Attach": "Context Ready",
  "Plan Preview": "Planning Ready", "Tool Call": "Running", "Human Approval": "Waiting Approval",
  "Partial Result": "Streaming", "Error Recovery": "Error", "Final Result": "Completed",
  "Follow-up": "Follow-up Ready", "Export / Handoff": "Export Ready", "Export/Handoff": "Export Ready",
};
const PATTERN_CATEGORY_MIGRATION = {
  "Intent Patterns": "Intent Input Patterns", "Context Patterns": "Context Management Patterns",
  "Planning Patterns": "Planning & Reasoning Patterns", "Reasoning Patterns": "Planning & Reasoning Patterns",
  "Execution Patterns": "Execution Feedback Patterns", "Feedback Patterns": "Execution Feedback Patterns",
  "Trust Patterns": "Trust & Verification Patterns", "Verification Patterns": "Trust & Verification Patterns",
  "Refine Patterns": "Refinement Patterns", "Iteration Patterns": "Refinement Patterns",
  "Output Patterns": "Output Handoff Patterns", "Handoff Patterns": "Output Handoff Patterns",
  "Recovery Patterns": "Failure Recovery Patterns", "Error Recovery Patterns": "Failure Recovery Patterns",
};

const SYSTEM_PROMPT = `你是一个资深 AI 产品体验设计研究员，专门分析 AI-native 产品的交互设计模式。
你的目标不是描述截图，而是基于截图、用户备注、产品名和任务上下文，稳定输出高质量的「AI 产品设计模式分析结果」，服务于设计研究。

# 分析链路（依次完成）
Observe 观察(只基于可见内容/备注，不凭空补全) → Interpret 解释(用户在做什么任务/处于哪个阶段/解决什么问题/是否需确认等待判断接管/过程是否可见/结果是否可验证/能否进入下一步) → Abstract 抽象(抽象成可复用交互模式) → Classify 分类(只从固定枚举选择) → Score 评分(有依据) → Output 严格 JSON。

# Pattern Name 规则
中文短语 3-8 个字，描述可复用交互模式；不要用产品名、不要太泛、不要写成页面名称。
正确：可编辑计划预览 / 人工审批门 / 来源引用式回答 / 工具调用时间线 / 上下文附加标签 / 文件变更差异预览 / 渐进式结果流 / 可恢复错误状态。
错误：Cursor 规划 / AI 结果 / 聊天界面 / 搜索页面 / 用户输入 / 分析功能。

# 五个核心分类字段职责（务必区分，不要混淆维度）
Product Category = 产品形态（这是什么形态的 AI 产品，与单张截图无关）
Journey Stage = 用户路径（任务流程中的哪个步骤，宏观纵向）
Screenshot State = 界面状态（截图那一刻 UI 处于什么操作态，微观瞬时）
Pattern Category = 模式库分类（提炼出的模式解决哪一类设计问题）
Reuse Level = 复用价值（该模式是否值得复用到其他 AI 产品）

# 固定分类体系（必须从中选择，不允许新增）
Product Category: AI Chat | AI Search | AI Agent | AI Workspace | Coding Agent
Journey Stage: J-01 Entry | J-02 Intent Capture | J-03 Context Building | J-04 Planning | J-05 Execution | J-06 Feedback | J-07 Verification | J-08 Refinement | J-09 Handoff
Screenshot State: Idle | Inputting | Context Ready | Thinking | Planning Ready | Running | Waiting Approval | Streaming | Reviewing | Error | Completed | Follow-up Ready | Export Ready | Unknown
Pattern Category: Intent Input Patterns | Context Management Patterns | Planning & Reasoning Patterns | Execution Feedback Patterns | Trust & Verification Patterns | Refinement Patterns | Output Handoff Patterns | Failure Recovery Patterns
Reuse Level: High | Medium | Low

# Journey Stage 判断
J-01 入口/首页/空白工作区/新建；J-02 帮助表达意图(输入框/Prompt 建议/模板/任务类型/上传/参数)；J-03 收集展示管理上下文(文件附件/知识库/链接/历史/Repo/Context chip/Memory/Selected files)；J-04 执行前展示计划/步骤/待办/修改范围/任务拆解；J-05 正在执行/调用工具/运行命令/改文件/浏览网页/生成内容/Terminal；J-06 过程状态/进度/等待/加载/部分完成/风险/失败；J-07 验证结果可信(引用/证据/Diff/Preview/测试/References/Explain why)；J-08 追问/修改/分支/重试/调参/编辑结果；J-09 导出/分享/保存/复制/进入代码或文档或工作流/Commit。

# Product Category 判断
AI Chat 对话式多轮通用；AI Search 查询+结果+来源引用+网页摘要；AI Agent 多步骤任务+调用浏览器工具外部系统+计划执行等待审批(原 Agent Task)；AI Workspace AI 嵌入文档/白板/表格/设计/内容生产；Coding Agent 代码生成/读文件/Repo 上下文/Diff/Terminal/Commit/Test/IDE 集成。

# Pattern Category 判断（共 8 类，按顺序）
Intent Input 帮表达意图；Context Management 获取展示编辑追溯上下文；Planning & Reasoning 让任务拆解计划推理可见；Execution Feedback 展示执行过程/工具调用/进度/部分结果；Trust & Verification 帮判断可信/正确/可追溯；Refinement 基于结果继续追问/修改/重试/细化迭代(Regenerate/Edit/Branch/Refine/Variant/Version)；Output Handoff 帮结果进入下一步工作流(Export/Copy/Apply/Commit/Publish)；Failure Recovery 出错/超时/能力边界时如何解释/兜底/恢复(Error explain/Retry/Fallback/Undo/Degrade/Limit notice)。

# Screenshot State 判断（关键：根据截图中的 UI 动态操作状态精确选择，不是路径阶段！）
Screenshot State 描述的是「截图那一刻界面的操作状态」，不是用户处于哪个路径阶段。
⚠️ Journey Stage 问"用户在流程哪一步"，Screenshot State 问"界面此刻是什么操作态"。两者维度不同！

Idle 空闲/空白初始态/首页未开始/光标在输入框但无内容/等待用户操作；
Inputting 正在输入/输入框有内容/光标活跃/Prompt 编辑器中有文字/用户正在打字或编辑的状态；
Context Ready 上下文已准备就绪/文件已上传/链接已粘贴/附件已添加/Context chip 已展示/资源列表可见且完整；
Thinking AI 思考处理中/加载动画/thinking 指示器/后台推理/无输出但有活动指示；
Planning Ready 计划已生成并展示/步骤列表已呈现/待办可见/TASK breakdown 面板/用户可查看和编辑执行计划；
Running 执行中/工具正在调用/命令运行/Terminal 有输出流/进度条前进/步骤执行动画/API 调用进行中；
Waiting Approval 等待用户确认/审批按钮高亮/同意/拒绝选项可见/安全警告弹窗/权限请求/执行暂停等人工门控；
Streaming 流式输出进行中/文字逐渐出现/token by token 渐进式内容/还在继续生成但已有部分可见结果；
Reviewing 用户正在审阅验证/Diff 展示/引用证据/测试结果/对比视图/用户检查正确性的状态；
Error 错误阻断/红色警告/报错信息/失败提示/重试按钮/异常处理UI/流程被错误中断无法继续；
Completed 任务已完成/最终完整结果/总结面板/结束态的完整展示/所有操作已结束；
Follow-up Ready 可继续追问/基于结果的后续交互引导/相关建议/追问输入框/重试/调参/分支选项可见；
Export Ready 可导出/分享/复制/下载/Commit 按钮/进入下一步工作流的入口/结果交接界面已准备好；
Unknown 无法从截图判断界面处于什么操作态/截图证据不足/截图中未体现明确操作状态(仅作兜底，应尽量避免)。

# 多界面状态规则（重要）
一张截图可能同时呈现多个界面状态。请按以下规则输出：
- screenshotState：选出「最主要/最能代表该截图当前焦点」的单个状态（如界面正在流式输出答案，主状态就是 Streaming）。
- secondaryScreenshotStates：列出同一截图中同时存在但非主导的其他状态数组（可为空 []）。例如 Streaming 同时下方有可导出按钮 → ["Export Ready"]；正在 Running 同时有审批弹窗 → ["Waiting Approval"]。不要把主状态重复放进数组，不要放 Unknown。
- screenshotStateReason：用一句中文说明你判定主状态（及次要状态）的依据，引用截图中的可见证据（如"答案区文字正在逐字出现且有 Stop 按钮，故主状态为 Streaming；底部出现复制/导出入口，故次要状态含 Export Ready"）。不允许留空。

# 字段质量要求
userProblem 指出具体不确定性/风险/认知负担/操作成本，写成清晰判断，禁止"帮助用户更好使用 AI"。aiCapability 说明界面暴露 AI 的什么能力，禁止"AI 可以帮助用户完成任务"。uiAnatomy 拆解界面关键组成部分，不要笼统描述。interactionRule 说明用户如何触发/确认/修改/暂停/重试/接管，不要只写"点击按钮"。systemFeedback 说明系统如何反馈状态/进度/风险/结果。trustMechanism 说明如何建立信任，禁止"让用户更信任 AI"。failureHandling 截图无失败处理证据时必须写"截图中未体现明显失败恢复机制"，不要编造。designJudgment 必须含 适用场景+复用价值+复用风险，不要只总结。

# Lens Score（有依据，不要平均给分）
0 Not visible / 1 Weak / 2 Usable / 3 Excellent。维度：intentClarity、contextVisibility、processTransparency、userControl、trustBuilding、errorRecoverability(截图无错误内容通常给 0 或 1)、outputUsability、reusability。

# 不确定性
不允许凭空猜测；无证据时用"截图中未体现/无法从截图判断/根据备注可推测但证据有限"，但 JSON 字段仍必须完整输出。

# 语言与格式
分析内容用中文；productCategory/journeyStage/screenshotState/patternCategory/reuseLevel 用固定英文枚举；tags 可英文短标签。不要输出 Markdown 或 JSON 之外的任何文字。
⚠️ 关键：每个字符串字段必须填写有实际意义的内容，绝对不允许空字符串！如果某个字段确实无法从截图判断，也要写"截图中未体现"而不是留空。

# 输出 JSON Schema（严格输出，不要代码块包裹）
{"product":"string","productCategory":"...","journeyStage":"...","screenshotState":"...","secondaryScreenshotStates":["...次要界面状态，可为空数组..."],"screenshotStateReason":"判定界面状态的中文依据","patternName":"string","patternCategory":"...","userProblem":"string","aiCapability":"string","uiAnatomy":"string","interactionRule":"string","systemFeedback":"string","trustMechanism":"string","failureHandling":"string","reuseLevel":"High|Medium|Low","designJudgment":"string","lensScore":{"intentClarity":0,"contextVisibility":0,"processTransparency":0,"userControl":0,"trustBuilding":0,"errorRecoverability":0,"outputUsability":0,"reusability":0},"tags":["string"]}`;

function buildUserText({ product, rawNote, taskContext, sourceUrl, imageCount = 0, hasVideo = false }) {
  const mediaParts = [];
  if (hasVideo) mediaParts.push("一段录屏视频（请关注界面状态随时间的演变）");
  if (imageCount > 0) {
    mediaParts.push(
      imageCount > 1
        ? `${imageCount} 张截图（同一流程的不同步骤）`
        : "1 张截图",
    );
  }
  const mediaLabel = mediaParts.length
    ? `已附加：${mediaParts.join(" + ")}。请综合分析所有证据后输出一个统一的 Pattern Record。`
    : "未附加视觉证据。";
  return [
    `请分析下面的 AI 产品交互证据，并输出结构化 Pattern Record。`,
    "输入信息：",
    `【Product】\n${product || "用户未填写"}`,
    `【Raw Note / Research Note】\n${rawNote}`,
    `【Task Context】\n${taskContext || "用户未填写"}`,
    `【Source URL】\n${sourceUrl || "用户未填写"}`,
    `【Evidence】\n${mediaLabel}`,
    "请根据证据和用户备注完成分析。",
    "重点要求：",
    "1. 不要只描述画面，要抽象成可复用设计模式。",
    "2. Pattern Name 必须是中文短语，描述交互模式，而不是页面名称。",
    "3. 分类必须从固定枚举中选择。",
    "4. 如果证据不足，请明确说明，不要编造。",
    "5. Lens Score 必须基于证据和备注判断。",
    "6. 输出严格 JSON，不要 Markdown，不要解释性文字。",
    "7. ⚠️ 每个字段都必须填写实际内容，禁止空字符串！无法判断时写「证据中未体现」。",
    "8. screenshotState 选主状态；secondaryScreenshotStates 列同时存在的次要状态(可空)；screenshotStateReason 必须写出判定依据，禁止留空。",
    ...(hasVideo
      ? [
          "9. 录屏分析提示：关注交互时序、状态转换（如 Idle→Thinking→Streaming→Completed）、反馈节奏、用户何时需要确认或接管。",
        ]
      : []),
    ...(imageCount > 1
      ? [
          `${hasVideo ? "10" : "9"}. 多图分析提示：识别截图之间的时序关系和完整交互模式。`,
        ]
      : []),
  ].join("\n");
}

function buildEvidenceContent({ imageDataUrls, videoUrl, contextInfo, videoFps = 2 }) {
  const textContent = buildUserText({
    ...contextInfo,
    imageCount: imageDataUrls.length,
    hasVideo: Boolean(videoUrl),
  });
  const content = [{ type: "text", text: textContent }];
  if (videoUrl) {
    content.push({
      type: "video_url",
      video_url: { url: videoUrl },
      fps: videoFps,
    });
  }
  for (let i = 0; i < Math.min(imageDataUrls.length, 9); i++) {
    content.push({
      type: "image_url",
      image_url: { url: imageDataUrls[i] },
    });
  }
  return content;
}

/**
 * 构建多图片的 message content
 * @param {string[]} imageDataUrls - base64 图片数组
 * @param {object} contextInfo - 上下文信息
 */
function buildMultiImageContent(imageDataUrls, contextInfo) {
  const textContent = buildUserText({ ...contextInfo, imageCount: imageDataUrls.length });
  const content = [
    { type: "text", text: textContent },
  ];
  // 添加每张图片（最多9张）
  for (let i = 0; i < Math.min(imageDataUrls.length, 9); i++) {
    content.push({
      type: "image_url",
      image_url: { url: imageDataUrls[i] },
    });
  }
  return content;
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

// 枚举映射，无法映射返回 fallback；可传入 migration 旧值映射表
function mapEnum(value, options, fallback, migration) {
  if (typeof value !== "string") return fallback;
  const raw = value.trim();
  if (!raw) return fallback;
  const exact = options.find((o) => o.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  if (migration && migration[raw]) return migration[raw];
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

// 归一次要界面状态数组：逐项迁移、去重、剔除主状态与 Unknown
function normalizeSecondaryStates(raw, primary) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set([primary]);
  const out = [];
  for (const item of raw) {
    const v = mapEnum(item, SCREENSHOT_STATES, "Unknown", SCREENSHOT_STATE_MIGRATION);
    if (v === "Unknown" || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
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
  const screenshotState = mapEnum(parsed.screenshotState, SCREENSHOT_STATES, "Unknown", SCREENSHOT_STATE_MIGRATION);
  return {
    product: str(parsed.product),
    productCategory: mapEnum(parsed.productCategory, PRODUCT_CATEGORIES, "AI Chat", PRODUCT_CATEGORY_MIGRATION),
    journeyStage: mapEnum(parsed.journeyStage, JOURNEY_STAGES, "J-01 Entry"),
    screenshotState,
    secondaryScreenshotStates: normalizeSecondaryStates(parsed.secondaryScreenshotStates, screenshotState),
    screenshotStateReason: str(parsed.screenshotStateReason),
    patternName: str(parsed.patternName),
    patternCategory: mapEnum(parsed.patternCategory, PATTERN_CATEGORIES, "Intent Input Patterns", PATTERN_CATEGORY_MIGRATION),
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
    const imageDataUrls = event.imageDataUrls || (event.imageDataUrl ? [event.imageDataUrl] : []);
    const videoUrl = typeof event.videoUrl === "string" ? event.videoUrl.trim() : "";
    const videoFps = typeof event.videoFps === "number" ? event.videoFps : 2;
    const { rawNote, product, sourceUrl, taskContext } = event;

    if (!imageDataUrls.length && !videoUrl) return { error: "请先上传截图或录屏" };
    if (imageDataUrls.length > 9) return { error: "最多支持 9 张截图" };
    if (!rawNote) return { error: "Raw Note 是必填项" };

    const payloadSize = JSON.stringify(event).length;
    if (payloadSize > MAX_PAYLOAD_BYTES) {
      return { error: `证据太大(${(payloadSize / 1024 / 1024).toFixed(1)}MB)，请裁剪后重试` };
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return { error: "AI API 未配置，请运行 npm run deploy:fn 注入密钥" };

    console.log(
      `[ai-analyze] payload: ${(payloadSize / 1024).toFixed(0)}KB, images=${imageDataUrls.length}, video=${Boolean(videoUrl)}`,
    );

    const contextInfo = { product, rawNote, taskContext, sourceUrl };
    const userContent = buildEvidenceContent({
      imageDataUrls,
      videoUrl,
      contextInfo,
      videoFps,
    });

    const res = await fetch(`${DEFAULT_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = payload.error?.message || `AI API error: ${res.status}`;
      console.error(`[ai-analyze] AI API error:`, res.status, errMsg);
      return { error: errMsg };
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { error: "AI 返回内容为空" };

    const parsed = parseJsonLoose(content);
    if (!parsed || typeof parsed !== "object") {
      console.error(`[ai-analyze] 无法解析 JSON:`, String(content).slice(0, 300));
      return { error: "AI 返回不是有效 JSON，请重新分析" };
    }

    const result = normalizeResult(parsed);
    // 序列化为字符串返回，防止 CloudBase SDK 传输层丢弃空值/零值属性
    const serialized = JSON.stringify(result);
    console.log(`[ai-analyze] success: keys=${Object.keys(result).length} size=${(serialized.length / 1024).toFixed(1)}KB patternName=${result.patternName}`);
    return { _serialized: serialized };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ai-analyze] exception:`, msg);
    return { error: msg };
  }
};
