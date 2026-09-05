import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "outline";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary-text disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-brand-primary text-brand-on-primary hover:bg-brand-primary-hover",
  secondary: "bg-brand-secondary text-brand-on-primary hover:opacity-90",
  outline:
    "border border-brand-primary-text text-brand-primary-text hover:bg-brand-primary hover:text-brand-on-primary",
};

interface ButtonOwnProps {
  variant?: Variant;
}

type ButtonAsButton = ButtonOwnProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = ButtonOwnProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (props.href) {
    const linkProps = props as ButtonAsLink;
    if (linkProps.href.startsWith("/")) {
      return <Link {...linkProps} className={classes} />;
    }
    return <a {...linkProps} className={classes} />;
  }

  return <button {...(props as ButtonAsButton)} className={classes} />;
}
