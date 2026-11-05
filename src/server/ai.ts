import "server-only";

// Text AI through fal.ai's OpenRouter router (same FAL_KEY as the flyer
// reader and the literacy handwriting check). Returns the parsed JSON object
// the model was asked for, or null.

const TEXT = "https://fal.run/openrouter/router";
const MODEL = process.env.FAL_TEXT_MODEL || "google/gemini-2.5-flash";

export function aiAvailable() {
  return Boolean(process.env.FAL_KEY?.trim());
}

export async function askJson(system: string, prompt: string, maxTokens = 2500): Promise<Record<string, unknown> | null> {
  if (!aiAvailable()) return null;
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
    const output = ((await res.json()) as { output?: string }).output ?? "";
    return JSON.parse(output.slice(output.indexOf("{"), output.lastIndexOf("}") + 1)) as Record<string, unknown>;
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
