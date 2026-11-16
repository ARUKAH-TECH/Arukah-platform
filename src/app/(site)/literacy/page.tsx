import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LITERACY_URL } from "@/config/literacy";
import { ShareButtons } from "@/components/ui/ShareButtons";

const DESCRIPTION =
  "ZIVA Learning: a free app for learners in Ghana. Reading, phonics, spelling and handwriting from KG to JHS, plus Creative Arts lessons for Primary 1 to JHS 3 (NaCCA curriculum). No sign-up, works offline.";

export const metadata: Metadata = {
  title: "ZIVA Learning: Free Reading, Handwriting & Creative Arts App",
  description: DESCRIPTION,
  alternates: { canonical: "/literacy" },
  openGraph: { title: "ZIVA Learning: Free Learning App for Ghana | ZIVARUKAH", description: DESCRIPTION },
};

const FEATURES = [
  { emoji: "📖", title: "Reading and phonics", text: "Letter sounds, blending, word reading and short stories with questions." },
  { emoji: "✍️", title: "Handwriting", text: "Trace letters and words with a finger, from pre-writing strokes to neat sentences." },
  { emoji: "🎨", title: "Creative Arts (NaCCA)", text: "Lessons for Primary 1 to JHS 3 following the official curriculum, with drawn diagrams and practical activities, plus simple KG art activities." },
  { emoji: "📝", title: "Quizzes and BECE practice", text: "Starred quizzes for every topic and BECE-style questions with model answers for JHS." },
  { emoji: "🔊", title: "Read to me", text: "Stories and lessons can be read aloud by the phone's own voice." },
  { emoji: "🔎", title: "Search", text: "Find any Creative Arts topic quickly, across your class or all classes." },
];

const LEVELS = [
  { emoji: "🧸", name: "Kindergarten 1 to 2", what: "Alphabet and letter sounds, picture matching, pre-writing strokes and tracing, listening to stories." },
  { emoji: "🎒", name: "Primary 1 to 3", what: "Phonics and blending, word reading, short stories with questions, spelling, neat letters and words." },
  { emoji: "📘", name: "Primary 4 to 6", what: "Reading fluency, vocabulary, comprehension, spelling, punctuation and handwriting." },
  { emoji: "🎓", name: "JHS 1 to 3", what: "Longer passages, vocabulary, fluency, spelling, punctuation and clear sentence writing, plus Creative Arts and Design with BECE-style practice." },
];

export default function LiteracyPage() {
  return (
    <div data-brand="ziva" className="py-12 sm:py-16">
      <Container>
        <div className="rounded-3xl bg-gradient-to-br from-[#0b69a8] to-[#0b3d91] p-8 text-white shadow-lg sm:p-12">
          <Image
            src="/branding/ziva-literacy/logo.webp"
            alt="ZIVA Learning: part of ZIVA Online and Special Classes"
            width={160}
            height={160}
            priority
            className="float-right mb-3 ml-4 h-28 w-28 rounded-full bg-white shadow-xl ring-4 ring-white/30 sm:h-40 sm:w-40"
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f0c050]">ZIVA Special Classes</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">ZIVA Learning</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            A free learning app that helps children read, listen, spell and write, and learn Creative Arts, one small step every day.
            It reads aloud, lets learners trace letters with their finger and gives stars for good work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={LITERACY_URL} className="inline-flex items-center justify-center rounded-full bg-[#e3a82a] px-7 py-3 text-lg font-semibold text-[#14110c]">
              Open ZIVA Learning →
            </a>
            <a href={`${LITERACY_URL}creative-arts/`} className="inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-3 text-lg font-semibold text-white">
              🎨 Creative Arts lessons
            </a>
          </div>
          <ShareButtons
            dark
            className="mt-6"
            label="Share with parents & teachers"
            url={LITERACY_URL}
            title="ZIVA Learning"
            message={"✏️ *ZIVA Learning*: FREE\n\nReading, phonics, spelling and handwriting for KG to JHS, plus Creative Arts lessons (NaCCA) for Primary 1 to JHS 3. Reads aloud, gives stars, works offline 👇"}
          />
          <p className="mt-4 text-sm text-white/75">
            On the app’s home page, tap <strong>Install</strong> (or Chrome menu ⋮ → Install app) to add a <strong>ZIVA Learning</strong> icon to your phone.
          </p>
        </div>

        <h2 className="mt-14 text-2xl font-bold tracking-tight">What is inside</h2>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <p className="text-lg font-semibold">
                <span aria-hidden="true">{f.emoji}</span> {f.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground/70">{f.text}</p>
            </li>
          ))}
        </ul>

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
          <li>Completely free, with no registration and nothing to pay. Every stage and the Word bank are open.</li>
          <li>Works offline after the first visit, so it saves data.</li>
          <li>Read-aloud uses the phone’s own voice.</li>
          <li>No learner accounts: stars are saved on the learner’s own phone.</li>
          <li>
            Read more:{" "}
            <a href="/articles/free-creative-arts-lessons-ghana" className="font-semibold underline">
              Free Creative Arts lessons for Primary 1 to JHS 3
            </a>
            .
          </li>
          <li>Parents far away can follow a child’s stars with a free parent code made on the child’s phone (first name only, with a parent’s permission).</li>
        </ul>
      </Container>
    </div>
  );
}
