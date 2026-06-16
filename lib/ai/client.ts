const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "qwen-vl-max";

type MessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

type ChatMessage = {
  role: "system" | "user";
  content: MessageContent;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export function getAiConfig() {
  return {
    apiKey: process.env.AI_API_KEY ?? "",
    baseUrl: process.env.AI_BASE_URL || DEFAULT_BASE_URL,
    model: process.env.AI_MODEL || DEFAULT_MODEL,
  };
}

export async function createJsonChatCompletion(messages: ChatMessage[]) {
  const { apiKey, baseUrl, model } = getAiConfig();

  if (!apiKey) {
    throw new Error("AI_API_KEY 未配置。请在 .env.local 中填写服务端 API Key。");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `AI API 请求失败：HTTP ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI API 没有返回可解析内容。");
  }

  return parseJsonContent(content);
}

function parseJsonContent(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI 返回内容不是严格 JSON。");
    }
    return JSON.parse(match[0]);
  }
}
