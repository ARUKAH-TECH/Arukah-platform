import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LITERACY_URL } from "@/config/literacy";
import { ShareButtons } from "@/components/ui/ShareButtons";

export const metadata: Metadata = {
  title: "Literacy & Handwriting Coach — ZIVA",
  description:
    "Free reading, phonics, spelling and handwriting practice app for Kindergarten, Primary 1–6 and JHS 1–3 learners in Ghana. Installable and works offline.",
  alternates: { canonical: "/literacy" },
};

const LEVELS = [
  { emoji: "🧸", name: "Kindergarten 1–2", what: "Alphabet and letter sounds, picture matching, pre-writing strokes and tracing, listening to stories." },
  { emoji: "🎒", name: "Primary 1–3", what: "Phonics and blending, word reading, short stories with questions, spelling, neat letters and words." },
  { emoji: "📘", name: "Primary 4–6", what: "Reading fluency, vocabulary, comprehension, spelling, punctuation and handwriting." },
  { emoji: "🎓", name: "JHS 1–3", what: "Longer passages, vocabulary, fluency, spelling, punctuation and clear sentence writing." },
];

export default function LiteracyPage() {
  return (
    <div data-brand="ziva" className="py-12 sm:py-16">
      <Container>
        <div className="rounded-3xl bg-gradient-to-br from-[#0b69a8] to-[#0b3d91] p-8 text-white shadow-lg sm:p-12">
          <Image
            src="/branding/ziva-literacy/logo.webp"
            alt="ZIVA Literacy — a sub of ZIVA Online and Special Classes"
            width={160}
            height={160}
            priority
            className="float-right mb-3 ml-4 h-28 w-28 rounded-full bg-white shadow-xl ring-4 ring-white/30 sm:h-40 sm:w-40"
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f0c050]">ZIVA Special Classes</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Literacy &amp; Handwriting Coach</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            A free learning app that helps children read, listen, spell and write — one small step every day. It reads stories aloud,
            lets learners trace letters with their finger and gives stars for good work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={LITERACY_URL} className="inline-flex items-center justify-center rounded-full bg-[#e3a82a] px-7 py-3 text-lg font-semibold text-[#14110c]">
              Open the Literacy App →
            </a>
          </div>
          <ShareButtons
            dark
            className="mt-6"
            label="Share with parents & teachers"
            url={LITERACY_URL}
            title="ZIVA Literacy & Handwriting Coach"
            message={"✏️ *ZIVA Literacy & Handwriting Coach* — FREE\n\nReading, phonics, spelling and handwriting practice for KG, Primary and JHS. Reads stories aloud, lets children trace letters with their finger and gives stars. Install it on your phone — works offline 👇"}
          />
          <p className="mt-4 text-sm text-white/75">
            On the app’s home page, tap <strong>Install</strong> (or Chrome menu ⋮ → Install app) to add a <strong>ZIVA Literacy</strong> icon to your phone.
          </p>
        </div>

        <h2 className="mt-14 text-2xl font-bold tracking-tight">Who it is for</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LEVELS.map((l) => (
            <div key={l.name} className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <p className="text-lg font-semibold">
                <span aria-hidden="true">{l.emoji}</span> {l.name}
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground/70">{l.what}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-2xl font-bold tracking-tight">Good to know</h2>
        <ul className="mt-4 flex max-w-2xl list-disc flex-col gap-2 pl-6 text-foreground/80">
          <li>Free, with no sign-up. Progress is saved only on the learner’s own device — no names or scores are collected.</li>
          <li>Works offline after the first visit, so it saves data.</li>
          <li>Read-aloud uses the phone’s own voice.</li>
          <li>Teachers and parents: class and progress accounts are coming next.</li>
        </ul>
      </Container>
    </div>
  );
}
