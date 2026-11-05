export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: "Home", href: "/#top" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Articles", href: "/articles" },
  { label: "Programmes", href: "/programmes" },
  { label: "Ministry", href: "/ministry" },
  { label: "Bible", href: "/bible" },
  { label: "Contact", href: "/contact" },
];

export const businessNav: NavLink[] = [
  { label: "ARUKAH TECH", href: "/tech" },
  { label: "ARUKAH WEAR", href: "/footwear" },
  { label: "ZIVA Special Classes", href: "/ziva" },
  { label: "ZIVA Literacy app", href: "/literacy" },
  { label: "ZIVARUKAH BOOKS", href: "/books" },
];
