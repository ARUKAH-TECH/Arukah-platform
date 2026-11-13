import { getPageText } from "@/db/pageContent";
import { socialPage } from "@/config/pages";
import { resolveSocialLinks } from "@/config/socialPlatforms";

/** The owner's social accounts (edited in Admin → Page text → Social media links). */
export async function getSocialLinks() {
  const text = await getPageText(socialPage);
  const links = Array.isArray(text.links) ? text.links : [];
  return resolveSocialLinks(links);
}

/** Round, coloured buttons for every social account. */
export async function SocialLinks({ label = true, className = "" }: { label?: boolean; className?: string }) {
  const links = await getSocialLinks();
  if (!links.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.name} (opens in a new tab)`}
            title={link.name}
            className="inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-semibold text-white shadow-sm transition hover:scale-105"
            style={{ backgroundColor: link.color, color: link.color === "#FFFC00" ? "#000" : "#fff" }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              {link.icon ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                  <path d={link.icon} />
                </svg>
              ) : (
                <span aria-hidden="true">🔗</span>
              )}
            </span>
            {label && link.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
