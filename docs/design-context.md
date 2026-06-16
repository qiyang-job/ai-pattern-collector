# AI Pattern Collector Design Context

## 0. 项目定位

AI Pattern Collector 是一个面向 AI 产品设计师、产品体验设计师、交互设计师和设计研究者的 **AI 产品设计模式研究系统**。

它的目标不是保存截图，而是帮助用户完成：

> Screenshot → Evidence → Pattern → Classification → Matrix → Insight → Design Decision

也就是说，它要把零散的 AI 产品截图，转化为结构化、可检索、可对比、可评分、可复用的 AI 产品设计模式知识库。

这个产品不是：

- 普通截图管理工具
- 普通笔记工具
- 普通 AI SaaS Dashboard
- 通用后台管理系统
- 静态画布工具
- 营销展示页

这个产品是：

- Evidence 证据采集系统
- Pattern 模式抽象系统
- Design Lens 分析评分系统
- Matrix 对比系统
- Journey 研究地图
- Pattern Library 模式库
- Insight 洞察生成系统

产品气质应该是：

> 专业、克制、清晰、高密度、有研究感、有数据库感、有设计系统文档感。

视觉风格采用 **Editorial Lab Terminal（科研终端）** 这一暗色设计语言：深蓝黑画布 + 克制琥珀金主强调 + 电光青数据高亮，标题用衬线显示字体（编辑/学术气质），ID 与数字用等宽字体（标本编号感）。整体像一台克制而高级的实验仪表盘，而非花哨的 AI 工具。详见第 7 节。

---

## 1. 核心用户任务

用户进入产品后，不是在「填写表单」，而是在完成一个研究工作流：

1. 采集一张 AI 产品截图
2. 说明这张截图为什么值得研究
3. 让 AI 从截图和备注中提炼设计模式
4. 人工校对 AI 分析结果
5. 保存为 Pattern Record
6. 自动进入 Matrix / Journey / Library / Insights
7. 最终形成可复用的设计判断

任何页面、组件、字段和交互，都应该服务这条主线。

如果某个 UI 只是在展示字段，但没有帮助用户理解「我现在要做什么判断」，那就是设计失败。

---

## 2. 产品核心链路

请始终围绕这条链路设计：

```txt
Capture Evidence
  ↓
Extract Pattern
  ↓
Review Pattern
  ↓
Save Record
  ↓
Map to Matrix / Journey / Library
  ↓
Generate Insights
  ↓
Support Design Decision
```

不要把 UI 做成普通 CRUD 系统。

用户不是在维护数据库字段，而是在建立一套 AI 产品体验设计模式知识库。

---

## 3. 数据层设计心智

系统中有四层数据。

### 3.1 Evidence Layer

原始证据层。

代表用户采集到的原始材料：

- Screenshot ID：S-001
- Screenshot Image
- Research Note
- Product
- Task Context
- Source URL
- Created Time

Evidence 是一切分析的来源。

UI 中要让用户明确理解：这张截图是后续 Pattern 判断的证据，而不是普通图片。

### 3.2 Pattern Layer

模式抽象层。

AI 和用户一起从 Evidence 中提炼出：

- Pattern ID：P-001
- Pattern Name
- User Problem
- AI Capability
- UI Anatomy
- Interaction Rule
- System Feedback
- Trust Mechanism
- Failure Handling
- Reuse Level
- Design Judgment

UI 中要避免让这些字段像普通后台表单。

每个字段都应该回答一个设计研究问题。例如：

- User Problem：这个模式解决了用户什么不确定性？
- AI Capability：这里暴露了 AI 的什么能力？
- Trust Mechanism：界面如何让用户相信 AI 的过程或结果？
- Design Judgment：这个模式是否值得复用，为什么？

### 3.3 Classification Layer

分类映射层。

把 Pattern 放入固定研究框架：

- Product Category
- Journey Stage
- Screenshot State
- Pattern Category
- Lens Score

这一层决定记录会进入 Matrix、Journey、Library、Insights。

UI 中要让用户理解：分类不是为了填字段，而是为了让记录能被比较、归纳和复用。

### 3.4 Insight Layer

洞察层。

基于多个 Pattern 生成：

- 高频模式
- 高复用价值模式
- 产品类型差异
- 用户阶段成熟度
- 体验机会点
- 设计建议
- 研究报告

这一层是产品长期价值的核心。

---

## 4. 固定研究框架

所有设计必须围绕以下研究框架。

### 4.1 Product Category

- AI Chat
- AI Search
- Agent Task
- AI Workspace
- Coding Agent

### 4.2 Journey Stage

