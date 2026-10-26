import { Fragment, type ReactNode } from "react";
import { parseArticle, type Inline } from "@/lib/articleMarkup";

// Renders article text with React elements only (no raw HTML), so it is safe
// to show anything an admin typed. Works on the server and in the editor's
// preview.

function renderInline(nodes: Inline[], key = ""): ReactNode[] {
  return nodes.map((node, i) => {
    const k = `${key}${i}`;
    switch (node.kind) {
      case "text":
        return <Fragment key={k}>{node.text}</Fragment>;
      case "bold":
        return <strong key={k}>{renderInline(node.children, `${k}-`)}</strong>;
      case "italic":
        return <em key={k}>{renderInline(node.children, `${k}-`)}</em>;
      case "link": {
        const external = /^https?:/.test(node.href) && !node.href.startsWith("https://zivarukah.com");
        return (
          <a
            key={k}
            href={node.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
            className="font-medium text-brand-primary-text underline underline-offset-2"
          >
            {renderInline(node.children, `${k}-`)}
          </a>
        );
      }
    }
  });
}

function lines(rows: Inline[][], key: string) {
  return rows.map((row, i) => (
    <Fragment key={`${key}-${i}`}>
      {i > 0 && <br />}
      {renderInline(row, `${key}-${i}-`)}
    </Fragment>
  ));
}

export function ArticleBody({ content }: { content: string }) {
  const blocks = parseArticle(content, process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  return (
    <div className="flex flex-col gap-5 text-[1.05rem] leading-8 text-foreground/85">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading":
            return block.level === 2 ? (
              <h2 key={i} id={block.id} className="mt-6 scroll-mt-24 text-2xl font-bold tracking-tight text-foreground">
                {block.text}
              </h2>
            ) : (
              <h3 key={i} id={block.id} className="mt-3 scroll-mt-24 text-xl font-semibold text-foreground">
                {block.text}
              </h3>
            );
          case "paragraph":
            return <p key={i}>{lines(block.lines, `p${i}`)}</p>;
          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-brand-primary py-1 pl-4 font-serif text-lg italic text-foreground/80">
                {lines(block.lines, `q${i}`)}
              </blockquote>
            );
          case "list": {
            const items = block.items.map((item, j) => <li key={j}>{renderInline(item, `l${i}-${j}-`)}</li>);
            return block.ordered ? (
              <ol key={i} className="ml-6 list-decimal space-y-1.5 marker:font-semibold marker:text-brand-primary-text">
                {items}
              </ol>
            ) : (
              <ul key={i} className="ml-6 list-disc space-y-1.5 marker:text-brand-primary-text">
                {items}
              </ul>
            );
          }
          case "image":
            return (
              <figure key={i} className="my-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- size unknown; images are already resized on upload */}
                <img src={block.src} alt={block.alt} loading="lazy" className="w-full rounded-xl bg-black/5 dark:bg-white/5" />
                {block.alt && <figcaption className="mt-2 text-center text-sm text-foreground/60">{block.alt}</figcaption>}
              </figure>
            );
        }
      })}
    </div>
  );
}
