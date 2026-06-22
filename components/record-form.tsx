"use client";

import type { ReactNode } from "react";
import type { PatternAnalysisResult, LensScoreValue, ScreenshotState } from "@/lib/types";
import {
  COMPONENT_FAMILIES,
  COMPONENT_FAMILY_LABELS,
  JOURNEY_STAGES,
  JOURNEY_STAGE_LABELS,
  LENS_DIMENSIONS,
  LENS_SCORE_LABELS_ZH,
  LENS_SCORE_VALUES,
  PATTERN_CATEGORIES,
  PATTERN_CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  REUSE_LEVELS,
  REUSE_LEVEL_LABELS,
  SCREENSHOT_STATES,
  SCREENSHOT_STATE_LABELS,
  TAXONOMY_FIELD_HINTS,
  labelOf,
  suggestedComponentFamily,
} from "@/lib/constants";
import {
  DualLabel,
  Field,
  SegmentedControl,
  TypedIdBadge,
  formTextareaClass,
  inputClass,
  selectClass,
} from "@/components/ui";
import { FormModule } from "@/components/research-ui";

export type RecordFormModule = "A" | "B" | "C" | "D" | "E";

type RecordFormProps = {
  value: PatternAnalysisResult;
  patternId?: string;
  onChange: (value: PatternAnalysisResult) => void;
  modules?: RecordFormModule[];
  variant?: "default" | "capture";
};

const ALL_MODULES: RecordFormModule[] = ["A", "B", "C", "D", "E"];

const COMPONENT_FAMILY_OPTIONS = ["", ...COMPONENT_FAMILIES] as const;

const COMPONENT_FAMILY_OPTION_LABELS: Record<string, string> = {
  "": "待映射 Unmapped",
  ...COMPONENT_FAMILY_LABELS,
};

