import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Basket } from "@/features/books/Basket";
import { booksPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { paymentsEnabled } from "@/server/payments";
import { WhatsAppContact } from "@/components/ui/WhatsAppContact";
import { ONLINE_FORMS_ENABLED } from "@/config/forms";

export const metadata: Metadata = {
  title: "Your basket · ZIVARUKAH BOOKS",
  robots: { index: false },
};

export const revalidate = 60;

export default async function BasketPage() {
  const t = textReader(await getPageText(booksPage));
  return (
    <div className="py-12">
      <Container>
        <Link href="/books" className="text-sm text-foreground/60 hover:text-brand-primary-text">
          ← All books
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Your basket</h1>
        <div className="mt-8">
          {ONLINE_FORMS_ENABLED ? (
            <Basket afterOrderText={t.text("afterOrder")} payOnline={paymentsEnabled()} />
          ) : (
            <WhatsAppContact
              message="Hello ZIVARUKAH BOOKS, I would like to order: "
              label="Order on WhatsApp"
              note="Orders are now taken on WhatsApp. Tell us the books, format and quantity and we'll confirm the price and how to pay."
            />
          )}
        </div>
      </Container>
    </div>
  );
}
