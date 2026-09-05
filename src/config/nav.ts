export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: "Home", href: "/#top" },
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/#projects" },
  { label: "Ministry", href: "/#ministry" },
  { label: "Contact", href: "/#contact" },
];

export const businessNav: NavLink[] = [
  { label: "ARUKAH TECH", href: "/#tech" },
  { label: "ARUKAH WEAR", href: "/#footwear" },
  { label: "ZIVA Special Classes", href: "/#ziva" },
  { label: "ARUKAH MEDIA", href: "/#media" },
];
