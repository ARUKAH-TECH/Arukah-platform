import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { Button } from "@/components/ui/Button";
import { brands } from "@/config/brands";

export const metadata: Metadata = {
  title: "Repent Online Ministries",
  description: "Rescue the Perishing — Repent Online Ministries.",
  alternates: { canonical: "/ministry" },
};

const futureContent = [
  "Sermons",
  "Teachings",
  "Videos",
  "Prayer programs",
  "Announcements",
  "Events",
  "Testimonies",
];

export default function MinistryPage() {
  return (
    <div data-brand="ministry" className="bg-black text-white">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 py-20 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
              Online Ministry
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Repent Online Ministries
            </h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-brand-secondary">
              Rescue the Perishing
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
              Kept visually and editorially separate from the commercial
              ARUKAH businesses. Follow along as content is published across:
            </p>
            <div className="mt-4">
              <SocialLinks />
            </div>
            <div className="mt-6">
              <Button href="/contact">Get in touch</Button>
            </div>
          </div>
          <Image
            src={brands.ministry.logo.src}
            alt="Repent Online Ministries logo"
            width={260}
            height={(260 * brands.ministry.logo.height) / brands.ministry.logo.width}
            className="mx-auto"
          />
        </div>

        <div className="border-t border-white/10 py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
            Coming soon
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            What this ministry will share
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {futureContent.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/70"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
