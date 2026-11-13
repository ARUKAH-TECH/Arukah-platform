import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for using the ZIVARUKAH website, online programmes, books, adverts and the ZIVA Learning app.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of Use | ZIVARUKAH", description: "The terms for using the ZIVARUKAH website and services." },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="4 November 2026"
      intro="These terms apply when you use zivarukah.com, learn.zivarukah.com and the services offered through them by ZIVARUKAH VENTURES. By using the website you agree to them."
    >
      <section>
        <h2>Who we are</h2>
        <p>
          ZIVARUKAH VENTURES is founded and led by Shepherd Justice Sarpong Oduro and is based in the Ashanti Region of Ghana. It includes ARUKAH TECH,
          ARUKAH WEAR, ZIVA Online and Special Classes, the ZIVA Learning app, ZIVARUKAH BOOKS and Repent Online Ministries.
        </p>
      </section>

      <section>
        <h2>Using the website</h2>
        <ul>
          <li>Use the website lawfully and respectfully. Do not try to break, overload or get into parts of it that are not meant for you.</li>
          <li>Information you give us (for example a name and WhatsApp number when you register) must be true and yours to give.</li>
          <li>We may change, pause or remove any part of the website at any time.</li>
        </ul>
      </section>

      <section>
        <h2>Online programmes</h2>
        <ul>
          <li>When you register, you receive a personal code. Keep it private: it opens the joining details for you only.</li>
          <li>We may refuse or cancel a registration, or withdraw a code, if it is shared, misused or registered with false details.</li>
          <li>Programme times are shown in Ghana time (GMT) unless stated otherwise.</li>
          <li>
            Paid programmes follow our <Link href="/refunds" className="font-semibold underline">Refund Policy</Link>. A payment only counts once Paystack has
            confirmed it to us.
          </li>
        </ul>
      </section>

      <section>
        <h2>Books and other content</h2>
        <ul>
          <li>Books, articles, sermons, images, logos and other content on this website belong to ZIVARUKAH VENTURES or to their authors.</li>
          <li>You may read and share links to them. You may not copy, sell or republish them without written permission.</li>
          <li>Digital books are for your personal use only.</li>
        </ul>
      </section>

      <section>
        <h2>The ZIVA Learning app</h2>
        <ul>
          <li>The app at learn.zivarukah.com is free to use. It is a learning aid and does not replace a teacher, and it does not diagnose any learning difficulty.</li>
          <li>Parents and guardians are responsible for how children use it.</li>
        </ul>
      </section>

      <section>
        <h2>Adverts</h2>
        <ul>
          <li>Adverts on this website are placed by other businesses. We review them before they go live, but we do not endorse or guarantee their products or services.</li>
          <li>Any deal you make with an advertiser is between you and them.</li>
        </ul>
      </section>

      <section>
        <h2>Payments</h2>
        <ul>
          <li>Online payments are handled by Paystack. We never see or store your card details or mobile money PIN.</li>
          <li>Prices are in Ghana cedis (GHS) unless stated otherwise.</li>
          <li>
            Refunds follow our <Link href="/refunds" className="font-semibold underline">Refund Policy</Link>.
          </li>
        </ul>
      </section>

      <section>
        <h2>Limits of responsibility</h2>
        <p>
          We work hard to keep the website accurate and available, but we cannot promise it will always be error-free or online. As far as the law allows, we
          are not responsible for losses caused by using the website or by links to other websites.
        </p>
      </section>

      <section>
        <h2>Changes and law</h2>
        <p>
          We may update these terms. The date at the top shows the latest version. These terms are governed by the laws of the Republic of Ghana.
        </p>
      </section>
    </LegalPage>
  );
}
