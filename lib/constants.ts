import type {
  ComponentFamily,
  JourneyStage,
  LensScore,
  LensScoreValue,
  PatternAnalysisResult,
  PatternCategory,
  ProductCategory,
  ReuseLevel,
  ScreenshotState,
} from "@/lib/types";

export const PRODUCT_CATEGORIES = [
  "AI Chat",
  "AI Search",
  "AI Agent",
  "AI Workspace",
  "Coding Agent",
] as const satisfies readonly ProductCategory[];

export const JOURNEY_STAGES = [
  "J-01 Entry",
  "J-02 Intent Capture",
  "J-03 Context Building",
  "J-04 Planning",
  "J-05 Execution",
  "J-06 Feedback",
  "J-07 Verification",
  "J-08 Refinement",
  "J-09 Handoff",
] as const satisfies readonly JourneyStage[];

export const CORE_JOURNEY_STAGES = [
  "J-03 Context Building",
  "J-04 Planning",
  "J-05 Execution",
  "J-06 Feedback",
  "J-07 Verification",
] as const satisfies readonly JourneyStage[];

export const SCREENSHOT_STATES = [
  "Idle",
  "Inputting",
  "Context Ready",
  "Thinking",
  "Planning Ready",
  "Running",
  "Waiting Approval",
  "Streaming",
  "Reviewing",
  "Error",
  "Completed",
  "Follow-up Ready",
  "Export Ready",
  "Unknown",
] as const satisfies readonly ScreenshotState[];

export const PATTERN_CATEGORIES = [
  "Intent Input Patterns",
  "Context Management Patterns",
  "Planning & Reasoning Patterns",
  "Execution Feedback Patterns",
  "Trust & Verification Patterns",
  "Refinement Patterns",
  "Output Handoff Patterns",
  "Failure Recovery Patterns",
] as const satisfies readonly PatternCategory[];

export const PATTERN_CATEGORY_DESCRIPTIONS: Record<PatternCategory, string> = {
  "Intent Input Patterns": "用户如何向 AI 表达目标、约束与期望输出。",
  "Context Management Patterns": "上下文如何附加、展示、编辑与限定范围。",
  "Planning & Reasoning Patterns": "AI 如何在执行前暴露计划、步骤与推理过程。",
  "Execution Feedback Patterns": "进度、中间结果与状态如何被持续反馈。",
  "Trust & Verification Patterns": "信任、确认与验证机制如何被设计。",
  "Refinement Patterns": "用户如何基于结果继续追问、修改、重试与细化迭代。",
  "Output Handoff Patterns": "结果如何被打包以便复用、导出或交接。",
  "Failure Recovery Patterns": "出错、超时或能力边界时，如何解释、兜底与恢复。",
};

export const REUSE_LEVELS = [
  "High",
  "Medium",
  "Low",
] as const satisfies readonly ReuseLevel[];

/** Layer-2 复合组件家族（与 Figma / docs/ai-component-journey-best-practices.md 对齐） */
export const COMPONENT_FAMILIES = [
  "Entry Launcher",
  "Intent Composer",
  "Context Tray",
  "Plan Review",
  "Agent Activity",
  "Progress Summary",
  "Verification Panel",
  "Refinement Bar",
  "Handoff Card",
] as const satisfies readonly ComponentFamily[];

export const COMPONENT_FAMILY_LABELS: Record<ComponentFamily, string> = {
  "Entry Launcher": "入口启动器 Entry Launcher",
  "Intent Composer": "意图编辑器 Intent Composer",
  "Context Tray": "上下文托盘 Context Tray",
  "Plan Review": "计划审阅 Plan Review",
  "Agent Activity": "代理活动 Agent Activity",
  "Progress Summary": "进度摘要 Progress Summary",
  "Verification Panel": "验证面板 Verification Panel",
  "Refinement Bar": "精修栏 Refinement Bar",
  "Handoff Card": "交接卡片 Handoff Card",
};

/** 各 Journey 阶段最常见的组件家族（转义提示，非强制 1:1） */
export const JOURNEY_PRIMARY_COMPONENT_FAMILY: Partial<
  Record<JourneyStage, ComponentFamily>
