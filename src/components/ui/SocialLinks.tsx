import { socialLinks } from "@/config/social";

export function SocialLinks() {
  return (
    <ul className="flex flex-wrap gap-3">
      {socialLinks.map((link) => (
        <li key={link.platform}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-black/15 px-3 py-1 text-xs transition-colors hover:border-brand-primary-text hover:text-brand-primary-text dark:border-white/20"
          >
            {link.platform}
          </a>
        </li>
      ))}
    </ul>
  );
}
