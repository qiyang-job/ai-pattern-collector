/**
 * Product Category — 产品形态分类
 *
 * 回答：这是一个什么形态的 AI 产品？
 * 描述被研究截图所属产品的整体交互范式（与单张截图的界面状态无关）。
 *
 * 注意：旧值 "Agent Task" 已更名为 "AI Agent"（见 PRODUCT_CATEGORY_MIGRATION_MAP）。
 */
export type ProductCategory =
  | "AI Chat"
  | "AI Search"
  | "AI Agent"
  | "AI Workspace"
  | "Coding Agent";

/**
 * Journey Stage — 用户路径阶段
 *
 * 回答：在整条任务流程中，这条记录处于哪个步骤？
 * 描述用户与 AI 协作完成任务的阶段位置（纵向流程），J-01～J-09 固定不变。
 *
 * 注意与 Screenshot State 的区别：
 * - Journey Stage = 路径阶段（任务流程中的哪个步骤，宏观）
 * - Screenshot State = 界面状态（截图那一刻 UI 处于什么操作态，微观）
 */
export type JourneyStage =
  | "J-01 Entry"
  | "J-02 Intent Capture"
  | "J-03 Context Building"
  | "J-04 Planning"
  | "J-05 Execution"
  | "J-06 Feedback"
  | "J-07 Verification"
  | "J-08 Refinement"
  | "J-09 Handoff";

/**
 * Screenshot State — 截图状态（界面动态 UI 状态）
 *
 * 回答：这张截图里的界面当前处于什么操作状态？
 * 是界面状态分类，描述截图当下的动态 UI 状态。
 *
 * 注意与 Journey Stage 的区别：
 * - Journey Stage = 路径阶段（任务流程中的哪个步骤）
 * - Screenshot State = 界面状态（截图那一刻 UI 处于什么操作态）
 */
export type ScreenshotState =
  | "Idle"
  | "Inputting"
  | "Context Ready"
  | "Thinking"
  | "Planning Ready"
  | "Running"
  | "Waiting Approval"
  | "Streaming"
  | "Reviewing"
  | "Error"
  | "Completed"
  | "Follow-up Ready"
  | "Export Ready"
  | "Unknown";

/**
 * Pattern Category — 模式库分类
 *
 * 回答：这个被提炼出来的设计模式属于模式库的哪一类？
 * 用于把抽象后的 Pattern 归入固定的模式研究框架（共 8 类）。
 *
 * 与 Journey Stage / Screenshot State 不同：
 * - Journey Stage / Screenshot State 描述「截图/记录处于什么位置或状态」
 * - Pattern Category 描述「提炼出的模式本身解决的是哪一类设计问题」
 *
 * 顺序固定：Intent Input → Context Management → Planning & Reasoning →
 * Execution Feedback → Trust & Verification → Refinement → Output Handoff → Failure Recovery
 */
export type PatternCategory =
  | "Intent Input Patterns"
  | "Context Management Patterns"
  | "Planning & Reasoning Patterns"
  | "Execution Feedback Patterns"
  | "Trust & Verification Patterns"
  | "Refinement Patterns"
  | "Output Handoff Patterns"
  | "Failure Recovery Patterns";

/**
 * Reuse Level — 复用价值
 *
 * 回答：这个模式是否值得复用到其他 AI 产品？
 * High = 通用且高价值，强烈建议复用；Medium = 有条件复用；Low = 场景特化，参考价值有限。
 */
export type ReuseLevel = "High" | "Medium" | "Low";

export type LensScoreValue = 0 | 1 | 2 | 3;

export type LensScore = {
  intentClarity: LensScoreValue;
  contextVisibility: LensScoreValue;
  processTransparency: LensScoreValue;
  userControl: LensScoreValue;
  trustBuilding: LensScoreValue;
  errorRecoverability: LensScoreValue;
  outputUsability: LensScoreValue;
  reusability: LensScoreValue;
};

export type PatternRecord = {
  id: string;
  screenshotId: string;
  imageDataUrl: string;
  /** 额外截图（0-8张，与主图合计最多9张） */
  extraImages?: string[];
  imageFileID?: string;
  /** 录屏证据（云存储 fileID） */
  videoFileID?: string;
  videoName?: string;
  videoMime?: string;
  rawNote: string;
  sourceUrl?: string;
  taskContext?: string;
  patternId: string;
  patternName: string;
  userProblem: string;
  aiCapability: string;
  uiAnatomy: string;
  interactionRule: string;
  systemFeedback: string;
  trustMechanism: string;
  failureHandling: string;
  reuseLevel: ReuseLevel;
  designJudgment: string;
  tags: string[];
  product: string;
  productCategory: ProductCategory;
  journeyStage: JourneyStage;
  /** 主界面状态：截图那一刻 UI 处于的主要操作态 */
  screenshotState: ScreenshotState;
  /** 次要界面状态：同一截图可能同时呈现的其他界面状态（可为空数组） */
  secondaryScreenshotStates: ScreenshotState[];
  /** 界面状态判定理由：解释为何判定为该主状态（及次要状态） */
  screenshotStateReason: string;
  patternCategory: PatternCategory;
  lensScore: LensScore;
  createdAt: string;
  updatedAt: string;
};

export type PatternAnalysisResult = Omit<
  PatternRecord,
  | "id"
  | "screenshotId"
  | "imageDataUrl"
  | "videoFileID"
  | "videoName"
  | "videoMime"
  | "rawNote"
  | "sourceUrl"
  | "taskContext"
  | "patternId"
  | "createdAt"
  | "updatedAt"
>;

export type InsightsResult = {
  researchScope: string;
  productCoverage: string;
  journeyCoverage: string;
  /** 界面状态分布：各 Screenshot State 的覆盖与密度分析 */
  screenshotStateDistribution: string;
  /** 模式分类分布：各 Pattern Category（含 Refinement / Failure Recovery）的覆盖分析 */
  patternCategoryDistribution: string;
  highValuePatterns: string;
  crossProductComparison: string;
  stageMaturity: string;
  /** 缺失界面状态：尚未被采集到的 Screenshot State，提示补采方向 */
  missingStates: string;
  designOpportunities: string;
  recommendations: string;
};

export type RecordSummary = Pick<
  PatternRecord,
  | "patternId"
  | "screenshotId"
  | "product"
  | "productCategory"
  | "journeyStage"
  | "screenshotState"
  | "secondaryScreenshotStates"
  | "screenshotStateReason"
  | "patternName"
  | "patternCategory"
  | "userProblem"
  | "aiCapability"
  | "trustMechanism"
  | "reuseLevel"
  | "designJudgment"
  | "lensScore"
  | "tags"
>;
