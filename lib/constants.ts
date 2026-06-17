import type {
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
  "Agent Task",
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
  "Default",
  "Input Assist",
  "Context Attach",
  "Plan Preview",
  "Tool Call",
  "Human Approval",
  "Partial Result",
  "Error Recovery",
  "Final Result",
  "Follow-up",
  "Export / Handoff",
] as const satisfies readonly ScreenshotState[];

export const PATTERN_CATEGORIES = [
  "Intent Input Patterns",
  "Context Management Patterns",
  "Planning & Reasoning Patterns",
  "Execution Feedback Patterns",
  "Trust & Verification Patterns",
  "Output Handoff Patterns",
] as const satisfies readonly PatternCategory[];

export const PATTERN_CATEGORY_DESCRIPTIONS: Record<PatternCategory, string> = {
  "Intent Input Patterns": "用户如何向 AI 表达目标、约束与期望输出。",
  "Context Management Patterns": "上下文如何附加、展示、编辑与限定范围。",
  "Planning & Reasoning Patterns": "AI 如何在执行前暴露计划、步骤与推理过程。",
  "Execution Feedback Patterns": "进度、中间结果与状态如何被持续反馈。",
  "Trust & Verification Patterns": "信任、确认与验证机制如何被设计。",
  "Output Handoff Patterns": "结果如何被打包以便复用、导出或交接。",
};

export const REUSE_LEVELS = [
  "High",
  "Medium",
  "Low",
] as const satisfies readonly ReuseLevel[];

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
  "Agent Task": "智能体任务",
  "AI Workspace": "AI 工作台",
  "Coding Agent": "编码智能体",
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

export const SCREENSHOT_STATE_LABELS: Record<ScreenshotState, string> = {
  "Default": "默认",
  "Input Assist": "输入辅助",
  "Context Attach": "上下文附加",
  "Plan Preview": "计划预览",
  "Tool Call": "工具调用",
  "Human Approval": "人工审批",
  "Partial Result": "部分结果",
  "Error Recovery": "错误恢复",
  "Final Result": "最终结果",
  "Follow-up": "追问跟进",
  "Export / Handoff": "导出/交接",
};

export const PATTERN_CATEGORY_LABELS: Record<PatternCategory, string> = {
  "Intent Input Patterns": "意图输入模式",
  "Context Management Patterns": "上下文管理模式",
  "Planning & Reasoning Patterns": "规划与推理模式",
  "Execution Feedback Patterns": "执行反馈模式",
  "Trust & Verification Patterns": "信任与验证模式",
  "Output Handoff Patterns": "输出交接模式",
};

export const REUSE_LEVEL_LABELS: Record<ReuseLevel, string> = {
  "High": "高",
  "Medium": "中",
  "Low": "低",
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
  screenshotState: "Default",
  patternName: "",
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
