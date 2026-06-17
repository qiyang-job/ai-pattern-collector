# AI Pattern Collector

AI Pattern Collector is a local-first research tool for turning AI product screenshots into structured, searchable, comparable, reusable design pattern records.

Core loop:

```text
Screenshot → Evidence → Pattern → Classification → Matrix → Insight → Design Decision
```

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## CloudBase Deployment

- **Environment ID**: `patterncollector-d6e3o08821ba3ee`
- **Region**: `ap-shanghai`
- **Frontend URL**: https://patterncollector-d6e3o08821ba3ee-1313643153.tcloudbaseapp.com/
- **Cloud Functions**:
  - `ai-analyze-pattern` — 截图 AI 分析 (Node.js 18.15)
  - `ai-generate-insights` — 洞察生成 (Node.js 18.15)
- **Console**: https://tcb.cloud.tencent.com/dev?envId=patterncollector-d6e3o08821ba3ee#/overview

## Environment Variables

The app calls AI only from server-side API routes. `AI_API_KEY` is never read by the frontend.

```env
AI_API_KEY=
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-vl-max
```

Defaults:

- `AI_BASE_URL`: `https://api.openai.com/v1`
- `AI_MODEL`: `qwen-vl-max`

Recommended Chinese OpenAI-compatible vision models:

- `qwen-vl-max` for higher-quality screenshot analysis.
- `qwen-vl-plus` for lower-cost MVP testing.
- `glm-4v-plus` as an alternative provider option.

OpenAI users can set:

```env
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

## MVP Features

- Capture page with Cmd + V / Ctrl + V screenshot paste, drag-and-drop, upload, preview, AI analysis, manual editing, and local save.
- Records page with search, filters, detail drawer, edit, delete, Markdown copy, and single JSON export.
- Matrix page for Product Category × Journey Stage coverage.
- Journey page for J-01 to J-09 dynamic stage analysis.
- Library page grouped by Pattern Category with evidence screenshots.
- Insights page with local statistics and AI-generated research insights.
- Export page for JSON, CSV, and Markdown research reports.

## Taxonomy

分类体系是本系统的核心方法论框架，五个核心字段职责严格区分：

- **Product Category**（产品形态）：`AI Chat` · `AI Search` · `AI Agent` · `AI Workspace` · `Coding Agent`
- **Journey Stage**（用户路径）：`J-01` ～ `J-09`
- **Screenshot State**（界面状态，14 项）：`Idle` · `Inputting` · `Context Ready` · `Thinking` · `Planning Ready` · `Running` · `Waiting Approval` · `Streaming` · `Reviewing` · `Error` · `Completed` · `Follow-up Ready` · `Export Ready` · `Unknown`
  - 配套 `secondaryScreenshotStates`（次要状态，多选）与 `screenshotStateReason`（判定理由）
- **Pattern Category**（模式分类，8 类）：Intent Input · Context Management · Planning & Reasoning · Execution Feedback · Trust & Verification · **Refinement** · Output Handoff · **Failure Recovery**
- **Reuse Level**（复用价值）：`High` · `Medium` · `Low`

完整定义、判定线索与旧值迁移规则见 [`docs/taxonomy.md`](docs/taxonomy.md)。代码层唯一数据源为 [`lib/constants.ts`](lib/constants.ts)。

## Data Storage

Records are stored in browser IndexedDB via Dexie. Refreshing the page does not remove saved records. MVP stores screenshots as `imageDataUrl`; future versions can migrate images to object storage or cloud database tables.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