> = {
  "J-01 Entry": "Entry Launcher",
  "J-02 Intent Capture": "Intent Composer",
  "J-03 Context Building": "Context Tray",
  "J-04 Planning": "Plan Review",
  "J-05 Execution": "Agent Activity",
  "J-06 Feedback": "Progress Summary",
  "J-07 Verification": "Verification Panel",
  "J-08 Refinement": "Refinement Bar",
  "J-09 Handoff": "Handoff Card",
};

export function suggestedComponentFamily(
  journeyStage: JourneyStage,
): ComponentFamily | "" {
  return JOURNEY_PRIMARY_COMPONENT_FAMILY[journeyStage] ?? "";
}

export const LENS_SCORE_VALUES = [0, 1, 2, 3] as const satisfies readonly LensScoreValue[];

export const LENS_SCORE_LABELS = {
  0: "Not visible",
  1: "Weak",
  2: "Usable",
  3: "Excellent",
} as const;

// ─── 中文标签映射（内部值保持英文，UI 展示用中文） ───

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  "AI Chat": "AI 对话",
  "AI Search": "AI 搜索",
  "AI Agent": "AI 智能体",
  "AI Workspace": "AI 工作台",
  "Coding Agent": "编码智能体",
};

/** Product Category 描述：以产品整体交互范式为准，而非单张截图的界面状态 */
export const PRODUCT_CATEGORY_DESCRIPTIONS: Record<ProductCategory, string> = {
  "AI Chat": "以多轮对话为主交互的通用助手（如 ChatGPT、Claude、Gemini 对话）。",
  "AI Search": "以检索 + 答案生成为核心的产品（如 Perplexity、AI 搜索结果页）。",
  "AI Agent": "可自主规划、调用工具并执行多步任务的智能体产品（原 Agent Task）。",
  "AI Workspace": "围绕文档/画布/表格等工作产物协作的 AI 工作台（如 Notion AI、Canvas）。",
  "Coding Agent": "面向代码库的编程智能体（如 Cursor、Copilot、Windsurf）。",
};

export const JOURNEY_STAGE_LABELS: Record<JourneyStage, string> = {
  "J-01 Entry": "入口",
  "J-02 Intent Capture": "意图捕获",
  "J-03 Context Building": "上下文构建",
  "J-04 Planning": "规划",
  "J-05 Execution": "执行",
  "J-06 Feedback": "反馈",
  "J-07 Verification": "验证",
  "J-08 Refinement": "优化迭代",
  "J-09 Handoff": "交接",
};

/**
 * Screenshot State 中文标签映射
 * 截图界面当前所处的动态操作状态
 */
export const SCREENSHOT_STATE_LABELS: Record<ScreenshotState, string> = {
  Idle: "空闲",
  Inputting: "正在输入",
  "Context Ready": "上下文就绪",
  Thinking: "思考处理中",
  "Planning Ready": "计划已生成",
  Running: "执行中",
  "Waiting Approval": "等待确认",
  Streaming: "流式生成中",
  Reviewing: "审阅验证中",
  Error: "错误阻断",
  Completed: "已完成",
  "Follow-up Ready": "可继续追问",
  "Export Ready": "可导出交接",
  Unknown: "未知",
};

/**
 * Screenshot State 描述 + 判定线索
 * 用于 UI helper text 与 AI prompt：描述截图那一刻 UI 处于什么操作态。
 */
