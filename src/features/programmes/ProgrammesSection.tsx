import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { formatGhs } from "@/config/books";
import { getProgrammesFor, registrationState } from "@/db/programmes";
import { formatTime, formatWhen, platformName } from "@/features/programmes/shared";

/**
 * Upcoming online programmes chosen for this page (Admin → Programmes →
 * "Show it on these pages"). The whole flyer is shown, never cropped, with a
 * Register button. Shows nothing when there is no upcoming programme.
 */
export async function ProgrammesSection({ branch, dark = false }: { branch: string; dark?: boolean }) {
  const programmes = await getProgrammesFor(branch);
  if (programmes.length === 0) return null;

  return (
    <section aria-label="Upcoming programmes" className={`py-12 ${dark ? "bg-black text-white" : "bg-gradient-to-b from-[#0b3d91]/[0.06] to-transparent"}`}>
      <Container>
        <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-[#e3a82a]" : "text-brand-primary-text"}`}>🎓 Upcoming programme{programmes.length > 1 ? "s" : ""}</p>
        <div className="mt-4 flex flex-col gap-10">
          {programmes.map((p) => {
            const reg = registrationState(p);
            const left = p.capacity != null ? Math.max(0, p.capacity - p.taken) : null;
            return (
              <article key={p.id} className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                <Link href={`/programmes/${p.slug}`} className="block">
                  {p.image ? (
                    <Image
                      src={p.image.url}
                      alt={`Flyer: ${p.title}`}
                      width={p.image.width ?? 1024}
                      height={p.image.height ?? 1536}
                      sizes="(min-width: 768px) 45vw, 100vw"
                      className="mx-auto h-auto max-h-[640px] w-auto max-w-full rounded-2xl shadow-lg"
                    />
                  ) : (
                    <div aria-hidden="true" className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b3d91] to-[#e3a82a] text-6xl">
                      🎓
                    </div>
                  )}
                </Link>
                <div>
                  {p.category && <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-white/70" : "text-foreground/60"}`}>{p.category}</p>}
                  <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{p.title}</h2>
                  {p.summary && <p className={`mt-3 leading-7 ${dark ? "text-white/80" : "text-foreground/80"}`}>{p.summary}</p>}
                  <ul className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
                    <li>📅 {p.scheduleNote || `${formatWhen(p.startsAt, p.timeZone)} to ${formatTime(p.endsAt, p.timeZone)}`}</li>
                    <li>💻 Online on {platformName(p.platform, p.platformName)}</li>
                    <li>🎟️ {p.priceGhs > 0 ? formatGhs(p.priceGhs) : "Free"}{left != null && reg.open ? ` · ${left} place${left === 1 ? "" : "s"} left` : ""}</li>
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {reg.open ? (
                      <Link href={`/programmes/${p.slug}#register`} className="rounded-full bg-[#e3a82a] px-6 py-3 text-sm font-bold text-[#14110c] hover:opacity-90">
                        ✍️ Register to get your code
                      </Link>
                    ) : (
                      <span className={`rounded-full px-4 py-2 text-sm font-semibold ${dark ? "bg-white/10" : "bg-black/5"}`}>{reg.label}</span>
                    )}
                    <Link href="/programmes/access" className={`rounded-full border px-5 py-3 text-sm font-semibold ${dark ? "border-white/30" : "border-black/15"}`}>
                      🔑 I have a code
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
