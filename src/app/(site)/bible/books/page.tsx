import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { BibleShell, SearchBox } from "@/features/bible/BibleShell";
import { BookGrid } from "@/features/bible/BookGrid";

export const metadata: Metadata = {
  title: { absolute: "Books of the Bible (KJV) | R.O.M Bible Guide" },
  description: "All 66 books of the King James Bible: choose a book and chapter to read online, with read-aloud.",
  alternates: { canonical: "/bible/books" },
};

export default function BooksPage() {
  return (
    <BibleShell active="read">
      <Container>
        <div className="py-10">
          <h1 className="text-3xl font-bold tracking-tight">The Holy Bible (KJV)</h1>
          <div className="mt-4">
            <SearchBox />
          </div>
          <div className="mt-8">
            <BookGrid />
          </div>
        </div>
      </Container>
    </BibleShell>
  );
}
