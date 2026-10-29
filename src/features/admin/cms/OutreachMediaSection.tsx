import { createClient } from "@/lib/supabase/server";
import { parseVideoLink } from "@/lib/video";
import { OutreachImageUploader, OutreachVideoForm } from "@/features/admin/cms/OutreachUploader";
import { OutreachMediaEditor } from "@/features/admin/cms/OutreachMediaEditor";

interface Row {
  id: string;
  kind: string;
  storage_path: string | null;
  video_url: string | null;
  alt_text: string;
  caption: string;
  shows_identifiable_people: boolean;
  shows_children: boolean;
  shows_patients: boolean;
  shows_prisoners: boolean;
  written_permission: boolean;
  consent_reviewed: boolean;
}

/** Admin-only: photos/videos for one outreach, each with its consent checklist. */
export async function OutreachMediaSection({ outreachId }: { outreachId: string }) {
  const supabase = await createClient();
  const [{ data: rows }, { data: notes }] = await Promise.all([
    supabase
      .from("outreach_media")
      .select(
        "id, kind, storage_path, video_url, alt_text, caption, shows_identifiable_people, shows_children, shows_patients, shows_prisoners, written_permission, consent_reviewed",
      )
      .eq("outreach_id", outreachId)
      .order("created_at"),
    supabase.from("outreach_media_private_notes").select("media_id, permission_note"),
  ]);
  const items = (rows ?? []) as Row[];
  const noteFor = new Map((notes ?? []).map((note) => [note.media_id as string, note.permission_note as string]));

  // The bucket is private: previews use short-lived signed links (admins pass the storage policy).
  const paths = items.map((item) => item.storage_path).filter((path): path is string => Boolean(path));
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage.from("outreach-media").createSignedUrls(paths, 600);
    for (const entry of data ?? []) if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  }

  return (
    <section className="mt-12 border-t border-black/10 pt-8 dark:border-white/10">
      <h2 className="text-lg font-semibold">Photos and videos</h2>
      <p className="mt-1 max-w-2xl text-sm text-foreground/60">
        Photos are stored privately. Each item appears on the website only after you complete its consent checklist —
        and if it shows recognisable people, children, patients or prisoners, only once written permission is recorded.
      </p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">Nothing uploaded yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {items.map((item) => {
            const video = item.video_url ? parseVideoLink(item.video_url) : null;
            const src = item.storage_path ? signed.get(item.storage_path) : undefined;
            return (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
                {item.kind === "image" ? (
                  src ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed link to a private file
                    <img src={src} alt={item.alt_text} className="aspect-[4/3] w-full rounded-lg bg-black/5 object-cover" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-black/5 text-xs text-foreground/60">
                      Preview unavailable
                    </div>
                  )
                ) : (
                  <a
                    href={video?.url ?? item.video_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-[4/3] items-center justify-center rounded-lg bg-black/5 text-sm font-medium hover:underline dark:bg-white/10"
                  >
                    {video?.platform === "youtube" ? "YouTube video ↗" : "TikTok video ↗"}
                  </a>
                )}
                <OutreachMediaEditor
                  item={{
                    id: item.id,
                    kind: item.kind,
                    altText: item.alt_text,
                    caption: item.caption,
                    identifiable: item.shows_identifiable_people,
                    children: item.shows_children,
                    patients: item.shows_patients,
                    prisoners: item.shows_prisoners,
                    writtenPermission: item.written_permission,
                    permissionNote: noteFor.get(item.id) ?? "",
                    reviewed: item.consent_reviewed,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Upload photos</h3>
          <OutreachImageUploader outreachId={outreachId} />
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Add a video</h3>
          <OutreachVideoForm outreachId={outreachId} />
        </div>
      </div>
    </section>
  );
}
