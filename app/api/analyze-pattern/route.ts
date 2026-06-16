import { NextResponse } from "next/server";
import { createJsonChatCompletion } from "@/lib/ai/client";
import { ANALYZE_PATTERN_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  AnalyzePatternRequestSchema,
  AnalyzePatternResponseSchema,
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
            text: [
              `Raw Note: ${body.rawNote}`,
              `Product: ${body.product || "Unknown"}`,
              `Source URL: ${body.sourceUrl || "N/A"}`,
              `Task Context: ${body.taskContext || "N/A"}`,
              "请根据截图和上下文完成 AI 产品设计模式分析，并严格输出 JSON。",
            ].join("\n"),
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

    const parsed = AnalyzePatternResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "AI 返回 JSON 校验失败。",
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
