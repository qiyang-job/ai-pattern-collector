export type ProductCategory =
  | "AI Chat"
  | "AI Search"
  | "Agent Task"
  | "AI Workspace"
  | "Coding Agent";

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

export type ScreenshotState =
  | "Default"
  | "Input Assist"
  | "Context Attach"
  | "Plan Preview"
  | "Tool Call"
  | "Human Approval"
  | "Partial Result"
  | "Error Recovery"
  | "Final Result"
  | "Follow-up"
  | "Export / Handoff";

export type PatternCategory =
  | "Intent Input Patterns"
  | "Context Management Patterns"
  | "Planning & Reasoning Patterns"
  | "Execution Feedback Patterns"
  | "Trust & Verification Patterns"
  | "Output Handoff Patterns";

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
  imageFileID?: string;
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
  screenshotState: ScreenshotState;
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
  highValuePatterns: string;
  crossProductComparison: string;
  stageMaturity: string;
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
