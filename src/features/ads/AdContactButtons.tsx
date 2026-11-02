"use client";

import { countAdClick, intlDigits, isUsablePhone } from "@/features/ads/adContact";

/** Under a video advert: the advertiser's number with WhatsApp and Call buttons (each tap is counted). */
export function AdContactButtons({ id, label, phone, primary }: { id: string; label: string; phone: string; primary: "whatsapp" | "call" }) {
  if (!isUsablePhone(phone)) return null;
  const digits = intlDigits(phone);
  const text = `Hello${label && label !== "Sponsored" ? ` ${label}` : ""}, I saw your advert on zivarukah.com.`;
  const whatsapp = (
    <a
      key="wa"
      href={`https://wa.me/${digits}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={() => countAdClick(id)}
      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-black hover:opacity-90"
    >
      💬 WhatsApp
    </a>
  );
  const call = (
    <a
      key="call"
      href={`tel:+${digits}`}
      onClick={() => countAdClick(id)}
      className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-4 py-2 text-sm font-bold hover:border-brand-primary-text dark:border-white/20"
    >
      📞 Call
    </a>
  );
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">
        {label !== "Sponsored" ? `${label}: ` : ""}
        {phone}
      </span>
      {primary === "call" ? [call, whatsapp] : [whatsapp, call]}
    </div>
  );
}
