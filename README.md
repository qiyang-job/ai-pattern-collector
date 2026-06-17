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

## Data Storage

Records are stored in browser IndexedDB via Dexie. Refreshing the page does not remove saved records. MVP stores screenshots as `imageDataUrl`; future versions can migrate images to object storage or cloud database tables.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
