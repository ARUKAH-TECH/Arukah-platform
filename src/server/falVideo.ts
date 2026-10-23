import "server-only";

// fal.ai image-to-video, using Kling 2.6 Pro (about US$0.07 per second with
// sound off at the time of writing — a 5-second clip is roughly $0.35).
// Docs: https://fal.ai/models/fal-ai/kling-video/v2.6/pro/image-to-video/api
// Queue API: https://fal.ai/docs/documentation/model-apis/inference/queue
//
// FAL_KEY is a server-only secret set in Vercel's environment variables.
// It is never sent to the browser and never committed to git.

const MODEL = "fal-ai/kling-video/v2.6/pro/image-to-video";
const QUEUE = "https://queue.fal.run";

export function aiVideoConfigured() {
  return Boolean(process.env.FAL_KEY);
}

function headers() {
  return { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" };
}

/** Only ever call fal's own queue URLs (they come back from fal and are stored). */
function assertFalUrl(url: string) {
  if (!url.startsWith(`${QUEUE}/`)) throw new Error("Unexpected provider address.");
}

export async function submitImageToVideo(imageUrl: string, prompt: string) {
  if (!aiVideoConfigured()) throw new Error("AI video isn't set up yet.");
  const response = await fetch(`${QUEUE}/${MODEL}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      prompt,
      start_image_url: imageUrl,
      duration: "5",
      generate_audio: false,
      negative_prompt: "blur, distort, low quality, warped text, extra limbs",
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`The AI service refused the request (${response.status}). ${detail.slice(0, 200)}`);
  }
  const data = (await response.json()) as { status_url?: string; response_url?: string };
  if (!data.status_url || !data.response_url) throw new Error("The AI service didn't return a job.");
  assertFalUrl(data.status_url);
  assertFalUrl(data.response_url);
  return { statusUrl: data.status_url, responseUrl: data.response_url };
}

/** "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" (or an error). */
export async function getJobStatus(statusUrl: string): Promise<string> {
  assertFalUrl(statusUrl);
  const response = await fetch(statusUrl, { headers: headers(), cache: "no-store" });
  if (!response.ok) throw new Error(`Couldn't check the AI job (${response.status}).`);
  const data = (await response.json()) as { status?: string };
  return data.status ?? "UNKNOWN";
}

/** Downloads the finished MP4 (from fal's CDN) so we can keep our own copy. */
export async function fetchFinishedVideo(responseUrl: string): Promise<Blob> {
  assertFalUrl(responseUrl);
  const response = await fetch(responseUrl, { headers: headers(), cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`The AI video failed (${response.status}). ${detail.slice(0, 200)}`);
  }
  const data = (await response.json()) as { video?: { url?: string } };
  const videoUrl = data.video?.url;
  if (!videoUrl || !videoUrl.startsWith("https://")) throw new Error("The AI service returned no video.");
  const file = await fetch(videoUrl, { cache: "no-store" });
  if (!file.ok) throw new Error("Couldn't download the finished video.");
  const blob = await file.blob();
  if (blob.size > 50 * 1024 * 1024) throw new Error("The video is larger than 50 MB.");
  return blob;
}
