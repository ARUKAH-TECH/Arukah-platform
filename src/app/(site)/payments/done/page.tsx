import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BOOK_FORMATS, formatGhs } from "@/config/books";
import { whatsappLink } from "@/config/forms";
import { confirmPayment } from "@/server/payments";
import { bookFileLink, confirmQuickPayment } from "@/server/quickPayments";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

type View =
  | { state: "paid"; amountGhs: number; heading: string; lines: string[]; whatsapp: string | null; file?: { url: string; download: boolean } | null }
  | { state: "pending" | "failed" | "unknown" };

async function load(reference: string): Promise<View> {
  if (reference.startsWith("ZS-")) {
    const r = await confirmQuickPayment(reference);
    if (r.state !== "paid") return r;
    if (r.kind === "book") {
      const format = BOOK_FORMATS.find((f) => f.id === r.bookFormat)?.label ?? "";
      const item = `${r.quantity} × "${r.bookTitle}"${format ? ` (${format})` : ""}`;
      const isPrint = r.bookFormat === "print";
      const file = isPrint ? null : await bookFileLink(reference);
      if (file) {
        return {
          state: "paid",
          amountGhs: r.amountGhs,
          heading: "Thank you — your book is ready",
          lines: [
            `You paid for ${item}.`,
            "Tap the button to open your book. Bookmark this page: you can come back to it for 30 days to open the book again.",
          ],
          whatsapp: null,
          file,
        };
      }
      return {
        state: "paid",
        amountGhs: r.amountGhs,
        heading: "Thank you — payment received",
        lines: [
          `You paid for ${item}.`,
          isPrint
            ? "Tap the button below to send us your payment reference on WhatsApp, with where to deliver or when you'll collect."
            : "Tap the button below to send us your payment reference on WhatsApp, and we'll send your book.",
        ],
        whatsapp: whatsappLink(
          `Hello ZIVARUKAH BOOKS, I have paid for ${item}.\nPayment reference: ${reference}\n${isPrint ? "Deliver to / I will collect: " : "Please send my book."}`,
        ),
      };
    }
    return {
      state: "paid",
      amountGhs: r.amountGhs,
      heading: "Thank you for your gift",
      lines: [r.outreachTitle ? `Your gift supports "${r.outreachTitle}".` : "Your gift supports our outreach work.", "God bless you."],
      whatsapp: null,
    };
  }
  const r = await confirmPayment(reference);
  if (r.state !== "paid") return r;
  return {
    state: "paid",
    amountGhs: r.amountGhs,
    heading: "Thank you — payment received",
    lines: r.orderReference ? [`It has been added to your book order ${r.orderReference}.`] : ["Your gift supports our outreach work. God bless you."],
    whatsapp: null,
  };
}

// Paystack sends the visitor back here with ?reference=…
export default async function PaymentDonePage({ searchParams }: PageProps<"/payments/done">) {
  const params = await searchParams;
  const reference = String(params.reference ?? params.trxref ?? "");
  const view = await load(reference);

  return (
    <div className="py-16">
      <Container>
        <div className="mx-auto max-w-xl">
          {view.state === "paid" ? (
            <div className="rounded-2xl bg-green-50 p-6 text-green-950 dark:bg-green-950 dark:text-green-100">
              <h1 className="text-2xl font-bold">{view.heading}</h1>
              <p className="mt-3 text-sm">
                We received <strong>{formatGhs(view.amountGhs)}</strong>.
              </p>
              {view.lines.map((line) => (
                <p key={line} className="mt-3 text-sm">
                  {line}
                </p>
              ))}
              <p className="mt-4 text-sm">
                Payment reference: <span className="font-mono font-bold">{reference}</span> — please keep it.
              </p>
              {view.file && (
                <a
                  href={view.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-brand-on-primary"
                >
                  {view.file.download ? "Download your book (PDF)" : "Open your book (PDF)"}
                </a>
              )}
              {view.whatsapp && (
                <a
                  href={view.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-black"
                >
                  Send reference on WhatsApp
                </a>
              )}
            </div>
          ) : view.state === "failed" ? (
            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
              <h1 className="text-2xl font-bold">The payment didn&apos;t go through</h1>
              <p className="mt-3 text-sm text-foreground/70">No money was taken. You can go back and try again, or message us on WhatsApp.</p>
            </div>
          ) : view.state === "pending" ? (
            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
              <h1 className="text-2xl font-bold">Payment is still being confirmed</h1>
              <p className="mt-3 text-sm text-foreground/70">
                Mobile Money can take a minute. Approve the prompt on your phone with your PIN, then refresh this page. Reference: {reference}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
              <h1 className="text-2xl font-bold">We couldn&apos;t find that payment</h1>
              <p className="mt-3 text-sm text-foreground/70">If money left your account, please message us on WhatsApp with your receipt.</p>
            </div>
          )}
          <div className="mt-6 flex gap-4 text-sm font-semibold">
            <Link href="/" className="underline">Home</Link>
            <Link href="/books" className="underline">Books</Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
