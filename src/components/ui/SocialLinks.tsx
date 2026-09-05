const platforms = ["Facebook", "YouTube", "TikTok", "WhatsApp"] as const;

export function SocialLinks() {
  return (
    <ul className="flex flex-wrap gap-3">
      {platforms.map((platform) => (
        <li key={platform}>
          <span className="inline-flex items-center rounded-full border border-black/15 px-3 py-1 text-xs dark:border-white/20">
            {platform} <span className="ml-1 opacity-60">(link coming soon)</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
