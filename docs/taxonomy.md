# AI Pattern Collector 分类体系（Taxonomy）

本文件是分类体系的**唯一权威说明**。所有下拉、筛选、表单、AI Prompt、导出与统计都必须与此保持一致。

代码层的唯一数据源是 [`lib/constants.ts`](../lib/constants.ts)（`*_OPTIONS` / `*_LABELS` / `*_DESCRIPTIONS` / `*_MIGRATION_MAP`）。请勿在其他文件重复定义选项。

---

## 0. 五个核心分类字段的职责区分

| 字段 | 回答的问题 | 粒度 |
| --- | --- | --- |
| **Product Category** | 这是什么形态的 AI 产品？ | 产品形态（与单张截图无关） |
| **Journey Stage** | 任务流程中的哪个步骤？ | 用户路径（宏观纵向） |
| **Screenshot State** | 截图那一刻 UI 处于什么操作态？ | 界面状态（微观瞬时） |
| **Pattern Category** | 提炼出的模式解决哪一类设计问题？ | 模式库分类 |
| **Reuse Level** | 该模式是否值得复用到其他 AI 产品？ | 复用价值 |

> 关键边界：Journey Stage 与 Screenshot State 容易混淆。前者描述「任务流程到了哪一步」，后者描述「这张截图的界面此刻在做什么」。同一个 Journey Stage 下截图可能呈现不同的 Screenshot State。

---

## 1. Product Category（产品形态）

| value | 中文标签 | 说明 |
| --- | --- | --- |
| `AI Chat` | AI 对话 | 以多轮对话为主交互的通用助手 |
| `AI Search` | AI 搜索 | 以检索 + 答案生成为核心的产品 |
| `AI Agent` | AI 智能体 | 可自主规划、调用工具并执行多步任务的智能体 |
| `AI Workspace` | AI 工作台 | 围绕文档/画布/表格协作的 AI 工作台 |
| `Coding Agent` | 编码智能体 | 面向代码库的编程智能体 |

**迁移映射**：`Agent Task` → `AI Agent`，`AI Task` → `AI Agent`，`Agent` → `AI Agent`。

---

## 2. Journey Stage（用户路径阶段）

固定 J-01 ～ J-09：

`J-01 Entry` · `J-02 Intent Capture` · `J-03 Context Building` · `J-04 Planning` · `J-05 Execution` · `J-06 Feedback` · `J-07 Verification` · `J-08 Refinement` · `J-09 Handoff`

其中 J-03 ～ J-07 是 AI 产品区别于传统产品的核心阶段（Core AI Interaction Band）。

---

## 3. Screenshot State（界面状态）

共 14 项（含 `Unknown` 兜底）：

| value | 中文标签 | 判定线索 |
| --- | --- | --- |
| `Idle` | 空闲 | 空对话框、欢迎页、建议提示 |
| `Inputting` | 正在输入 | 输入框聚焦、草稿文本、附件选择中 |
| `Context Ready` | 上下文就绪 | 已附文件/已选范围/已加引用 |
| `Thinking` | 思考处理中 | thinking、转圈、reasoning 折叠 |
| `Planning Ready` | 计划已生成 | plan 列表、TODO、diff 预览 |
| `Running` | 执行中 | terminal 运行、tool call、进度条 |
| `Waiting Approval` | 等待确认 | 确认弹窗、Allow/Run、权限请求 |
| `Streaming` | 流式生成中 | 光标闪烁、文本增量、Stop 按钮 |
| `Reviewing` | 审阅验证中 | diff 审查、引用核对、对比视图 |
| `Error` | 错误阻断 | 报错、失败态、重试按钮 |
| `Completed` | 已完成 | 完整答案、成功态、无进行中指示 |
| `Follow-up Ready` | 可继续追问 | 追问建议、相关问题、继续按钮 |
| `Export Ready` | 可导出交接 | 导出菜单、分享、下载、复制代码块 |
| `Unknown` | 未知 | 仅作兜底，应尽量避免 |

