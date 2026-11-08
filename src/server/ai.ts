import "server-only";

// Text AI for the Bible app (and the flyer reader). Uses Google Gemini's free
// plan when GEMINI_API_KEY is set in Vercel, otherwise fal.ai (FAL_KEY).
// Only public content goes here (themes, Bible topics, flyers) — never
// children's work: the literacy handwriting check keeps using fal.ai only.
// Returns the parsed JSON object the model was asked for, or null.

const TEXT = "https://fal.run/openrouter/router";
const MODEL = process.env.FAL_TEXT_MODEL || "google/gemini-2.5-flash";

// Google retires model names for new keys, so try a short list in order and
// remember the first one that answers.
const GEMINI_MODELS = [process.env.GEMINI_MODEL?.trim(), "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"].filter(
  (m, i, all): m is string => Boolean(m) && all.indexOf(m) === i,
);
let workingModel: string | null = null;

export function aiAvailable() {
  return Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.FAL_KEY?.trim());
}

function parseJson(output: string): Record<string, unknown> | null {
  try {
    return JSON.parse(output.slice(output.indexOf("{"), output.lastIndexOf("}") + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Google Gemini (free plan). Text, plus optional images as { mime, base64 }. */
export async function askGemini(system: string, prompt: string, maxTokens = 2500, images: { mime: string; base64: string }[] = []): Promise<Record<string, unknown> | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const models = workingModel ? [workingModel, ...GEMINI_MODELS.filter((m) => m !== workingModel)] : GEMINI_MODELS;
  const deadline = Date.now() + 100_000; // stop trying after ~100 s in total
  for (const model of models) {
    const left = deadline - Date.now();
    if (left < 8_000) break;
    try {
      const generationConfig: Record<string, unknown> = { temperature: 0.5, maxOutputTokens: maxTokens, responseMimeType: "application/json" };
      if (model.startsWith("gemini-2.5")) generationConfig.thinkingConfig = { thinkingBudget: 0 };
      else generationConfig.maxOutputTokens = maxTokens + 4000; // room for the model's thinking
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [...images.map((i) => ({ inlineData: { mimeType: i.mime, data: i.base64 } })), { text: prompt }] }],
          generationConfig,
        }),
        signal: AbortSignal.timeout(Math.min(60_000, left)),
      });
      if (!res.ok) {
        console.error("[ai] gemini", model, res.status, (await res.text().catch(() => "")).slice(0, 200));
        if (res.status === 401 || res.status === 403) return null; // key problem: no point trying other models
        continue; // not offered to this key, busy or rate-limited: try the next model
      }
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      const parsed = parseJson((data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join(""));
      if (parsed) {
        workingModel = model;
        return parsed;
      }
      console.error("[ai] gemini", model, "answer was not complete JSON"); // e.g. cut off: try the next model
    } catch (error) {
      console.error("[ai] gemini failed", model, error instanceof Error ? error.message : "error"); // timeout: try the next model
    }
  }
  return null;
}

export async function askJson(system: string, prompt: string, maxTokens = 2500): Promise<Record<string, unknown> | null> {
  const free = await askGemini(system, prompt, maxTokens);
  if (free) return free;
  if (!process.env.FAL_KEY?.trim()) return null;
  try {
    const res = await fetch(TEXT, {
      method: "POST",
      headers: { Authorization: `Key ${process.env.FAL_KEY!.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, system_prompt: system, prompt, temperature: 0.5, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) {
      console.error("[ai] upstream", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return null;
    }
    return parseJson(((await res.json()) as { output?: string }).output ?? "");
  } catch (error) {
    console.error("[ai] failed", error instanceof Error ? error.message : "error");
    return null;
  }
}

/** Plain text from the model: no links, images, phone numbers or emails. */
export function cleanText(value: unknown, max: number) {
  return (typeof value === "string" ? value : "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\S+@\S+\.\S+/g, "")
    .replace(/(\+?\d[\d\s-]{8,}\d)/g, "")
    .trim()
    .slice(0, max);
}
