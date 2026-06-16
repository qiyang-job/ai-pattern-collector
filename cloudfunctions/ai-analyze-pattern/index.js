const DEFAULT_BASE_URL = process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = process.env.AI_MODEL || "qwen-vl-max";

exports.main = async (event) => {
  try {
    const { imageDataUrl, rawNote, product, sourceUrl, taskContext } = event;

    if (!imageDataUrl) return { error: "请先上传或粘贴截图" };
    if (!rawNote) return { error: "Raw Note 是必填项" };

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return { error: "AI API 未配置", code: 503 };

    const res = await fetch(`${DEFAULT_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "你是一个资深 AI 产品体验设计研究员，专门分析 AI-native 产品的交互设计模式。根据截图和备注判断设计模式，归入分类体系，严格输出 JSON。" },
          {
            role: "user",
            content: [
              { type: "text", text: [`Raw Note: ${rawNote}`, `Product: ${product || "Unknown"}`, `Source URL: ${sourceUrl || "N/A"}`, `Task Context: ${taskContext || "N/A"}`].join("\n") },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return { error: payload.error?.message || `AI API error: ${res.status}`, code: 502 };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { error: "AI 返回内容为空", code: 502 };

    try { return JSON.parse(content); }
    catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      return { error: "AI 返回不是有效 JSON", code: 422 };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "分析失败", code: 500 };
  }
};
