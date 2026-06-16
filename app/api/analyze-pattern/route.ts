import { NextResponse } from "next/server";
import { createJsonChatCompletion } from "@/lib/ai/client";
import { ANALYZE_PATTERN_SYSTEM_PROMPT, buildAnalyzeUserText } from "@/lib/ai/prompts";
import {
  AnalyzePatternRequestSchema,
  AnalyzePatternResponseSchema,
  normalizeAnalyzePayload,
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    const body = AnalyzePatternRequestSchema.parse(await request.json());
    const payload = await createJsonChatCompletion([
      {
        role: "system",
        content: ANALYZE_PATTERN_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildAnalyzeUserText({
              product: body.product,
              rawNote: body.rawNote,
              taskContext: body.taskContext,
              sourceUrl: body.sourceUrl,
            }),
          },
          {
            type: "image_url",
            image_url: {
              url: body.imageDataUrl,
            },
          },
        ],
      },
    ]);

    // 枚举映射 + 评分归一化，再做严格校验
    const normalized = normalizeAnalyzePayload(payload as Record<string, unknown>);
    const parsed = AnalyzePatternResponseSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "AI 返回 JSON 校验失败，请重新分析或手动补全。",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "分析失败";
    const status = message.includes("AI_API_KEY") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
