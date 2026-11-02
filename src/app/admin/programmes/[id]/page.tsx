import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { ProgrammeForm } from "@/features/admin/cms/ProgrammeForm";
import { deleteProgramme } from "@/features/admin/cms/programmeActions";
import { ProgrammeParticipants } from "@/features/admin/cms/ProgrammeParticipants";

export const metadata: Metadata = { title: "Edit programme" };

export default async function EditProgrammePage({ params, searchParams }: PageProps<"/admin/programmes/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved, q } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: p }, { data: priv }] = await Promise.all([
    supabase.from("programmes").select("*").eq("id", id).maybeSingle(),
    supabase.from("programme_private").select("join_link, join_instructions").eq("programme_id", id).maybeSingle(),
  ]);
  if (!p) notFound();

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/programmes" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All programmes
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{p.title}</h1>
      {p.status !== "draft" && (
        <p className="mt-1 text-sm text-foreground/60">
          Public page:{" "}
          <a href={`/programmes/${p.slug}`} target="_blank" className="font-mono underline">
            zivarukah.com/programmes/{p.slug}
          </a>{" "}
          ·{" "}
          <a href="#participants" className="underline">
            Participants ↓
          </a>
        </p>
      )}
      <div className="mt-6 max-w-2xl">
        <ProgrammeForm
          justSaved={saved === "1"}
          values={{
            id: p.id,
            slug: p.slug,
            title: p.title,
            summary: p.summary,
            description: p.description,
            category: p.category,
            imagePath: p.image_path,
            imageWidth: p.image_width,
            imageHeight: p.image_height,
            startsAt: p.starts_at,
            endsAt: p.ends_at,
            timeZone: p.time_zone,
            scheduleNote: p.schedule_note,
            regOpensAt: p.reg_opens_at,
            regClosesAt: p.reg_closes_at,
            capacity: p.capacity,
            priceGhs: Number(p.price_ghs),
            approval: p.approval === "manual" ? "manual" : "auto",
            status: p.status,
            platform: p.platform,
            platformName: p.platform_name,
            codeValidHours: p.code_valid_hours,
            codeSingleUse: p.code_single_use,
            linkRelease: p.link_release ?? "always",
            branches: p.branches ?? ["home"],
            joinLink: priv?.join_link ?? "",
            joinInstructions: priv?.join_instructions ?? "",
          }}
        />
      </div>
      <ProgrammeParticipants
        programmeId={p.id}
        title={p.title}
        capacity={p.capacity}
        q={typeof q === "string" ? q : ""}
        programme={{
          title: p.title,
          startsAt: p.starts_at,
          endsAt: p.ends_at,
          timeZone: p.time_zone,
          scheduleNote: p.schedule_note,
          platform: p.platform,
          platformName: p.platform_name,
          priceGhs: Number(p.price_ghs),
          status: p.status,
        }}
      />
      <section className="mt-12 max-w-2xl border-t border-black/10 pt-8 dark:border-white/10">
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this programme…</summary>
          <p className="mt-2 text-foreground/70">To keep it on record, set the status to Cancelled or Completed instead.</p>
          <form action={deleteProgramme} className="mt-3">
            <input type="hidden" name="id" value={p.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}
