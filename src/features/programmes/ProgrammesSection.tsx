import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { formatGhs } from "@/config/books";
import { getProgrammesFor, registrationState } from "@/db/programmes";
import { platformName, scheduleText } from "@/features/programmes/shared";
import { ShareProgramme } from "@/features/programmes/ShareProgramme";

/**
 * Upcoming online programmes chosen for this page (Admin → Programmes →
 * "Show it on these pages"). The whole flyer is shown, never cropped, with a
 * Register button. Shows nothing when there is no upcoming programme.
 */
export async function ProgrammesSection({ branch, dark = false, compact = false }: { branch: string; dark?: boolean; compact?: boolean }) {
  const programmes = await getProgrammesFor(branch);
  if (programmes.length === 0) return null;
  if (compact) return <CompactProgrammes programmes={programmes} />;

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
                    <li>📅 {scheduleText(p.scheduleNote, p.startsAt, p.endsAt, p.timeZone)}</li>
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
                  <div className="mt-4">
                    <ShareProgramme
                      slug={p.slug}
                      title={p.title}
                      when={scheduleText(p.scheduleNote, p.startsAt, p.endsAt, p.timeZone)}
                      where={platformName(p.platform, p.platformName)}
                      price={p.priceGhs > 0 ? formatGhs(p.priceGhs) : "Free"}
                      flyerUrl={p.image?.jpegUrl}
                      dark={dark}
                      compact
                    />
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

/** Homepage: short cards side by side (flyer thumbnail, when, Register, Invite). */
function CompactProgrammes({ programmes }: { programmes: Awaited<ReturnType<typeof getProgrammesFor>> }) {
  return (
    <section aria-label="Upcoming programmes" className="bg-gradient-to-b from-[#0b3d91]/[0.06] to-transparent py-10">
      <Container>
        <div className="flex items-end justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">🎓 Upcoming programme{programmes.length > 1 ? "s" : ""}</p>
          <Link href="/programmes" className="text-sm font-semibold text-brand-primary-text underline">
            See all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {programmes.slice(0, 4).map((p) => {
            const reg = registrationState(p);
            return (
              <article key={p.id} className="flex gap-4 rounded-2xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                <Link href={`/programmes/${p.slug}`} className="shrink-0">
                  {p.image ? (
                    <Image src={p.image.url} alt={`Flyer: ${p.title}`} width={224} height={320} sizes="112px" className="h-40 w-28 rounded-xl object-cover object-top" />
                  ) : (
                    <div aria-hidden="true" className="flex h-40 w-28 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b3d91] to-[#e3a82a] text-4xl">
                      🎓
                    </div>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  {p.category && <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">{p.category}</p>}
                  <Link href={`/programmes/${p.slug}`} className="mt-0.5 line-clamp-2 font-bold leading-snug hover:text-brand-primary-text">
                    {p.title}
                  </Link>
                  <p className="mt-1 text-xs leading-5 text-foreground/75">📅 {scheduleText(p.scheduleNote, p.startsAt, p.endsAt, p.timeZone)}</p>
                  <p className="text-xs text-foreground/75">
                    💻 {platformName(p.platform, p.platformName)} · {p.priceGhs > 0 ? formatGhs(p.priceGhs) : "Free"}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {reg.open ? (
                      <Link href={`/programmes/${p.slug}#register`} className="rounded-full bg-[#e3a82a] px-4 py-2 text-xs font-bold text-[#14110c]">
                        Register
                      </Link>
                    ) : (
                      <span className="rounded-full bg-black/5 px-3 py-2 text-xs font-semibold dark:bg-white/10">{reg.label}</span>
                    )}
                    <ShareProgramme
                      slug={p.slug}
                      title={p.title}
                      when={scheduleText(p.scheduleNote, p.startsAt, p.endsAt, p.timeZone)}
                      where={platformName(p.platform, p.platformName)}
                      price={p.priceGhs > 0 ? formatGhs(p.priceGhs) : "Free"}
                      flyerUrl={p.image?.jpegUrl}
                      compact
                      minimal
                    />
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
