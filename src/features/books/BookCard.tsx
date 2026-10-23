import Image from "next/image";
import Link from "next/link";
import { formatGhs } from "@/config/books";
import type { PublicBook } from "@/db/books";
import { ApproxPrice } from "@/features/currency/ApproxPrice";

export function BookCard({ book }: { book: PublicBook }) {
  const from = book.prices.length ? Math.min(...book.prices.map((price) => price.amount)) : null;
  return (
    <Link
      href={`/books/${book.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-colors hover:border-brand-primary-text dark:border-white/10 dark:bg-zinc-900"
    >
      {book.cover ? (
        <Image
          src={book.cover.url}
          alt={`Cover of ${book.title}`}
          width={book.cover.width ?? 600}
          height={book.cover.height ?? 900}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="aspect-[2/3] w-full bg-black/5 object-cover"
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center bg-black/5 p-4 text-center text-sm font-semibold text-foreground/60 dark:bg-white/5">
          {book.title}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-semibold group-hover:text-brand-primary-text">{book.title}</h3>
        {book.author && <p className="text-xs text-foreground/60">{book.author}</p>}
        {from !== null && <p className="mt-auto pt-2 text-xs font-medium text-brand-primary-text">From {formatGhs(from)}
            <ApproxPrice ghs={from} />
          </p>}
      </div>
    </Link>
  );
}