export function RecordForm({
  value,
  patternId,
  onChange,
  modules = ALL_MODULES,
  variant = "default",
}: RecordFormProps) {
  const show = (m: RecordFormModule) => modules.includes(m);
  const guided = variant === "capture";

  const update = <K extends keyof PatternAnalysisResult>(
    key: K,
    nextValue: PatternAnalysisResult[K],
  ) => onChange({ ...value, [key]: nextValue });

  const textField = (
    key: keyof Pick<
      PatternAnalysisResult,
      | "userProblem"
      | "aiCapability"
      | "uiAnatomy"
      | "interactionRule"
      | "systemFeedback"
      | "trustMechanism"
      | "failureHandling"
      | "designJudgment"
      | "patternName"
    >,
    zh: string,
    en: string,
    hint?: string,
  ) => (
    <div>
      <Field label={<DualLabel zh={zh} en={en} />} compact>
        <textarea
          className={formTextareaClass}
          rows={4}
          value={value[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      </Field>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );

  const selectField = <T extends string>(
    key: keyof PatternAnalysisResult,
    zh: string,
    en: string,
    options: readonly T[],
    hint?: string,
    optionLabels?: Record<string, string>,
  ) => (
    <div>
      <SelectField
        label={<DualLabel zh={zh} en={en} />}
        value={value[key] as T}
        options={options}
        optionLabels={optionLabels}
        onChange={(v) => update(key, v as PatternAnalysisResult[typeof key])}
      />
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );

  /** 次要界面状态：同一截图可同时呈现的其他状态（多选，排除主状态） */
  const toggleSecondaryState = (state: ScreenshotState) => {
    const current = Array.isArray(value.secondaryScreenshotStates)
      ? value.secondaryScreenshotStates
      : [];
    const next = current.includes(state)
      ? current.filter((s) => s !== state)
      : [...current, state];
    update("secondaryScreenshotStates", next);
  };

  const secondaryStatesField = (
    <div>
      <Field label={<DualLabel zh="次要界面状态" en="Secondary States" />} compact>
        <div className="checkbox-group">
          {SCREENSHOT_STATES.filter(
            (s) => s !== "Unknown" && s !== (value.screenshotState as ScreenshotState),
          ).map((s) => {
            const active = (value.secondaryScreenshotStates ?? []).includes(s);
            return (
              <label key={s} className="checkbox-option">
                <input
                  type="checkbox"
                  className="focus-ring"
                  checked={active}
                  onChange={() => toggleSecondaryState(s)}
                />
                <span className="checkbox-option-label">
                  {labelOf(s, SCREENSHOT_STATE_LABELS)}
                </span>
              </label>
            );
          })}
        </div>
      </Field>
      <p className="field-hint">{TAXONOMY_FIELD_HINTS.secondaryScreenshotStates}</p>
    </div>
  );

  const componentFamilyHint = (() => {
    const suggested = suggestedComponentFamily(value.journeyStage);
    const base = TAXONOMY_FIELD_HINTS.componentFamily;
    if (!suggested) return base;
    return `${base} 当前 Journey 常见组件：${COMPONENT_FAMILY_LABELS[suggested]}。`;
  })();

  const componentFamilyField = selectField(
    "componentFamily",
    "组件家族",
    "Component Family",
    COMPONENT_FAMILY_OPTIONS,
    componentFamilyHint,
    COMPONENT_FAMILY_OPTION_LABELS,
  );

  const stateReasonField = (
    <div>
      <Field label={<DualLabel zh="界面状态理由" en="State Reason" />} compact>
        <textarea
          className={formTextareaClass}
          rows={4}
          value={value.screenshotStateReason ?? ""}
          onChange={(e) => update("screenshotStateReason", e.target.value)}
        />
      </Field>
      <p className="field-hint">解释为何判定为该主状态（及次要状态）的界面线索。</p>
    </div>
  );

  if (guided) {
    return (
      <div className="capture-review-form">
        {show("A") ? (
          <FormModule
            letter="A"
            title="分类归位"
            description="决定这条记录会进入矩阵和旅程的哪个位置。"
          >
            <div className="capture-form-stack">
              <div className="capture-form-grid">
                <Field label={<DualLabel zh="产品" en="Product" />} compact>
                  <input
                    className={inputClass}
                    value={value.product}
                    onChange={(e) => update("product", e.target.value)}
                  />
                </Field>
                {selectField(
                  "productCategory",
                  "产品类型",
                  "Product Category",
                  PRODUCT_CATEGORIES,
                  TAXONOMY_FIELD_HINTS.productCategory,
                  PRODUCT_CATEGORY_LABELS,
                )}
                {selectField(
                  "journeyStage",
                  "旅程阶段",
                  "用户路径",
                  JOURNEY_STAGES,
                  TAXONOMY_FIELD_HINTS.journeyStage,
                  JOURNEY_STAGE_LABELS,
                )}
                {selectField(
                  "screenshotState",
                  "截图状态",
                  "Screenshot State",
                  SCREENSHOT_STATES,
                  TAXONOMY_FIELD_HINTS.screenshotState,
                  SCREENSHOT_STATE_LABELS,
                )}
              </div>
              {secondaryStatesField}
              {stateReasonField}
              {selectField(
                "patternCategory",
                "模式分类",
                "Pattern Category",
                PATTERN_CATEGORIES,
                TAXONOMY_FIELD_HINTS.patternCategory,
                PATTERN_CATEGORY_LABELS,
              )}
            </div>
          </FormModule>
        ) : null}

        {show("B") ? (
          <FormModule
            letter="B"
            title="模式标识"
            description="把这张截图抽象成一个可复用、可检索的模式。"
          >
            <div className="capture-form-stack">
              <div className="capture-form-grid">
                {patternId ? (
                  <Field label={<DualLabel zh="模式编号" en="Pattern ID" />} compact>
                    <div className="flex h-9 items-center">
                      <TypedIdBadge kind="pattern">{patternId}</TypedIdBadge>
                    </div>
                  </Field>
                ) : null}
                <Field label={<DualLabel zh="模式名称" en="Pattern Name" />} compact>
                  <input
                    className={inputClass}
                    value={value.patternName}
                    onChange={(e) => update("patternName", e.target.value)}
                  />
                </Field>
                {componentFamilyField}
              </div>
              <Field label={<DualLabel zh="标签" en="Tags" />} hint="逗号分隔" compact>
                <input
                  className={inputClass}
                  value={value.tags.join(", ")}
                  onChange={(e) =>
                    update(
                      "tags",
                      e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    )
                  }
                />
              </Field>
            </div>
          </FormModule>
        ) : null}

        {show("C") ? (
          <FormModule
            letter="C"
            title="体验诊断"
            description="解释这个模式解决了什么体验问题。"
          >
            <div className="capture-form-grid">
              {textField(
                "userProblem",
                "用户问题",
                "User Problem",
                "这个模式解决了用户什么不确定性？",
              )}
              {textField(
                "aiCapability",
                "AI 能力",
                "AI Capability",
                "这里暴露了 AI 的什么能力？",
              )}
              {textField(
                "uiAnatomy",
                "界面结构",
                "UI Anatomy",
                "界面由哪些关键部分组成？",
              )}
              {textField(
                "interactionRule",
                "交互规则",
                "Interaction Rule",
                "用户如何触发、确认、修改或接管？",
              )}
            </div>
          </FormModule>
        ) : null}

        {show("D") ? (
          <FormModule
            letter="D"
            title="信任与恢复"
            description="判断这个模式是否可靠、可控、可恢复。"
          >
            <div className="capture-form-grid">
              {textField(
                "systemFeedback",
                "系统反馈",
                "System Feedback",
                "系统如何反馈状态、进度或风险？",
              )}
              {textField(
                "trustMechanism",
                "信任机制",
                "Trust Mechanism",
                "这个界面如何建立用户对 AI 的信任？",
              )}
              {textField(
                "failureHandling",
                "失败处理",
                "Failure Handling",
                "失败后用户如何恢复？",
              )}
              {textField(
                "designJudgment",
                "设计判断",
                "Design Judgment",
                "这个模式是否值得复用？复用条件是什么？",
              )}
            </div>
          </FormModule>
        ) : null}

        {show("E") ? (
          <FormModule
            letter="E"
            title="分析镜头与复用"
            description="用统一分析维度评估模式价值。"
          >
            <div className="capture-form-stack">
              <p className="lens-legend">
                0 {LENS_SCORE_LABELS_ZH[0]} · 1 {LENS_SCORE_LABELS_ZH[1]} · 2 {LENS_SCORE_LABELS_ZH[2]} · 3 {LENS_SCORE_LABELS_ZH[3]}
              </p>
              <div className="lens-score-list">
                {LENS_DIMENSIONS.map((dim) => (
                  <div
                    key={dim.key}
                    className="lens-score-row flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <TypedIdBadge kind="lens">{dim.code}</TypedIdBadge>
                      <span className="truncate text-[11px] text-[var(--text-muted)]" title={dim.label}>
                        {dim.description}
                      </span>
                    </div>
                    <SegmentedControl
                      compact
                      value={value.lensScore[dim.key]}
                      options={LENS_SCORE_VALUES.map((s) => ({
                        value: s,
                        label: String(s),
                      }))}
                      onChange={(score) =>
                        onChange({
                          ...value,
                          lensScore: {
                            ...value.lensScore,
                            [dim.key]: score as LensScoreValue,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              {selectField("reuseLevel", "复用等级", "Reuse Level", REUSE_LEVELS, undefined, REUSE_LEVEL_LABELS)}
            </div>
          </FormModule>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {show("A") ? (
        <FormModule letter="A" title="分类归位">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {selectField("productCategory", "产品类型", "Product Category", PRODUCT_CATEGORIES, TAXONOMY_FIELD_HINTS.productCategory, PRODUCT_CATEGORY_LABELS)}
              {selectField("journeyStage", "旅程阶段", "用户路径", JOURNEY_STAGES, TAXONOMY_FIELD_HINTS.journeyStage, JOURNEY_STAGE_LABELS)}
              {selectField("screenshotState", "截图状态", "Screenshot State", SCREENSHOT_STATES, TAXONOMY_FIELD_HINTS.screenshotState, SCREENSHOT_STATE_LABELS)}
            </div>
            {secondaryStatesField}
            {stateReasonField}
            <div className="grid grid-cols-2 gap-2">
              {selectField("patternCategory", "模式分类", "Pattern Category", PATTERN_CATEGORIES, TAXONOMY_FIELD_HINTS.patternCategory, PATTERN_CATEGORY_LABELS)}
              {selectField("reuseLevel", "复用等级", "Reuse Level", REUSE_LEVELS, TAXONOMY_FIELD_HINTS.reuseLevel, REUSE_LEVEL_LABELS)}
            </div>
          </div>
        </FormModule>
      ) : null}

      {show("B") ? (
        <FormModule letter="B" title="模式标识">
          <div className="grid gap-2 sm:grid-cols-2">
            {patternId ? (
              <Field label={<DualLabel zh="模式编号" en="Pattern ID" />} compact>
                <div className="flex h-8 items-center">
                  <TypedIdBadge kind="pattern">{patternId}</TypedIdBadge>
                </div>
              </Field>
            ) : null}
            <Field label={<DualLabel zh="模式名称" en="Pattern Name" />} compact>
              <input
                className={inputClass}
                value={value.patternName}
                onChange={(e) => update("patternName", e.target.value)}
              />
            </Field>
            {componentFamilyField}
            <Field label={<DualLabel zh="产品" en="Product" />} compact>
              <input
                className={inputClass}
                value={value.product}
                onChange={(e) => update("product", e.target.value)}
              />
            </Field>
            <Field label={<DualLabel zh="标签" en="Tags" />} hint="逗号分隔" compact>
              <input
                className={inputClass}
                value={value.tags.join(", ")}
                onChange={(e) =>
                  update(
                    "tags",
                    e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  )
                }
              />
            </Field>
          </div>
        </FormModule>
      ) : null}

      {show("C") ? (
        <FormModule letter="C" title="体验诊断">
          <div className="grid gap-2 sm:grid-cols-2">
            {textField("userProblem", "用户问题", "User Problem")}
            {textField("aiCapability", "AI 能力", "AI Capability")}
            {textField("uiAnatomy", "界面结构", "UI Anatomy")}
            {textField("interactionRule", "交互规则", "Interaction Rule")}
          </div>
        </FormModule>
      ) : null}

      {show("D") ? (
        <FormModule letter="D" title="信任与恢复">
          <div className="grid gap-2 sm:grid-cols-2">
            {textField("systemFeedback", "系统反馈", "System Feedback")}
            {textField("trustMechanism", "信任机制", "Trust Mechanism")}
            {textField("failureHandling", "失败处理", "Failure Handling")}
            {textField("designJudgment", "设计判断", "Design Judgment")}
          </div>
        </FormModule>
      ) : null}

      {show("E") ? (
        <FormModule letter="E" title="分析镜头">
          <div className="space-y-1">
            {LENS_DIMENSIONS.map((dim) => (
              <div
                key={dim.key}
                className="flex items-center justify-between gap-2 py-1"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <TypedIdBadge kind="lens">{dim.code}</TypedIdBadge>
                  <span
                    className="truncate text-[11px] text-[var(--text-muted)]"
                    title={dim.label}
                  >
                    {dim.description}
                  </span>
                </div>
                <SegmentedControl
                  compact
                  value={value.lensScore[dim.key]}
                  options={LENS_SCORE_VALUES.map((s) => ({
                    value: s,
                    label: String(s),
                  }))}
                  onChange={(score) =>
                    onChange({
                      ...value,
                      lensScore: {
                        ...value.lensScore,
                        [dim.key]: score as LensScoreValue,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </FormModule>
      ) : null}
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  label: ReactNode;
  value: T;
  options: readonly T[];
  optionLabels?: Record<string, string>;
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label} compact>
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {optionLabels ? labelOf(opt, optionLabels) : opt}
          </option>
        ))}
      </select>
    </Field>
  );
}
