"use client";

import { useEffect, useState } from "react";
import type { QuizQuestion } from "@/lib/bibleQuiz";

const DONE = "zivarukah-bible:lessons";

export function doneLessons(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DONE) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

/** Questions one by one with the right answer explained; the score is kept on this device. */
export function Quiz({ lessonId, questions }: { lessonId: string; questions: QuizQuestion[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => setBest(doneLessons()[lessonId] ?? null), [lessonId]);

  const q = questions[i];
  function choose(n: number) {
    if (picked !== null) return;
    setPicked(n);
    if (n === q.answer) setScore((s) => s + 1);
  }
  function next() {
    if (i + 1 < questions.length) {
      setI(i + 1);
      setPicked(null);
      return;
    }
    setFinished(true);
    const all = doneLessons();
    all[lessonId] = Math.max(all[lessonId] ?? 0, score);
    try {
      localStorage.setItem(DONE, JSON.stringify(all));
    } catch {
      // fine
    }
    setBest(all[lessonId]);
  }
  function again() {
    setI(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="rounded-3xl bg-[#14110c] p-6 text-center text-white">
        <p className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "👏" : "📖"}</p>
        <p className="mt-2 text-2xl font-bold">
          {score} of {questions.length} correct
        </p>
        <p className="mt-1 text-white/75">{pct >= 80 ? "Excellent! You know this lesson well." : pct >= 50 ? "Good work. Read the lesson again to learn more." : "Keep going: read the lesson again, then try once more."}</p>
        <button type="button" onClick={again} className="mt-4 rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-semibold text-[#14110c]">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between text-xs font-semibold text-foreground/60">
        <span>
          Question {i + 1} of {questions.length}
        </span>
        {best !== null && <span>Best score: {best}</span>}
      </div>
      <p className="mt-2 text-lg font-bold">{q.question}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {q.options.map((o, n) => {
          const state = picked === null ? "" : n === q.answer ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : n === picked ? "border-rose-500 bg-rose-50 dark:bg-rose-950" : "opacity-60";
          return (
            <li key={n}>
              <button
                type="button"
                onClick={() => choose(n)}
                disabled={picked !== null}
                className={`w-full rounded-2xl border-2 border-black/10 px-4 py-3 text-left dark:border-white/10 ${state}`}
              >
                {picked !== null && n === q.answer ? "✅ " : picked === n ? "❌ " : ""}
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== null && (
        <div className="mt-4">
          <p className={`font-semibold ${picked === q.answer ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
            {picked === q.answer ? "Correct!" : `The answer is: ${q.options[q.answer]}`}
          </p>
          {q.why && <p className="mt-1 text-sm text-foreground/75">{q.why}</p>}
          <button type="button" onClick={next} className="mt-3 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-on-primary">
            {i + 1 < questions.length ? "Next question →" : "See my score"}
          </button>
        </div>
      )}
    </div>
  );
}

/** ✓ next to lessons whose quiz was done on this device. */
export function LessonTick({ lessonId, total }: { lessonId: string; total: number }) {
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => setScore(doneLessons()[lessonId] ?? null), [lessonId]);
  if (score === null) return null;
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
      ✓ {total ? `${score}/${total}` : "Done"}
    </span>
  );
}
