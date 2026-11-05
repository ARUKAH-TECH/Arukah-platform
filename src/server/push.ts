import "server-only";
import { createPrivateKey, generateKeyPairSync, sign, type JsonWebKey } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { getDevotional } from "@/db/bible";
import { getPassage, todayInGhana, verseOfTheDay } from "@/server/bible";

// Daily devotional notifications for R.O.M Bible Guide (standard web push).
// The push carries no data: the phone wakes up, asks /api/bible/today for
// the day's devotional and scripture, and shows it. So nothing personal is
// sent anywhere, and no third-party service or extra package is needed.
// The site's key pair is made here on first use and kept in the database
// (service key only), so no secret has to be copied by hand.

const SITE = process.env.SITE_URL || "https://zivarukah.com";

// Only real browser push services (stops the server being pointed elsewhere).
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/, /^web\.push\.apple\.com$/];

export function validEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(url.hostname));
  } catch {
    return false;
  }
}

const b64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

interface Keys {
  publicKey: string;
  privateJwk: JsonWebKey;
}

let cached: Keys | null = null;

/** The site's VAPID key pair (made once, then reused). */
export async function pushKeys(): Promise<Keys | null> {
  if (cached) return cached;
  const client = createServiceClient();
  const read = async () => {
    const { data } = await client.from("push_keys").select("public_key, private_jwk").eq("id", 1).maybeSingle();
    return data ? { publicKey: data.public_key as string, privateJwk: data.private_jwk as JsonWebKey } : null;
  };
  let keys = await read();
  if (!keys) {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const jwk = privateKey.export({ format: "jwk" });
    const publicKey = b64url(Buffer.concat([Buffer.from([4]), fromB64url(jwk.x!), fromB64url(jwk.y!)]));
    await client.from("push_keys").insert({ id: 1, public_key: publicKey, private_jwk: jwk });
    keys = await read(); // if two requests raced, both use the saved pair
  }
  cached = keys;
  return keys;
}

function vapidHeader(endpoint: string, keys: Keys) {
  const header = b64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SITE })));
  const key = createPrivateKey({ key: keys.privateJwk, format: "jwk" });
  const signature = sign("sha256", Buffer.from(`${header}.${payload}`), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${header}.${payload}.${b64url(signature)}, k=${keys.publicKey}`;
}

/** Wakes one phone. Returns the push service's status code (0 = network error). */
async function wake(endpoint: string, keys: Keys) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: vapidHeader(endpoint, keys), TTL: String(18 * 3600), Urgency: "high" },
      signal: AbortSignal.timeout(10_000),
    });
    return res.status;
  } catch {
    return 0;
  }
}

/** Today's notification text: the devotional and its scripture, or the verse of the day. */
export async function todaysNotification() {
  const day = todayInGhana();
  const devotional = await getDevotional(day);
  if (devotional) {
    const ref = devotional.verseRef?.split(/[;\n]/)[0]?.trim() ?? "";
    const passage = ref ? await getPassage(ref) : null;
    const words = passage ? passage.verses.map((v) => v.text).join(" ") : "";
    const verse = words ? `“${words.length > 150 ? `${words.slice(0, 150).replace(/\s+\S*$/, "")}…` : words}” (${passage!.label})` : ref;
    return { title: `🌅 ${devotional.title}`, body: verse ? `${verse}\nTap to read today's devotional.` : "Tap to read today's devotional.", url: `/bible/devotionals/${day}`, day, devotional: true };
  }
  const passage = await verseOfTheDay(day);
  const words = passage ? passage.verses.map((v) => v.text).join(" ") : "";
  return {
    title: "📖 R.O.M Bible Guide: verse of the day",
    body: passage ? `“${words}” (${passage.label} KJV)` : "Open the Bible guide for today's word.",
    url: "/bible",
    day,
    devotional: false,
  };
}

async function wakeAll(keys: Keys) {
  const client = createServiceClient();
  const { data: rows } = await client.from("bible_push").select("endpoint").limit(5000);
  const endpoints = (rows ?? []).map((r) => r.endpoint as string);
  let sent = 0;
  let failed = 0;
  const gone: string[] = [];
  for (let i = 0; i < endpoints.length; i += 25) {
    const batch = endpoints.slice(i, i + 25);
    const results = await Promise.all(batch.map((e) => wake(e, keys)));
    results.forEach((status, j) => {
      if (status >= 200 && status < 300) sent++;
      else {
        failed++;
        if (status === 404 || status === 410) gone.push(batch[j]); // phone unsubscribed
      }
    });
  }
  if (gone.length) await client.from("bible_push").delete().in("endpoint", gone);
  return { sent, failed, removed: gone.length };
}

/** For Admin: how many phones get the notification, and the last days sent. */
export async function pushStats() {
  const client = createServiceClient();
  const [{ count }, { data: log }] = await Promise.all([
    client.from("bible_push").select("endpoint", { count: "exact", head: true }),
    client.from("bible_push_log").select("day, sent, failed").order("day", { ascending: false }).limit(5),
  ]);
  return { phones: count ?? 0, log: (log ?? []) as { day: string; sent: number; failed: number }[] };
}

/** Admin test: sends today's notification to every subscribed phone now (doesn't use up the daily send). */
export async function sendTestNotification() {
  const keys = await pushKeys();
  if (!keys) return null;
  return wakeAll(keys);
}

/**
 * Sends today's notification to every phone that asked for it — once a day.
 * Waits for the day's devotional until 6:35am, then sends anyway (verse of the day).
 */
export async function sendDailyNotification(now = new Date()) {
  if (now.getUTCHours() < 6) return { status: "too-early" };
  const note = await todaysNotification();
  const late = now.getUTCHours() > 6 || now.getUTCMinutes() >= 35;
  if (!note.devotional && !late) return { status: "waiting-for-devotional" };

  const client = createServiceClient();
  // Claim the day first, so two runs never both send.
  const { error: claim } = await client.from("bible_push_log").insert({ day: note.day });
  if (claim) return { status: claim.code === "23505" ? "already-sent" : "log-failed" };

  const keys = await pushKeys();
  if (!keys) return { status: "no-keys" };
  const { sent, failed, removed } = await wakeAll(keys);
  await client.from("bible_push_log").update({ sent, failed }).eq("day", note.day);
  return { status: "sent", sent, failed, removed };
}
