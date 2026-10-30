// Line graph of page views (solid blue) and visits (dashed gold), shared by the
// Admin dashboard and the Visitors page. Each point carries its own labels, so
// the same graph shows days ("Fri" over "30 Oct") or months ("Oct" over "2026").

export type ChartPoint = {
  key: string;
  /** Top label line, e.g. "Fri" or "Oct". */
  top: string;
  /** Bottom label line, e.g. "30 Oct" or "2026". */
  bottom: string;
  /** Full name for the hover tooltip, e.g. "Friday 30 October 2026". */
  title: string;
  views: number;
  visits: number;
};

export type DayTotal = { day: string; views: number; visits: number };

export function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** A round top for the graph that splits into four whole-number steps (4, 8, 20, 40, 100…). */
export function niceMax(n: number) {
  const raw = Math.max(1, n) / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((s) => s >= raw && Number.isInteger(s)) ?? Math.ceil(raw);
  return step * 4;
}

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** One point per day: "Fri" / "30 Oct". */
export function dayPoints(days: DayTotal[]): ChartPoint[] {
  return days.map((d) => {
    const date = utc(d.day);
    return {
      key: d.day,
      top: date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
      bottom: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      title: date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
      views: d.views,
      visits: d.visits,
    };
  });
}

/** One point per month: "Oct" / "2026". Days must be in order. */
export function monthPoints(days: DayTotal[]): ChartPoint[] {
  const months = new Map<string, { views: number; visits: number }>();
  for (const d of days) {
    const m = d.day.slice(0, 7);
    const t = months.get(m) ?? { views: 0, visits: 0 };
    t.views += d.views;
    t.visits += d.visits;
    months.set(m, t);
  }
  return [...months.entries()].map(([m, t]) => {
    const date = utc(`${m}-01`);
    return {
      key: m,
      top: date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      bottom: date.toLocaleDateString("en-GB", { year: "numeric", timeZone: "UTC" }),
      title: date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
      ...t,
    };
  });
}

export function DailyChart({ points, compact = false, label = "Page views and visits" }: { points: ChartPoint[]; compact?: boolean; label?: string }) {
  // The phone version uses a narrower drawing so the numbers stay readable.
  const W = compact ? 360 : 720;
  const H = compact ? 240 : 250;
  const pad = { l: 40, r: 26, t: 12, b: 40 };
  const max = niceMax(Math.max(1, ...points.map((d) => d.views)));
  const x = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (points.length - 1));
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const line = (key: "views" | "visits") => points.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");
  const area = `${line("views")} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  // Label every point when there's room, otherwise every Nth (always the last one).
  const room = compact ? 7 : 12;
  const every = Math.max(1, Math.ceil(points.length / room));
  const showLabel = (i: number) => (points.length - 1 - i) % every === 0;
  const fillId = compact ? "chartFillS" : "chartFill";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b3d91" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0b3d91" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="currentColor" strokeOpacity="0.1" />
          <text x={pad.l - 6} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.55">
            {Math.round(max * f)}
          </text>
        </g>
      ))}
      <path d={area} fill={`url(#${fillId})`} />
      <path d={line("views")} fill="none" stroke="#0b3d91" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={line("visits")} fill="none" stroke="#e3a82a" strokeWidth="2.5" strokeDasharray="6 4" strokeLinejoin="round" />
      {points.map((d, i) => (
        <g key={d.key}>
          <circle cx={x(i)} cy={y(d.views)} r={points.length > 40 || (compact && points.length > 14) ? 2 : 3.5} fill="#0b3d91">
            <title>{`${d.title}: ${d.views} views, ${d.visits} visits`}</title>
          </circle>
          {showLabel(i) && (
            <text x={x(i)} y={H - 22} textAnchor="middle" fontSize="11" fill="currentColor">
              <tspan fillOpacity="0.8" fontWeight="600">
                {d.top}
              </tspan>
              <tspan x={x(i)} dy="14" fillOpacity="0.55">
                {d.bottom}
              </tspan>
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function ChartLegend() {
  return (
    <p className="flex items-center gap-4 text-xs text-foreground/70">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-1 w-5 rounded bg-[#0b3d91]" /> Page views
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-1 w-5 rounded border-t-2 border-dashed border-[#e3a82a]" /> Visits
      </span>
    </p>
  );
}
