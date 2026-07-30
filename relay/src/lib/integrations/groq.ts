// Groq is Relay's LLM provider (OpenAI-compatible /chat/completions endpoint).
// Docs: https://console.groq.com/docs/quickstart

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function groqComplete(params: {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  // Qwen reasoning is enabled by default. For JSON mode its hidden reasoning
  // can occasionally prevent Groq from validating the final JSON object, so
  // keep the Relay agents in direct, non-reasoning output mode.
  const isQwenModel = model.startsWith("qwen/");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: params.temperature ?? 0.4,
      response_format: params.json ? { type: "json_object" } : undefined,
      ...(params.json && isQwenModel ? { reasoning_effort: "none", reasoning_format: "hidden" } : {}),
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user }
      ]
    })
  });
  if (!res.ok) throw new Error(`Groq request failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}
