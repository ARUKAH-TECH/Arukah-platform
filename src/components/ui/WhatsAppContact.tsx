import { WHATSAPP_USERNAME, whatsappLink } from "@/config/forms";

/** Used instead of a form: opens a WhatsApp chat (by username) with a ready message. */
export function WhatsAppContact({
  message,
  label = "Message us on WhatsApp",
  dark = false,
  note,
}: {
  message: string;
  label?: string;
  dark?: boolean;
  note?: string;
}) {
  const muted = dark ? "text-white/60" : "text-foreground/60";
  return (
    <div className={`rounded-2xl border p-6 ${dark ? "border-white/15" : "border-black/10 dark:border-white/10"}`}>
      <div className="flex flex-wrap gap-3">
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
        >
          {label}
        </a>
      </div>
      <p className={`mt-3 text-sm ${muted}`}>
        WhatsApp: <strong>@{WHATSAPP_USERNAME}</strong>
      </p>
      {note && <p className={`mt-4 text-sm leading-6 ${muted}`}>{note}</p>}
    </div>
  );
}
