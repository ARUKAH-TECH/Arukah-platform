import Link from "next/link";

// "GH₵ 1,250 raised of GH₵ 5,000" with a bar. Only totals are shown, never who gave.

const cedis = (n: number) => `GH₵ ${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;

export function GivingProgress({ raised, goal, slug, title, compact = false }: { raised: number; goal: number; slug: string; title?: string; compact?: boolean }) {
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  const reached = raised >= goal;
  return (
    <div className={`rounded-2xl border border-[#e3a82a]/40 bg-white/5 ${compact ? "p-4" : "p-5"}`}>
      {title && <p className="font-bold">{title}</p>}
      <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
        <span>
          <strong className="text-lg text-[#f0c050]">{cedis(raised)}</strong> raised
        </span>
        <span className="text-white/70">goal {cedis(goal)}</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% of the goal`}>
        <div className="h-full rounded-full bg-[#e3a82a]" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <p className="mt-2 text-xs text-white/70">{reached ? "🎉 Goal reached, thank you! Gifts still help the next outreach." : `${pct}% of the goal. Every cedi helps.`}</p>
      <Link href={`/ministry/support?outreach=${slug}`} className="mt-3 inline-block rounded-full bg-[#e3a82a] px-5 py-2 text-sm font-bold text-[#14110c]">
        💛 Give now
      </Link>
    </div>
  );
}
