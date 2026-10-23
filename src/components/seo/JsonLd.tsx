// Structured data (schema.org JSON-LD) helps search engines understand what a
// page is about and can show richer results. Content here is our own static
// data, serialised safely (no "</script>" can break out).
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
