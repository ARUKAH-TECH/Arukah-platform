import Link from "next/link";
import { getPublicAnnouncements, type AnnouncementTone } from "@/db/announcements";
import type { BranchId } from "@/config/branches";

// Each tone sets its own background AND text color, so the bar reads the same
// on light pages, in dark mode, and on the forced-black ministry page.
const toneClasses: Record<AnnouncementTone, string> = {
  info: "bg-zinc-900 text-white dark:bg-zinc-800",
  highlight: "bg-brand-primary text-brand-on-primary",
  urgent: "bg-red-700 text-white",
};

/** Renders nothing at all until the admin publishes an announcement for this page. */
export async function AnnouncementBar({ branch }: { branch: BranchId }) {
  const announcements = await getPublicAnnouncements(branch);
  if (announcements.length === 0) return null;

  return (
    <div aria-label="Announcements" role="region">
      {announcements.map((item) => {
        const external = item.linkUrl?.startsWith("https://") ?? false;
        return (
          <div key={item.id} className={`${toneClasses[item.tone]} px-4 py-3 text-sm sm:px-6`}>
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
              <span className="font-semibold">{item.title}</span>
              {item.message && <span className="opacity-90">{item.message}</span>}
              {item.linkUrl &&
                (external ? (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    {item.linkLabel || "Learn more"} ↗
                  </a>
                ) : (
                  <Link href={item.linkUrl} className="font-semibold underline underline-offset-2">
                    {item.linkLabel || "Learn more"} →
                  </Link>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
