import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BibleShell } from "@/features/bible/BibleShell";
import { listSeries } from "@/db/bible";

export const metadata: Metadata = {
  title: { absolute: "Bible Studies with Quizzes | Repent Online Ministries" },
  description: "Step-by-step Bible studies from Repent Online Ministries, each lesson with scripture and a short quiz. Free.",
  alternates: { canonical: "/bible/studies" },
};
export const revalidate = 600;

export default async function StudiesPage() {
  const series = await listSeries();
  return (
    <BibleShell active="studies">
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <h1 className="text-3xl font-bold tracking-tight">Bible studies</h1>
          <p className="mt-1 text-foreground/70">Lessons in order, each with scripture and a short quiz.</p>
          {series.length === 0 ? (
            <p className="mt-8 text-foreground/70">The first Bible study is coming soon.</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {series.map((s) => (
                <li key={s.id}>
                  <Link href={`/bible/studies/${s.slug}`} className="block rounded-2xl border border-black/10 bg-white p-5 hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5">
                    <p className="text-xl font-bold">{s.title}</p>
                    {s.summary && <p className="mt-1 text-foreground/70">{s.summary}</p>}
                    <p className="mt-2 text-xs font-semibold text-brand-primary-text">
                      {s.lessonCount} lesson{s.lessonCount === 1 ? "" : "s"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </BibleShell>
  );
}
