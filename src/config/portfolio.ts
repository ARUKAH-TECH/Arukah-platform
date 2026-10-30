// Completed ARUKAH TECH work, shown on the ARUKAH TECH page and the home page.
// Only finished, real projects are listed here.

export interface PortfolioItem {
  id: string;
  kind: string;
  title: string;
  client: string;
  text: string;
  points: string[];
  image: { src: string; width: number; height: number; alt: string };
  link?: { href: string; label: string };
  note?: string;
}

export const PORTFOLIO: PortfolioItem[] = [
  {
    id: "bethel-website",
    kind: "Website",
    title: "Bethel Inspiration Foundation website",
    client: "Bethel Inspiration Foundation · Bethel Inspiration Overcommers Ministry Int",
    text: "The foundation's public website: who they are, their projects and donations, the ministry, a photo gallery and contact details. Built to load fast and read well on any phone.",
    points: ["Designed and built by ARUKAH TECH", "Mobile-friendly and search-friendly", "Hosted, maintained and updated by us"],
    image: { src: "/portfolio/bethel-website.webp", width: 960, height: 540, alt: "Home page of the Bethel Inspiration Foundation website" },
    link: { href: "https://bethelinspirationfoundation.com", label: "Visit bethelinspirationfoundation.com" },
  },
  {
    id: "bethel-cms",
    kind: "Management system",
    title: "Bethel Church Management System",
    client: "Bethel Inspiration Overcommers Ministry Int",
    text: "A private church management app for the Founder, the Church Administrator and branch pastors. It installs on a phone like an app and keeps the church's records in one safe place.",
    points: [
      "Members, branches, attendance and activities",
      "Finance, approvals and reports",
      "Staff accounts by invitation, with two-step sign-in",
    ],
    image: { src: "/portfolio/bethel-church-management.webp", width: 960, height: 540, alt: "Bethel Church Management System sign-in screen" },
    note: "Private system: church data is only visible to the church's own staff.",
  },
];
