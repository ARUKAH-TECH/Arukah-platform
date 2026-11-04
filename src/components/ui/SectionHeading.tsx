interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Use "h1" when this is the page's main heading. */
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
          {eyebrow}
        </p>
      )}
      <Heading className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </Heading>
      {description && (
        <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/70">
          {description}
        </p>
      )}
    </div>
  );
}
