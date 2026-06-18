import { NextResponse } from "next/server";
import { createInsightsJsonChatCompletion } from "@/lib/ai/client";
import { GENERATE_INSIGHTS_SYSTEM_PROMPT, buildInsightsUserText } from "@/lib/ai/prompts";
import {
  GenerateInsightsRequestSchema,
  GenerateInsightsResponseSchema,
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    const body = GenerateInsightsRequestSchema.parse(await request.json());
    const payload = await createInsightsJsonChatCompletion([
      {
        role: "system",
        content: GENERATE_INSIGHTS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildInsightsUserText(body.records),
      },
    ]);

    const parsed = GenerateInsightsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "AI 洞察 JSON 校验失败，请重新生成。",
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