export const SCREENSHOT_STATE_DESCRIPTIONS: Record<ScreenshotState, string> = {
  Idle: "界面空闲、等待用户开始，无输入内容与进行中任务（空对话框、欢迎页、建议提示）。",
  Inputting: "用户正在输入或编辑指令（输入框聚焦、有草稿文本、附件选择中）。",
  "Context Ready": "上下文已附加并就绪、尚未开始处理（已附文件/已选范围/已加引用）。",
  Thinking: "AI 已接收请求、正在思考但尚未产出可见内容（thinking、转圈、reasoning 折叠）。",
  "Planning Ready": "AI 已生成计划/步骤/待办，等待用户查看或确认（plan 列表、TODO、diff 预览）。",
  Running: "AI 正在执行工具调用或多步任务（terminal 运行、tool call、进度条、step 推进）。",
  "Waiting Approval": "执行被暂停、等待用户批准或授权（确认弹窗、Allow/Run 按钮、权限请求）。",
  Streaming: "答案正在逐字流式输出中（光标闪烁、文本增量出现、Stop 按钮）。",
  Reviewing: "结果已产出、用户/系统正在审阅校验（diff 审查、引用核对、对比视图）。",
  Error: "出现错误、超时或被阻断（报错信息、失败态、红色提示、重试按钮）。",
  Completed: "任务已完成、结果稳定呈现（完整答案、成功态、无进行中指示）。",
  "Follow-up Ready": "结果已给出并引导继续追问/下一步（追问建议、相关问题、继续按钮）。",
  "Export Ready": "结果可被复制/导出/交接（导出菜单、分享、下载、复制代码块）。",
  Unknown: "无法从截图中明确判断界面状态时使用（仅作兜底，应尽量避免）。",
};

export const PATTERN_CATEGORY_LABELS: Record<PatternCategory, string> = {
  "Intent Input Patterns": "意图输入模式",
  "Context Management Patterns": "上下文管理模式",
  "Planning & Reasoning Patterns": "规划与推理模式",
  "Execution Feedback Patterns": "执行反馈模式",
  "Trust & Verification Patterns": "信任与验证模式",
  "Refinement Patterns": "优化迭代模式",
  "Output Handoff Patterns": "输出交接模式",
  "Failure Recovery Patterns": "失败恢复模式",
};

export const REUSE_LEVEL_LABELS: Record<ReuseLevel, string> = {
  "High": "高",
  "Medium": "中",
  "Low": "低",
};

/** Reuse Level 描述：该模式是否值得复用到其他 AI 产品 */
export const REUSE_LEVEL_DESCRIPTIONS: Record<ReuseLevel, string> = {
  High: "通用且高价值，强烈建议作为可复用模式沉淀到其他 AI 产品。",
  Medium: "在特定场景下有条件复用，需结合产品形态与上下文调整。",
  Low: "场景高度特化或属反面案例，参考价值有限，谨慎复用。",
};

export const LENS_SCORE_LABELS_ZH = {
  0: "不可见",
  1: "较弱",
  2: "可用",
  3: "优秀",
} as const;

/** 根据英文内部值获取中文标签，找不到则原样返回 */
export function labelOf(value: string, map: Record<string, string>): string {
  return map[value] ?? value;
}

export const LENS_DIMENSIONS: Array<{
  key: keyof LensScore;
  code: string;
  label: string;
  description: string;
}> = [
  {
    key: "intentClarity",
    code: "L-01",
    label: "Intent Clarity",
    description: "用户意图是否被清晰表达和承接。",
  },
  {
    key: "contextVisibility",
    code: "L-02",
    label: "Context Visibility",
    description: "上下文是否可见、可理解、可调整。",
  },
  {
    key: "processTransparency",
    code: "L-03",
    label: "Process Transparency",
    description: "AI 的计划、过程和状态是否透明。",
  },
  {
    key: "userControl",
    code: "L-04",
    label: "User Control",
    description: "用户是否能确认、暂停、修正或撤回。",
  },
  {
    key: "trustBuilding",
    code: "L-05",
    label: "Trust Building",
    description: "界面是否帮助用户建立信任与判断。",
  },
  {
    key: "errorRecoverability",
    code: "L-06",
    label: "Error Recoverability",
    description: "失败后是否能解释、恢复或继续推进。",
  },
  {
    key: "outputUsability",
    code: "L-07",
    label: "Output Usability",
    description: "结果是否易读、可用、可交付。",
  },
  {
    key: "reusability",
    code: "L-08",
    label: "Reusability",
    description: "该模式是否值得复用到其他 AI 产品。",
  },
];

