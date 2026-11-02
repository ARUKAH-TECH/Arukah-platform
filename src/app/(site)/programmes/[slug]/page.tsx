import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { formatGhs } from "@/config/books";
import { getPublicProgramme, registrationState } from "@/db/programmes";
import { RegisterForm } from "@/features/programmes/RegisterForm";
import { formatTime, formatWhen, platformName } from "@/features/programmes/shared";
import { SharePage } from "@/components/ui/SharePage";
import { programmePaymentsEnabled } from "@/server/programmePayments";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/programmes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicProgramme(slug);
  if (!p) return { title: "Programme not found" };
  return {
    title: p.title,
    description: p.summary || `${p.title}: an online programme by ZIVARUKAH. Register on zivarukah.com.`,
    alternates: { canonical: `/programmes/${p.slug}` },
    openGraph: { title: p.title, description: p.summary, images: p.image ? [{ url: p.image.url }] : undefined },
  };
}

export default async function ProgrammePage({ params }: PageProps<"/programmes/[slug]">) {
  const { slug } = await params;
  const p = await getPublicProgramme(slug);
  if (!p) notFound();
  const reg = registrationState(p);
  const left = p.capacity != null ? Math.max(0, p.capacity - p.taken) : null;
  const platform = platformName(p.platform, p.platformName);
  const facts = [
    { k: "When", v: p.scheduleNote || `${formatWhen(p.startsAt, p.timeZone)} to ${formatTime(p.endsAt, p.timeZone)}` },
    ...(p.scheduleNote ? [{ k: "First session", v: formatWhen(p.startsAt, p.timeZone) }] : []),
    { k: "Where", v: `Online on ${platform}` },
    { k: "Cost", v: p.priceGhs > 0 ? formatGhs(p.priceGhs) : "Free" },
    { k: "Register by", v: formatWhen(p.regClosesAt ?? p.endsAt, p.timeZone) },
    ...(left != null ? [{ k: "Places", v: `${left} of ${p.capacity} left` }] : []),
  ];

  return (
    <section className="py-10">
      <Container>
        <Link href="/programmes" className="text-sm text-foreground/60 hover:text-brand-primary-text">
          ← All programmes
        </Link>
        <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
          <div>
            {p.image && (
              <Image src={p.image.url} alt="" width={p.image.width ?? 1200} height={p.image.height ?? 675} sizes="(min-width: 1024px) 60vw, 100vw" className="w-full rounded-2xl" priority />
            )}
            {p.category && <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-brand-primary-text">{p.category}</p>}
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{p.title}</h1>
            {p.summary && <p className="mt-3 text-lg leading-8 text-foreground/80">{p.summary}</p>}
            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.k} className="rounded-xl bg-black/[0.04] p-4 dark:bg-white/10">
                  <dt className="text-xs font-semibold uppercase text-foreground/60">{f.k}</dt>
                  <dd className="mt-1 font-semibold">{f.v}</dd>
                </div>
              ))}
            </dl>
            {p.description && <div className="mt-6 whitespace-pre-line leading-7 text-foreground/85">{p.description}</div>}
          </div>

          <aside id="register" className="scroll-mt-24">
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-md dark:border-white/10 dark:bg-white/5 lg:sticky lg:top-28">
              <h2 className="text-xl font-bold">{reg.open ? (p.approval === "manual" ? "Request a place" : "Register") : reg.label}</h2>
              {reg.open && p.priceGhs > 0 && !programmePaymentsEnabled() ? (
                <p className="mt-3 text-sm text-foreground/75">Online payment for this programme is being set up. Please check back soon.</p>
              ) : reg.open ? (
                <>
                  <p className="mt-1 mb-4 text-sm text-foreground/70">
                    {p.priceGhs > 0
                      ? `Fee: ${formatGhs(p.priceGhs)}. You get your secret code as soon as Paystack confirms your payment.`
                      : p.approval === "manual"
                        ? "Places are confirmed by our team. You get your secret code now; it opens the joining details once approved."
                        : "You get your secret code straight away. It opens the joining details."}
                  </p>
                  <RegisterForm slug={p.slug} title={p.title} manual={p.approval === "manual"} price={p.priceGhs > 0 ? formatGhs(p.priceGhs) : undefined} />
                </>
              ) : (
                <p className="mt-3 text-sm text-foreground/75">
                  {reg.label === "Full" ? "All places have been taken." : "Registration is not open at the moment."} Already registered?{" "}
                  <Link href="/programmes/access" className="font-semibold underline">
                    Enter your code
                  </Link>
                  .
                </p>
              )}
              <p className="mt-4 border-t border-black/10 pt-4 text-sm dark:border-white/10">
                Already registered?{" "}
                <Link href="/programmes/access" className="font-semibold underline">
                  🔑 Enter your code
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </Container>
      <SharePage
        path={`/programmes/${p.slug}`}
        title={p.title}
        message={`🎓 *${p.title}*\n\n${p.scheduleNote || formatWhen(p.startsAt, p.timeZone)} · online on ${platform} · ${p.priceGhs > 0 ? formatGhs(p.priceGhs) : "Free"}\n\nRegister here 👇`}
        heading="📣 Share this programme"
        note="Know someone who would like to join?"
      />
    </section>
  );
}
