import Link from "next/link";
import { formatOutreachDate, outreachTypeLabel } from "@/config/outreach";
import type { PublicOutreach } from "@/db/outreaches";

/** Card for the ministry's dark pages. */
export function OutreachCard({ outreach }: { outreach: PublicOutreach }) {
  const meta = [formatOutreachDate(outreach.date), outreach.location].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/ministry/outreach/${outreach.slug}`}
      className="group flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-900 p-5 transition-colors hover:border-brand-primary-text"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
        {outreachTypeLabel(outreach.type)}
      </p>
      <h3 className="text-base font-semibold text-white group-hover:text-brand-primary-text">{outreach.title}</h3>
      {meta && <p className="text-xs text-white/60">{meta}</p>}
      {outreach.purpose && <p className="text-sm leading-6 text-white/70">{outreach.purpose}</p>}
    </Link>
  );
}
