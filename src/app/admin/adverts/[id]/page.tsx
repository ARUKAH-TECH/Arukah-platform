import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { AdRequestForm } from "@/features/admin/cms/AdRequestForm";
import { deleteAdRequest } from "@/features/admin/cms/adRequestActions";
import { AiVideoPanel } from "@/features/admin/cms/AiVideoPanel";
import { AdStats } from "@/features/admin/cms/AdStats";
import { aiVideoConfigured } from "@/server/falVideo";

export const metadata: Metadata = { title: "Advert request" };

export default async function AdRequestPage({ params }: PageProps<"/admin/adverts/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("ad_requests")
    .select(
      "id, contact_name, business_name, phone, email, about, location, request_image_path, status, starts_at, ends_at, amount_ghs, payment_status, payment_reference, display_kind, display_image_path, video_url, link_url, admin_note, display_seconds, banner_style, is_text_ad, ai_video_status, ai_video_prompt, ai_video_path, ai_video_error, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();

  // The requester's photo is private: show it through a short-lived signed link.
  let requestPhoto: string | null = null;
  if (r.request_image_path) {
    const { data } = await supabase.storage.from("ad-requests").createSignedUrl(r.request_image_path, 600);
    requestPhoto = data?.signedUrl ?? null;
  }
  const aiVideoUrl = r.ai_video_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ad-videos/${r.ai_video_path}`
    : null;
  const received = new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });
  const digits = r.phone.replace(/[^\d+]/g, "");
  const whatsapp = digits.startsWith("+") ? digits.slice(1) : digits.startsWith("0") ? `233${digits.slice(1)}` : digits;

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/adverts" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All adverts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{r.business_name || r.contact_name}</h1>
      <p className="mt-1 text-sm text-foreground/60">Received {received}</p>

      <div className="mt-8 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-zinc-900">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">From the requester</h2>
          <p>
            <span className="font-medium">{r.contact_name}</span>
            {r.business_name && <span className="text-foreground/60"> · {r.business_name}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {r.phone && (
              <>
                <a href={`tel:${digits}`} className="rounded-full bg-brand-primary px-4 py-1.5 text-xs font-medium text-brand-on-primary">
                  Call {r.phone}
                </a>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium dark:border-white/15">
                  WhatsApp
                </a>
              </>
            )}
            {r.email && (
              <a href={`mailto:${r.email}`} className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium dark:border-white/15">
                Email
              </a>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground/60">What the advert is about</p>
            <p className="mt-1 whitespace-pre-line leading-6">{r.about}</p>
          </div>
          {r.location && (
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/60">Location</p>
              <p className="mt-1">{r.location}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground/60">Photo sent</p>
            {requestPhoto ? (
              <a href={requestPhoto} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- private photo via short-lived signed link */}
                <img src={requestPhoto} alt="Photo sent with the request" className="mt-2 w-full rounded-lg" />
              </a>
            ) : (
              <p className="mt-1 text-foreground/60">None</p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-8">
        {r.status === "approved" && <AdStats adId={r.id} />}
        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <AdRequestForm
            values={{
              id: r.id,
              status: r.status,
              startsAt: r.starts_at,
              endsAt: r.ends_at,
              amountGhs: r.amount_ghs != null ? String(r.amount_ghs) : "",
              paymentStatus: r.payment_status,
              paymentReference: r.payment_reference,
              displayKind: r.display_kind === "video" ? "video" : "image",
              displayImagePath: r.display_image_path,
              hasRequesterPhoto: Boolean(r.request_image_path),
              videoUrl: r.video_url ?? "",
              linkUrl: r.link_url ?? "",
              adminNote: r.admin_note,
              displaySeconds: r.display_seconds,
              bannerStyle: r.banner_style === "fit" ? "fit" : "roll",
              requesterPhotoUrl: requestPhoto,
              isTextAd: Boolean(r.is_text_ad),
              textDefaults: textAdDefaults(r),
            }}
          />
        </section>

        <AiVideoPanel
          id={r.id}
          configured={aiVideoConfigured()}
          hasImage={Boolean(r.display_image_path || r.request_image_path)}
          status={r.ai_video_status}
          prompt={r.ai_video_prompt}
          error={r.ai_video_error}
          videoUrl={aiVideoUrl}
          inUse={Boolean(aiVideoUrl && r.display_kind === "video" && r.video_url === aiVideoUrl)}
          suggestedPrompt={`Short professional advert video for ${r.business_name || "this business"}: slow cinematic camera push-in, soft light sweeping across, subtle motion. Keep any text and logos sharp and unchanged.`}
        />
        </div>
      </div>

      <section className="mt-12 max-w-5xl border-t border-black/10 pt-8 dark:border-white/10">
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this request…</summary>
          <form action={deleteAdRequest} className="mt-3">
            <input type="hidden" name="id" value={r.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}

/** Starting words for a designed text advert, taken from the request. */
function textAdDefaults(r: { business_name: string; about: string; location: string; phone: string }) {
  const about = r.about.replace(/\s+/g, " ").trim();
  const firstSentence = (about.match(/^[^.!?]{3,}[.!?]?/)?.[0] ?? about).trim();
  const short = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
  const headline = r.business_name.trim() || short(firstSentence, 40);
  const line2 = r.business_name.trim() ? short(firstSentence, 80) : short(r.location, 80);
  const contact = r.phone.trim() ? `📞 ${r.phone.trim()}` : r.location.trim() ? `📍 ${short(r.location.trim(), 30)}` : "";
  return { headline, line2, contact };
}
