import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "How refunds work at ZIVARUKAH for books, online programmes, footwear, adverts and gifts.",
  alternates: { canonical: "/refunds" },
  openGraph: { title: "Refund Policy | ZIVARUKAH", description: "How refunds work for books, online programmes, footwear, adverts and gifts." },
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="4 November 2026"
      intro="We want you to be happy with what you pay for. This page explains when you can get your money back and how to ask for it."
    >
      <section>
        <h2>How to ask for a refund</h2>
        <ul>
          <li>Message us on WhatsApp with your name, what you paid for, the amount, the date and your payment reference (it starts with ZP- for programmes, or your order number for books).</li>
          <li>We reply within 3 working days to say whether the refund is approved.</li>
          <li>Approved refunds go back to the same mobile money number or card you paid with, normally within 14 days.</li>
          <li>Payment processing fees charged by Paystack or your mobile money provider may not be returned, unless the refund is because of our mistake or a cancellation by us.</li>
        </ul>
      </section>

      <section>
        <h2>Online programmes (classes, trainings and events)</h2>
        <ul>
          <li>Free programmes have nothing to refund.</li>
          <li>If we cancel a paid programme, you get a full refund. If we move it to a new date and you cannot attend, you can choose a full refund.</li>
          <li>If you cancel at least 24 hours before the programme starts and have not used your code, you get a refund.</li>
          <li>Once a programme has started, or your code has been used to open the joining details, the payment cannot be refunded.</li>
          <li>Your code is for you only. Sharing it is not a reason for a refund.</li>
        </ul>
      </section>

      <section>
        <h2>Books</h2>
        <ul>
          <li>Printed books: if your book arrives damaged, or you receive the wrong book, tell us within 7 days of delivery and we will replace it or refund you.</li>
          <li>Digital downloads: because a download cannot be returned, it is not refundable once downloaded, unless the file is faulty and we cannot fix it.</li>
          <li>If you cancel a printed order before it has been printed or sent, you get a full refund.</li>
        </ul>
      </section>

      <section>
        <h2>ARUKAH WEAR footwear</h2>
        <ul>
          <li>Ready-made footwear can be exchanged for another size within 7 days if it is unworn and in its original condition.</li>
          <li>Custom-made orders cannot be refunded once production has started, because they are made for you.</li>
          <li>If there is a fault in how we made it, tell us within 7 days and we will repair, replace or refund it.</li>
        </ul>
      </section>

      <section>
        <h2>ARUKAH TECH projects</h2>
        <ul>
          <li>Websites and systems are paid in stages agreed before work begins. Work already completed and delivered is not refundable.</li>
          <li>If we cannot deliver an agreed stage, we refund the payment for that stage.</li>
        </ul>
      </section>

      <section>
        <h2>ZIVA Special Classes</h2>
        <ul>
          <li>Fees cover the lessons agreed. If we cannot provide a paid lesson, we reschedule it or refund that lesson.</li>
          <li>Lessons already taught are not refundable.</li>
        </ul>
      </section>

      <section>
        <h2>Adverts</h2>
        <ul>
          <li>If we do not approve your advert, you get a full refund.</li>
          <li>If you cancel before your advert goes live, you get a full refund.</li>
          <li>Once your advert is live, days already shown are not refundable. If we remove it early through no fault of yours, we refund the days not shown.</li>
        </ul>
      </section>

      <section>
        <h2>Gifts and outreach support</h2>
        <ul>
          <li>Gifts to Repent Online Ministries and outreach support are voluntary and are not refundable.</li>
          <li>If you paid by mistake (for example the wrong amount, or twice), tell us within 7 days and we will return it.</li>
        </ul>
      </section>
    </LegalPage>
  );
}
