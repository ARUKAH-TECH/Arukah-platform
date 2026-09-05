import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

interface HeroCta {
  label: string;
  href: string;
}

interface HeroProps {
  logo: { src: string; width: number; height: number };
  title: string;
  tagline: string;
  supportingLine?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
}

export function Hero({ logo, title, tagline, supportingLine, primaryCta, secondaryCta }: HeroProps) {
  return (
    <section id="top" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-center gap-6 text-center">
          <Image
            src={logo.src}
            alt={`${title} logo`}
            width={140}
            height={(140 * logo.height) / logo.width}
            priority
            className="rounded-2xl"
            style={{ backgroundColor: "#0a0a0a" }}
          />
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl text-lg leading-8 text-foreground/70">{tagline}</p>
          {supportingLine && (
            <p className="text-sm font-medium uppercase tracking-wider text-brand-primary">
              {supportingLine}
            </p>
          )}
          {(primaryCta || secondaryCta) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              {primaryCta && <Button href={primaryCta.href}>{primaryCta.label}</Button>}
              {secondaryCta && (
                <Button href={secondaryCta.href} variant="outline">
                  {secondaryCta.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