- J-01 Entry
- J-02 Intent Capture
- J-03 Context Building
- J-04 Planning
- J-05 Execution
- J-06 Feedback
- J-07 Verification
- J-08 Refinement
- J-09 Handoff

其中 J-03 Context Building、J-04 Planning、J-05 Execution、J-06 Feedback、J-07 Verification 是 AI 产品区别于传统产品的核心阶段，视觉上可以适度强调。

### 4.3 Screenshot State

Default · Input Assist · Context Attach · Plan Preview · Tool Call · Human Approval · Partial Result · Error Recovery · Final Result · Follow-up · Export / Handoff

### 4.4 Pattern Category

- Intent Input Patterns
- Context Management Patterns
- Planning & Reasoning Patterns
- Execution Feedback Patterns
- Trust & Verification Patterns
- Output Handoff Patterns

### 4.5 Analysis Lens

评分规则：0 = Not visible · 1 = Weak · 2 = Usable · 3 = Excellent

维度：

- L-01 Intent Clarity
- L-02 Context Visibility
- L-03 Process Transparency
- L-04 User Control
- L-05 Trust Building
- L-06 Error Recoverability
- L-07 Output Usability
- L-08 Reusability

---

## 5. 全局体验原则

### 5.1 先任务，后字段

不要直接把数据结构铺成表单。

每个页面都要先回答：

- 用户现在要完成什么任务？
- 用户要做什么判断？
- 系统应该告诉用户什么？
- 用户如何知道自己能进入下一步？

再决定字段如何呈现。

**错误做法：** 展示 Product Category、Journey Stage、Pattern Category 字段。

**正确做法：** 让用户确认这条记录会进入 Matrix 和 Journey 的哪个位置。

### 5.2 渐进披露

不要在用户还没完成前置步骤时，把后面所有表单全部摊开。

尤其是 Capture 页面：

- 没有截图时，不应显示完整 Review 表单
- 没有 Research Note 时，不应允许 AI 分析
- 没有 AI 分析结果时，不应强调 Save
- 分析完成后，才展开 Review 表单
- 保存前，展示 Record Preview

### 5.3 状态必须可解释

每个核心状态都必须告诉用户：

- 当前处于哪一步
- 已经完成什么
- 还缺什么
- 下一步可以做什么
- 为什么不能继续

不要只显示 Empty / Not analyzed / Review required。

要显示 Missing screenshot / Missing research note / Ready to extract / Extracting pattern / Needs review / Ready to save / Saved。

### 5.4 空状态也要展示产品框架

不要让页面只有一句空提示。

**错误：** Matrix is empty. Go to Capture.

**正确：**

- Matrix 页面即使没有数据，也要展示 5 × 9 空矩阵骨架
- Journey 页面即使没有数据，也要展示 J-01 到 J-09 流程轴
- Library 页面即使没有数据，也要展示 6 类 Pattern Category
- Insights 页面即使没有数据，也要展示研究报告骨架
- Export 页面即使没有数据，也要展示导出控制台结构

空状态的职责不是「说明没数据」，而是「解释这个视图未来会产生什么价值」。

---

## 6. 页面设计原则

### 6.1 Capture 页面

Capture 是最关键页面。它不是上传表单，而是把一张截图转化为 Pattern Record 的采集流水线。

核心流程：Capture Evidence → Extract Pattern → Review Pattern → Save Record

**页面应该包含**

**顶部：Capture Pipeline**

显示 Step 1 Evidence → Step 2 Extract → Step 3 Review → Step 4 Saved

每一步显示状态：

- Evidence: Missing screenshot / Missing note / Ready
- Extract: Not started / Ready / Extracting / Completed / Failed
- Review: Locked / Needs review / Ready to save
- Saved: Not saved / Saved

顶部必须有当前任务说明，例如：Current task: Paste a screenshot and describe the interaction worth studying. 任务说明应随状态变化。

**左侧：Evidence Composer**

包含：Screenshot Evidence · Research Note · Product · Task Context · Advanced Context / Source URL

Screenshot Evidence 要设计成 Evidence Slot，不是普通上传框。

Research Note 是核心输入。推荐 placeholder：

> 用一句话说明这张截图中值得研究的交互。例如：Cursor 在执行代码修改前展示将修改的文件，并要求用户确认。

推荐写法：`[产品] 在 [用户阶段] 通过 [界面机制] 帮用户 [解决问题]`

**右侧：Pattern Extraction Workspace**

右侧不是固定表单，而是状态驱动工作区（未准备好 → 准备好 → 分析中 → 失败 → Review）。

Review 表单分为：A. Classification · B. Pattern Identity · C. Experience Diagnosis · D. Trust & Recovery · E. Lens Score & Reuse

保存前必须显示 Record Preview。保存按钮只有在关键字段齐全后才可用。

