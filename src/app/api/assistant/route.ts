import { askGemini } from "@/server/ai";
import { matchFaq } from "@/features/support/faq";
import { ASSISTANT_SYSTEM } from "@/features/support/assistantKnowledge";
import { ASSISTANT_LINKS } from "@/features/support/assistantLinks";

// Website AI assistant (chat bubble). Nothing is stored: the conversation is
// only sent to the AI to get a reply. Falls back to the fixed FAQ answers.

const MAX_MESSAGE = 500;
const MAX_TURNS = 8;
const LIMIT = 20; // messages per visitor per 10 minutes (per server instance)
const WINDOW = 10 * 60_000;
const hits = new Map<string, number[]>();

function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

type Turn = { role: "user" | "bot"; text: string };

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip)) {
    return Response.json({ reply: "You've sent many messages in a short time. Please continue with us on WhatsApp.", links: ["/contact"], whatsapp: "Hello ZIVARUKAH, " });
  }

  let turns: Turn[] = [];
  try {
    const body = (await request.json()) as { messages?: unknown };
    if (Array.isArray(body.messages)) {
      turns = body.messages
        .filter((m): m is Turn => !!m && typeof m === "object" && ((m as Turn).role === "user" || (m as Turn).role === "bot") && typeof (m as Turn).text === "string")
        .slice(-MAX_TURNS)
        .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE) }));
    }
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const question = turns.at(-1);
  if (!question || question.role !== "user" || !question.text.trim()) return Response.json({ error: "bad request" }, { status: 400 });

  const conversation = turns.map((t) => `${t.role === "user" ? "Visitor" : "Assistant"}: ${t.text}`).join("\n");
  let result: Record<string, unknown> | null = null;
  try {
    result = await askGemini(ASSISTANT_SYSTEM, `Conversation so far:\n${conversation}\n\nWrite the assistant's next reply.`, 600);
  } catch {
    result = null;
  }

  const reply = typeof result?.reply === "string" ? result.reply.trim().slice(0, 1200) : "";
  if (!reply) {
    return Response.json({ reply: matchFaq(question.text), links: [], whatsapp: "", fallback: true });
  }
  const links = Array.isArray(result?.links) ? (result.links as unknown[]).filter((l): l is string => typeof l === "string" && l in ASSISTANT_LINKS).slice(0, 2) : [];
  const whatsapp = typeof result?.whatsapp === "string" ? result.whatsapp.trim().slice(0, 300) : "";
  return Response.json({ reply, links, whatsapp });
}
