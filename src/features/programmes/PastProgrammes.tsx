import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getPastProgrammesFor } from "@/db/programmes";
import { scheduleText } from "@/features/programmes/shared";

/**
 * "Past programmes": flyers of programmes that have already happened, shown
 * whole (never cropped) with a "Completed" label. Shows nothing until one
 * exists. Add them in Admin → Programmes with their old dates.
 */
export async function PastProgrammes({ branch, dark = false, title = "Past programmes" }: { branch: string; dark?: boolean; title?: string }) {
  const past = await getPastProgrammesFor(branch);
  if (past.length === 0) return null;
  return (
    <section aria-label={title} className={`py-12 ${dark ? "bg-black text-white" : ""}`}>
      <Container>
        <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-[#e3a82a]" : "text-brand-primary-text"}`}>Our track record</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {past.map((p) => (
            <Link
              key={p.id}
              href={`/programmes/${p.slug}`}
              className={`flex flex-col overflow-hidden rounded-2xl border ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white dark:border-white/10 dark:bg-white/5"}`}
            >
              {p.image ? (
                <Image
                  src={p.image.url}
                  alt={`Flyer: ${p.title}`}
                  width={p.image.width ?? 1024}
                  height={p.image.height ?? 1536}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="h-auto w-full"
                />
              ) : (
                <div aria-hidden="true" className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br from-[#0b3d91] to-[#e3a82a] text-4xl">
                  🙏
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${dark ? "bg-white/10 text-white/80" : "bg-black/5 text-foreground/70 dark:bg-white/10"}`}>
                  ✓ Completed
                </span>
                <p className="text-sm font-bold leading-snug">{p.title}</p>
                <p className={`text-xs ${dark ? "text-white/60" : "text-foreground/60"}`}>{scheduleText(p.scheduleNote, p.startsAt, p.endsAt, p.timeZone)}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