### 6.2 Records 页面

Records 是 Pattern 数据库，不是卡片墙。必须使用高密度 Data Table。

列建议：Evidence · Pattern · Product · Category · Stage · State · Reuse · Lens Avg · Tags · Updated

交互：搜索 · 筛选 · 点击行打开右侧 Inspector · 编辑 · 删除 · 复制 Markdown

### 6.3 Matrix 页面

Matrix 是核心方法论视图。必须始终展示 Product Category × Journey Stage（5 × 9）。

即使没有数据，也必须显示空矩阵骨架。

每个单元格显示：Pattern count · Screenshot count · Top Pattern Names · Avg Reusability · Representative Products

### 6.4 Journey 页面

Journey 是用户流程研究地图。即使没有数据，也要展示 J-01 到 J-09 旅程轴。

J-03 到 J-07 应该组成 Core AI Interaction Band。点击阶段后，下方展示该阶段相关 Records。

### 6.5 Library 页面

Library 是模式库。必须始终展示 6 类 Pattern Category。每条 Pattern 必须能追溯 Evidence Screenshot。

### 6.6 Insights 页面

Insights 是研究报告生成器。即使没有数据，也要展示报告骨架与采集规模提示（5+ / 15+ / 30+ records）。

### 6.7 Export 页面

Export 是导出控制台。即使没有数据，也要展示格式、范围、预览结构。无数据时按钮 disabled。

---

## 7. 全局 UI 风格约束

> 设计语言：**Editorial Lab Terminal（科研终端）**。暗色画布、克制琥珀金、电光青数据高亮、衬线标题 + 等宽编号。整体是一台高级实验仪表盘的气质，而非花哨 AI 工具或浅色后台。

### 7.1 视觉气质

**应该像：** 专业设计研究工具 · 结构化知识库 · 暗色数据工作台 · 模式分析系统 · 设计系统文档 · 科研/实验仪表盘 · 编辑式研究报告

**不应该像：** 普通 SaaS Dashboard · 后台管理系统模板 · 营销落地页 · 大圆角卡片集合 · 玻璃拟态 AI 工具 · 花哨数据大屏 · 紫蓝渐变 / 霓虹 AI 套路风

### 7.2 Layout

- 左侧窄导航（含品牌标识 + 工作流导航 + 底部覆盖度仪表）
- 顶部状态 / 标题 / 当前任务（磨砂玻璃 sticky 页头）
- 主区域高密度工作台
- 右侧 Inspector / Workspace
- 表格、矩阵、列表优先
- 避免大面积空白与低密度卡片堆叠
- 页头允许放大字号、非对称左对齐排版，增强编辑式呼吸感

### 7.3 Spacing

基础间距仍保持紧凑节奏：4 / 8 / 12 / 16 / 24。
页头与分区间距采用 `clamp()` 流体间距（如 `--page-gutter` / `--section-gap`），在大屏上适度放松呼吸感。

- 表格行高：约 44px（td padding 11px）
- 输入框高度：36px
- 按钮高度：32–36px
- 面板 padding：16px
- 分区间距：18–28px（流体）

### 7.4 Radius

小控件 5px · 输入框/按钮/标签 8px · 面板 12px。圆角整体略大于旧规范，但仍克制；禁止超大圆角（≥16px）卡片墙。

### 7.5 Border & Shadow

优先细线和背景层级（panel / panel-muted / panel-raised 多层暗色叠加）。1px border · 细发光/强调边框 · 克制阴影（`--shadow-sm/md/lg`）· 页头与遮罩可用磨砂玻璃（backdrop blur）。不用厚重投影、不用浅色玻璃拟态卡片墙。

### 7.6 Color

暗色 token 体系（深蓝黑底 + 琥珀金强调 + 电光青数据）：

```txt
Background: #0E1116        /* 深蓝黑画布，非纯黑、带蓝调 */
Panel: #161A21
Panel Muted: #1C212A
Panel Raised: #20262F
Border: #2A313C
Border Strong: #3A424F
Text: #EEF1F5
Muted Text: #9AA3B1
Weak Text: #646D7C
Accent (Amber): #E0A64A    /* 主强调：克制琥珀金 */
Accent Strong: #F0B760
Accent Muted: rgba(224,166,74,0.13)
Data (Cyan): #4FC4CF       /* 数据高亮：电光青 */
Data Muted: rgba(79,196,207,0.12)
Success: #5BBF7A
Warning: #E0A64A
Danger: #E06A52
```

颜色只用于状态、分类、当前选中、关键操作与数据高亮。琥珀金用于主操作与当前选中，电光青用于数据/进行中状态。**禁止**大面积渐变、霓虹光效或彩色装饰。分类标签在暗底上用「半透明色块 + 亮文字」，不要亮色块。

