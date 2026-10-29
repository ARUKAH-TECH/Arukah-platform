"use client";

import { useActionState } from "react";
import { checkAiVideo, startAiVideo, useAiVideo } from "@/features/admin/cms/adRequestActions";
import { initialCmsFormState, type CmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

interface AiVideoPanelProps {
  id: string;
  configured: boolean;
  hasImage: boolean;
  status: string;
  prompt: string;
  error: string;
  videoUrl: string | null;
  inUse: boolean;
  suggestedPrompt: string;
}

function Message({ state }: { state: CmsFormState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={state.status === "error" ? "text-xs text-red-700 dark:text-red-400" : "text-xs text-green-700 dark:text-green-400"}
    >
      {state.message}
    </p>
  );
}

export function AiVideoPanel(props: AiVideoPanelProps) {
  const [startState, startAction, starting] = useActionState(startAiVideo, initialCmsFormState);
  const [checkState, checkAction, checking] = useActionState(checkAiVideo, initialCmsFormState);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-zinc-900">
      <h2 className="font-semibold">AI video</h2>
      <p className="mt-1 text-xs text-foreground/60">
        Turns the advert&apos;s image into a 5-second video with AI (fal.ai · Kling 2.6). Each video costs about
        US$0.35 (roughly GHS 5), charged to your fal.ai account.
      </p>

      {!props.configured ? (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Not set up yet. Add your fal.ai key in Vercel (Settings → Environment Variables → <code>FAL_KEY</code>), then
          redeploy.
        </p>
      ) : !props.hasImage ? (
        <p className="mt-4 text-xs text-foreground/60">This request has no image yet. The requester&apos;s photo or an uploaded image is needed.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {props.status === "queued" ? (
            <form action={checkAction} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={props.id} />
              <p className="text-xs">Your video is being made. It usually takes 1 to 5 minutes.</p>
              <div>
                <button type="submit" disabled={checking} className={primaryButtonClasses}>
                  {checking ? "Checking…" : "Check progress"}
                </button>
              </div>
              <Message state={checkState} />
            </form>
          ) : (
            <form action={startAction} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={props.id} />
              <label className="text-xs font-medium">
                Describe the video
                <textarea
                  name="aiPrompt"
                  rows={3}
                  maxLength={1000}
                  defaultValue={props.prompt || props.suggestedPrompt}
                  className={fieldClasses}
                />
              </label>
              <p className="text-xs text-foreground/60">
                Say what should move: e.g. “Slow camera push-in on the product, soft light sweeping across, gentle
                sparkle, professional advert style. Keep all text sharp and unchanged.”
              </p>
              {props.status === "failed" && props.error && (
                <p className="text-xs text-red-700 dark:text-red-400">Last attempt failed: {props.error}</p>
              )}
              <div>
                <button type="submit" disabled={starting} className={secondaryButtonClasses}>
                  {starting ? "Starting…" : props.videoUrl ? "Make a new AI video" : "Make AI video"}
                </button>
              </div>
              <Message state={startState} />
            </form>
          )}

          {props.videoUrl && (
            <div className="flex flex-col gap-2">
              <video src={props.videoUrl} controls muted playsInline className="w-full rounded-lg bg-black" />
              {props.inUse ? (
                <p className="text-xs font-medium text-green-700 dark:text-green-400">This video is the advert.</p>
              ) : (
                <form action={useAiVideo}>
                  <input type="hidden" name="id" value={props.id} />
                  <button type="submit" className={primaryButtonClasses}>
                    Use as the advert
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