export const JOURNEY_STAGE_DESCRIPTIONS: Record<JourneyStage, string> = {
  "J-01 Entry": "用户进入 AI 产品、理解入口价值与可做事项。",
  "J-02 Intent Capture": "用户表达目标、约束、输入和期望输出。",
  "J-03 Context Building": "系统收集、展示和组织任务上下文，是 AI-native 体验的关键基础。",
  "J-04 Planning": "AI 在执行前解释计划、范围、风险和需要用户确认的内容。",
  "J-05 Execution": "AI 调用能力、工具或工作流推进任务，用户需要理解当前进度。",
  "J-06 Feedback": "系统持续反馈中间状态、部分结果、等待原因和下一步。",
  "J-07 Verification": "用户或系统检查结果可信度、可接受性和可修正点。",
  "J-08 Refinement": "用户基于反馈继续追问、修改、重试或细化结果。",
  "J-09 Handoff": "结果被整理为可复制、可导出、可交接的形态。",
};

export const EMPTY_LENS_SCORE: LensScore = {
  intentClarity: 0,
  contextVisibility: 0,
  processTransparency: 0,
  userControl: 0,
  trustBuilding: 0,
  errorRecoverability: 0,
  outputUsability: 0,
  reusability: 0,
};

export const EMPTY_ANALYSIS: PatternAnalysisResult = {
  product: "",
  productCategory: "AI Chat",
  journeyStage: "J-01 Entry",
  screenshotState: "Idle",
  secondaryScreenshotStates: [],
  screenshotStateReason: "",
  patternName: "",
  componentFamily: "",
  patternCategory: "Intent Input Patterns",
  userProblem: "",
  aiCapability: "",
  uiAnatomy: "",
  interactionRule: "",
  systemFeedback: "",
  trustMechanism: "",
  failureHandling: "",
  reuseLevel: "Medium",
  designJudgment: "",
  lensScore: EMPTY_LENS_SCORE,
  tags: [],
};

// ─────────────────────────────────────────────────────────────
// 集中分类选项（value / label / description）
//
// 这是所有分类下拉/筛选/表单的唯一数据源，避免在多个文件重复定义。
// 五个核心字段职责区分：
//   Product Category  = 产品形态（这是什么形态的 AI 产品）
//   Journey Stage     = 用户路径（任务流程中的哪个步骤，宏观纵向）
//   Screenshot State  = 界面状态（截图那一刻 UI 处于什么操作态，微观）
//   Pattern Category  = 模式库分类（提炼出的模式解决哪一类设计问题）
//   Reuse Level       = 复用价值（是否值得复用到其他 AI 产品）
// ─────────────────────────────────────────────────────────────

export type TaxonomyOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};

export const PRODUCT_CATEGORY_OPTIONS: ReadonlyArray<TaxonomyOption<ProductCategory>> =
  PRODUCT_CATEGORIES.map((value) => ({
    value,
    label: PRODUCT_CATEGORY_LABELS[value],
    description: PRODUCT_CATEGORY_DESCRIPTIONS[value],
  }));

export const JOURNEY_STAGE_OPTIONS: ReadonlyArray<TaxonomyOption<JourneyStage>> =
  JOURNEY_STAGES.map((value) => ({
    value,
    label: JOURNEY_STAGE_LABELS[value],
    description: JOURNEY_STAGE_DESCRIPTIONS[value],
  }));

export const SCREENSHOT_STATE_OPTIONS: ReadonlyArray<TaxonomyOption<ScreenshotState>> =
  SCREENSHOT_STATES.map((value) => ({
    value,
    label: SCREENSHOT_STATE_LABELS[value],
    description: SCREENSHOT_STATE_DESCRIPTIONS[value],
  }));

export const PATTERN_CATEGORY_OPTIONS: ReadonlyArray<TaxonomyOption<PatternCategory>> =
  PATTERN_CATEGORIES.map((value) => ({
    value,
    label: PATTERN_CATEGORY_LABELS[value],
    description: PATTERN_CATEGORY_DESCRIPTIONS[value],
  }));

export const REUSE_LEVEL_OPTIONS: ReadonlyArray<TaxonomyOption<ReuseLevel>> =
  REUSE_LEVELS.map((value) => ({
    value,
    label: REUSE_LEVEL_LABELS[value],
    description: REUSE_LEVEL_DESCRIPTIONS[value],
  }));

