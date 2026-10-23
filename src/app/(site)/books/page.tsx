import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { AdBanner } from "@/features/ads/AdBanner";
import { booksPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { getPublishedBooks } from "@/db/books";
import { BookCard } from "@/features/books/BookCard";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "ZIVARUKAH BOOKS",
  description:
    "ZIVARUKAH BOOKS — buy books to read online, download, or order as printed copies in Ghana. 10% off when you buy more than three.",
  alternates: { canonical: "/books" },
};

export default async function BooksPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(booksPage));
  const books = await getPublishedBooks();

  return (
    <div>
      <AnnouncementBar branch="books" />
      <AdBanner branch="books" />
      <Hero
        logo={brands.arukah.logo}
        title="ZIVARUKAH BOOKS"
        tagline={t.text("heroTagline")}
        primaryCta={books.length ? { label: "Browse books", href: "#books" } : { label: "Get notified", href: "/contact" }}
        secondaryCta={{ label: "Back to ZIVARUKAH", href: "/" }}
      />

      {books.length > 0 && (
        <section id="books" className="py-16">
          <Container>
            <SectionHeading eyebrow="Our books" title={t.text("booksTitle")} align="center" />
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="py-16">
        <Container>
          <SectionHeading
            eyebrow="On the way"
            title={t.text("upcomingTitle")}
            align="center"
            description={t.text("upcomingText")}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {t.list("upcomingItems").map((item) => (
              <div
                key={item}
                className="rounded-xl border border-dashed border-black/15 p-4 text-center text-sm font-medium text-foreground/70 dark:border-white/15"
              >
                {item}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <AdSlot branch="books" />


      <ProjectsSection branch="books" />
    </div>
  );
}
