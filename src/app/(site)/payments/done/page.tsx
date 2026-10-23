import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { formatGhs } from "@/config/books";
import { confirmPayment } from "@/server/payments";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

// Paystack sends the visitor back here with ?reference=ZP-…
export default async function PaymentDonePage({ searchParams }: PageProps<"/payments/done">) {
  const params = await searchParams;
  const reference = String(params.reference ?? params.trxref ?? "");
  const result = await confirmPayment(reference);

  return (
    <div className="py-16">
      <Container>
        <div className="mx-auto max-w-xl">
          {result.state === "paid" ? (
            <div className="rounded-2xl bg-green-50 p-6 text-green-950 dark:bg-green-950 dark:text-green-100">
              <h1 className="text-2xl font-bold">Thank you — payment received</h1>
              <p className="mt-3 text-sm">
                We received <strong>{formatGhs(result.amountGhs)}</strong>. Paystack emails you a receipt.
              </p>
              {result.orderReference ? (
                <p className="mt-3 text-sm">
                  It has been added to your book order <span className="font-mono font-bold">{result.orderReference}</span>. We&apos;ll be in
                  touch about delivery or collection.
                </p>
              ) : (
                <p className="mt-3 text-sm">Your gift supports our outreach work. God bless you.</p>
              )}
              <p className="mt-3 text-xs opacity-70">Payment reference: {reference}</p>
            </div>
          ) : result.state === "failed" ? (
            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
              <h1 className="text-2xl font-bold">The payment didn&apos;t go through</h1>
              <p className="mt-3 text-sm text-foreground/70">No money was taken. You can try again, or contact us and we&apos;ll help.</p>
            </div>
          ) : result.state === "pending" ? (
            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
              <h1 className="text-2xl font-bold">Payment is still being confirmed</h1>
              <p className="mt-3 text-sm text-foreground/70">
                Mobile money can take a minute. Approve the prompt on your phone, then refresh this page. Reference: {reference}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
              <h1 className="text-2xl font-bold">We couldn&apos;t find that payment</h1>
              <p className="mt-3 text-sm text-foreground/70">If money left your account, please contact us with your receipt.</p>
            </div>
          )}
          <div className="mt-6 flex gap-4 text-sm font-semibold">
            <Link href="/" className="underline">Home</Link>
            <Link href="/contact" className="underline">Contact us</Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