/** 五个分类维度的总览说明（模式分析区标题旁 Info 提示） */
export const CLASSIFICATION_DIMENSIONS_OVERVIEW_HINT =
  "五个分类维度各有分工：产品形态 = 这是什么 AI 产品 · 旅程阶段 = 任务流程中的哪一步 · 截图状态 = 截图那一刻 UI 的操作态 · 模式分类 = 模式解决哪类设计问题 · 复用价值 = 是否值得复用。";

/** UI helper text：放在 Classification 各字段下方，帮助用户区分五个分类维度 */
export const TAXONOMY_FIELD_HINTS = {
  productCategory: "产品形态：这是什么形态的 AI 产品（与单张截图无关）。",
  journeyStage: "用户路径：任务流程中的哪个步骤（宏观纵向阶段）。",
  screenshotState: "界面状态：截图那一刻 UI 处于什么操作态（微观瞬时）。",
  secondaryScreenshotStates: "次要界面状态：同一截图同时呈现的其他状态（可多选/留空）。",
  patternCategory: "模式分类：提炼出的模式解决哪一类设计问题。",
  reuseLevel: "复用价值：该模式是否值得复用到其他 AI 产品。",
  componentFamily:
    "组件家族：Pattern 转义后的 Figma 复合组件键；与模式名称不同，用于组件规格与 Library 聚合。",
} as const;

// ─────────────────────────────────────────────────────────────
// 旧值迁移映射（normalize / import / 云函数均复用同一套规则）
//
// 凡是历史数据或 AI 偶发返回的旧枚举值，必须先经 migration 转成新值，
// 不允许旧值直接通过校验。
// ─────────────────────────────────────────────────────────────

/** Product Category：Agent Task → AI Agent */
export const PRODUCT_CATEGORY_MIGRATION_MAP: Record<string, ProductCategory> = {
  "Agent Task": "AI Agent",
  "AI Task": "AI Agent",
  Agent: "AI Agent",
};

/** Screenshot State：旧「路径/组件」导向值 → 新「界面状态」导向值 */
export const SCREENSHOT_STATE_MIGRATION_MAP: Record<string, ScreenshotState> = {
  Default: "Idle",
  "Input Assist": "Inputting",
  "Context Attach": "Context Ready",
  "Plan Preview": "Planning Ready",
  "Tool Call": "Running",
  "Human Approval": "Waiting Approval",
  "Partial Result": "Streaming",
  "Error Recovery": "Error",
  "Final Result": "Completed",
  "Follow-up": "Follow-up Ready",
  "Export / Handoff": "Export Ready",
  "Export/Handoff": "Export Ready",
};

/** Pattern Category：旧值兼容（命名微调与扩展前的别名） */
export const PATTERN_CATEGORY_MIGRATION_MAP: Record<string, PatternCategory> = {
  "Intent Patterns": "Intent Input Patterns",
  "Context Patterns": "Context Management Patterns",
  "Planning Patterns": "Planning & Reasoning Patterns",
  "Reasoning Patterns": "Planning & Reasoning Patterns",
  "Execution Patterns": "Execution Feedback Patterns",
  "Feedback Patterns": "Execution Feedback Patterns",
  "Trust Patterns": "Trust & Verification Patterns",
  "Verification Patterns": "Trust & Verification Patterns",
  "Refine Patterns": "Refinement Patterns",
  "Iteration Patterns": "Refinement Patterns",
  "Output Patterns": "Output Handoff Patterns",
  "Handoff Patterns": "Output Handoff Patterns",
  "Recovery Patterns": "Failure Recovery Patterns",
  "Error Recovery Patterns": "Failure Recovery Patterns",
};

/**
 * 迁移单个枚举值：命中迁移表则返回新值，命中合法集合则原样返回，否则返回 fallback。
 */
export function migrateEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  migration: Record<string, T>,
  fallback: T,
): T {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if ((allowed as readonly string[]).includes(trimmed)) return trimmed as T;
  if (migration[trimmed]) return migration[trimmed];
  return fallback;
}
