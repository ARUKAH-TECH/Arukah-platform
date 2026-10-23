import Image from "next/image";
import { mediaPublicUrl } from "@/lib/supabase/public";
import { parseVideoLink } from "@/lib/video";
import { MediaItemEditor } from "@/features/admin/cms/MediaItemEditor";

interface MediaRow {
  id: string;
  kind: string;
  storage_path: string | null;
  video_url: string | null;
  alt_text: string;
  caption: string;
  project_id: string | null;
}

export function MediaGrid({ items, projects }: { items: MediaRow[]; projects: { id: string; title: string }[] }) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-foreground/60">Nothing here yet.</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const video = item.video_url ? parseVideoLink(item.video_url) : null;
        return (
          <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            {item.kind === "image" && item.storage_path ? (
              <Image
                src={mediaPublicUrl(item.storage_path)}
                alt={item.alt_text}
                width={400}
                height={300}
                className="aspect-[4/3] w-full rounded-lg bg-black/5 object-cover"
              />
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
            <MediaItemEditor
              projects={projects}
              item={{ id: item.id, kind: item.kind, altText: item.alt_text, caption: item.caption, projectId: item.project_id }}
            />
          </div>
        );
      })}
    </div>
  );
}