**多状态支持**：

- `screenshotState`：主状态（必填）
- `secondaryScreenshotStates: ScreenshotState[]`：次要状态（可空，去重、剔除主状态与 `Unknown`）
- `screenshotStateReason: string`：界面状态判定理由

**迁移映射**：`Default` → `Idle`，`Input Assist` → `Inputting`，`Context Attach` → `Context Ready`，`Plan Preview` → `Planning Ready`，`Tool Call` → `Running`，`Human Approval` → `Waiting Approval`，`Partial Result` → `Streaming`，`Error Recovery` → `Error`，`Final Result` → `Completed`，`Follow-up` → `Follow-up Ready`，`Export / Handoff` → `Export Ready`。

---

## 4. Pattern Category（模式库分类）

固定顺序，共 8 类：

| value | 中文标签 | 说明 |
| --- | --- | --- |
| `Intent Input Patterns` | 意图输入模式 | 用户如何表达目标、约束与期望输出 |
| `Context Management Patterns` | 上下文管理模式 | 上下文如何附加、展示、编辑与限定 |
| `Planning & Reasoning Patterns` | 规划与推理模式 | 执行前如何暴露计划、步骤与推理 |
| `Execution Feedback Patterns` | 执行反馈模式 | 进度、中间结果与状态如何反馈 |
| `Trust & Verification Patterns` | 信任与验证模式 | 信任、确认与验证机制如何设计 |
| `Refinement Patterns` | 优化迭代模式 | 用户如何追问、修改、重试与细化（新增） |
| `Output Handoff Patterns` | 输出交接模式 | 结果如何被打包以便复用、导出或交接 |
| `Failure Recovery Patterns` | 失败恢复模式 | 出错/超时/能力边界时如何解释、兜底与恢复（新增） |

**迁移映射**（旧别名 → 新值）：见 `PATTERN_CATEGORY_MIGRATION_MAP`，如 `Recovery Patterns` / `Error Recovery Patterns` → `Failure Recovery Patterns`，`Iteration Patterns` → `Refinement Patterns`。

---

## 5. Reuse Level（复用价值）

| value | 中文标签 | 说明 |
| --- | --- | --- |
| `High` | 高 | 通用且高价值，强烈建议复用 |
| `Medium` | 中 | 有条件复用，需结合产品形态与上下文 |
| `Low` | 低 | 场景特化或反面案例，参考价值有限 |

---

## 6. 旧数据迁移规则

- 历史数据、导入备份与 AI 偶发返回的旧枚举值，必须先经 migration 转换，**不允许旧值直接通过校验**。
- 迁移逻辑三处复用同一套规则：
  - 前端读取/保存：`lib/normalize.ts`（`migrateEnum` / `normalizeSecondaryStates`）
  - 导入校验：`lib/import.ts`（`z.preprocess` 预迁移）
  - 云函数：`cloudfunctions/ai-analyze-pattern`、`cloudfunctions/rebuild-records`（`mapEnum` + migration）
- 命中迁移表 → 返回新值；命中合法集合 → 原样返回；否则 → 字段 fallback。

---

## 7. 同步检查清单

修改分类体系时，必须同步以下入口（任一遗漏都会导致体系不一致）：

- [ ] `lib/types.ts` 类型定义
- [ ] `lib/constants.ts` 选项 / 标签 / 描述 / OPTIONS / 迁移表
- [ ] `lib/design-tokens.ts` 颜色映射键
- [ ] `lib/normalize.ts` / `lib/import.ts` / `lib/ai/schemas.ts` 校验与归一
- [ ] `lib/ai/prompts.ts` 与 3 个云函数的 AI Prompt（system + user）
- [ ] Capture 表单 / Record Drawer / Records 筛选 / Matrix / Journey / Library / Insights
- [ ] `lib/export.ts`（Markdown / JSON / CSV / Report）与 `lib/stats.ts`
- [ ] 本文件、`docs/design-context.md`、`README.md`