### 7.7 Typography

三层字体各司其职：

- **显示/标题** → `Newsreader` 衬线（编辑/学术气质）
- **正文/界面** → 系统无衬线（`--font-sans`）
- **ID / 编号 / 数据** → `IBM Plex Mono`（标本编号感）

字号层级：

- 页面标题：clamp(28–40px) / 衬线 / 500（`.display-serif`）
- 分区标题：16px / 衬线
- 正文：13–14px / 400
- 说明文字：12–13px / 400
- 标签 / kicker：9–11px / mono / 大字距大写
- 编号、统计数字：等宽 mono，可适度放大强化层级

ID、编号、kicker、表头、数据使用 mono 字体。标题使用衬线显示字体，但不要做营销式巨型 Hero 标题。

---

## 8. 核心组件规范

### 8.1 ID Badge

用于 S-001 · P-001 · J-03 · L-01。mono · 10–12px · 细边框 · 暗色半透明背景 · 圆角 5px · padding 2px 6px。按类型着色：evidence 用中性暗块、pattern 用琥珀金、stage 用电光青、lens 用中性灰，均为「半透明色块 + 亮文字」。

### 8.2 Status Tag

状态文案必须具体。用 Missing screenshot / Ready to extract / Needs review，而不是 Empty。

### 8.3 Category Tag

暗底专用配色：半透明色块 + 亮文字 · 小尺寸 · 低饱和 · 不要亮色块 · 不要花哨渐变。

### 8.4 Lens Score Control

使用 0/1/2/3 segmented control 或 4 个小点，并显示评分解释。

### 8.5 Evidence Thumbnail

统一规格 48×32 · 64×40 · 96×60。object-fit cover · 1px border · 4px radius · hover 可放大预览。

### 8.6 Inspector / Drawer

Record Detail 使用右侧 Inspector，分组：Evidence · Classification · Pattern Analysis · Lens Score · Design Judgment。优先抽屉，不要巨大 modal。

---

## 9. 语言策略

默认中文主界面，英文作为辅助标签。

推荐：采集证据 Evidence · 研究备注 Research Note · 提炼模式 Extract Pattern · 校对并保存 Review & Save

不要机械写成「产品 Product」「来源链接 Source URL」。中文主标签，英文小字辅助。

关键方法论术语可保留英文：Evidence · Pattern · Matrix · Journey · Insight · Lens Score。必须保证整体一致。

---

## 10. 交互状态要求

所有关键操作必须有状态反馈：paste/upload success/failure · missing required fields · ready to extract · extracting · extraction failed/completed · ready to save · save success · delete confirm · export success · API key missing · JSON validation failed

失败时不得清空用户输入。

---

## 11. 禁止事项

不要做：通用 SaaS Dashboard · 大圆角卡片墙 · 渐变 Hero · 紫蓝渐变 / 霓虹 AI 套路风 · 浅色玻璃拟态卡片墙 · 厚重投影 · 彩色 KPI 块 / 亮色块标签 · 花哨插画 · 低密度布局 · 默认浏览器表单感 · 空白页 + 一句空提示 · 把所有字段一次性摊开 · 未完成前置步骤就强调 Save · 用数据结构直接决定 UI

---

## 12. 判断一个设计是否正确

每次修改 UI 前，先回答：

1. 用户当前要完成什么任务？
2. 用户现在处于哪个阶段？
3. 用户知道还缺什么吗？
4. 用户知道下一步该点哪里吗？
5. 用户知道为什么要填这些字段吗？
6. 用户知道 AI 会生成什么吗？
7. 用户知道保存后记录会进入哪里吗？
8. 页面是否展示了产品方法论结构？
9. 空状态是否有教育价值？
10. 这个设计是否像专业研究工具，而不是后台表单？

如果答案不清楚，不要继续写 UI。

---

## 13. Cursor 工作要求

后续修改时，请遵守：

1. 不要只按字段生成表单
2. 先理解用户任务，再设计界面
3. 保持 Evidence → Pattern → Insight 的主链路
4. 保持 Matrix / Journey / Library 的方法论结构可见
5. 空状态必须展示结构骨架
6. Capture 页面必须是任务流，不是 CRUD 表单
7. 任何新增页面都必须符合本 Design Context
8. 任何重构不得破坏数据结构和核心链路
9. 如果 UI 变成普通后台，请主动纠偏
10. 每次大改前，先说明改动如何服务用户任务

**强约束：**

> 后续所有 UI 和交互修改都必须先读取并遵守本文档（`/docs/design-context.md`）。不要再按普通后台表单或 SaaS Dashboard 的方式生成界面。
