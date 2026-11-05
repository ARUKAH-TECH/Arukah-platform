import "server-only";

// Text AI for the Bible app (and the flyer reader). Uses Google Gemini's free
// plan when GEMINI_API_KEY is set in Vercel, otherwise fal.ai (FAL_KEY).
// Only public content goes here (themes, Bible topics, flyers) — never
// children's work: the literacy handwriting check keeps using fal.ai only.
// Returns the parsed JSON object the model was asked for, or null.

const TEXT = "https://fal.run/openrouter/router";
const MODEL = process.env.FAL_TEXT_MODEL || "google/gemini-2.5-flash";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [...images.map((i) => ({ inlineData: { mimeType: i.mime, data: i.base64 } })), { text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: maxTokens, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) {
      console.error("[ai] gemini", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return parseJson((data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join(""));
  } catch (error) {
    console.error("[ai] gemini failed", error instanceof Error ? error.message : "error");
    return null;
  }
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
