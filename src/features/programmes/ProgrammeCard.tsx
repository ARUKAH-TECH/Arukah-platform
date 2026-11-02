import Image from "next/image";
import Link from "next/link";
import { formatGhs } from "@/config/books";
import { registrationState, type PublicProgramme } from "@/db/programmes";
import { formatTime, formatWhen, platformName } from "@/features/programmes/shared";

export function ProgrammeCard({ p }: { p: PublicProgramme }) {
  const reg = registrationState(p);
  const left = p.capacity != null ? Math.max(0, p.capacity - p.taken) : null;
  return (
    <Link
      href={`/programmes/${p.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5"
    >
      {p.image ? (
        <Image src={p.image.url} alt="" width={p.image.width ?? 1200} height={p.image.height ?? 675} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div aria-hidden="true" className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-[#0b3d91] to-[#e3a82a] text-5xl">
          🎓
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className={`rounded-full px-2.5 py-0.5 ${reg.open ? "bg-emerald-100 text-emerald-900" : "bg-black/5 text-foreground/70 dark:bg-white/10"}`}>{reg.label}</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">{p.priceGhs > 0 ? formatGhs(p.priceGhs) : "Free"}</span>
          {p.category && <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-sky-900">{p.category}</span>}
        </div>
        <h3 className="text-lg font-bold leading-snug">{p.title}</h3>
        {p.summary && <p className="text-sm leading-6 text-foreground/75">{p.summary}</p>}
        <p className="mt-auto pt-2 text-sm font-medium">
          📅 {p.scheduleNote || `${formatWhen(p.startsAt, p.timeZone)} to ${formatTime(p.endsAt, p.timeZone)}`}
        </p>
        <p className="text-sm text-foreground/70">
          💻 {platformName(p.platform, p.platformName)}
          {left != null && reg.open ? ` · ${left} place${left === 1 ? "" : "s"} left` : ""}
        </p>
      </div>
    </Link>
  );
}
