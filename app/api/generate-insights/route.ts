import { NextResponse } from "next/server";
import { createJsonChatCompletion } from "@/lib/ai/client";
import { GENERATE_INSIGHTS_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  GenerateInsightsRequestSchema,
  GenerateInsightsResponseSchema,
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    const body = GenerateInsightsRequestSchema.parse(await request.json());
    const payload = await createJsonChatCompletion([
      {
        role: "system",
        content: GENERATE_INSIGHTS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          "以下是 Pattern Records 摘要，不包含图片数据。",
          "请基于这些结构化记录生成研究洞察，严格输出 JSON。",
          JSON.stringify(body.records, null, 2),
        ].join("\n\n"),
      },
    ]);

    const parsed = GenerateInsightsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "AI 洞察 JSON 校验失败。",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "洞察生成失败";
    const status = message.includes("AI_API_KEY") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
