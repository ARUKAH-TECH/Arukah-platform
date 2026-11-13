import { homePage } from "./home";
import { aboutPage } from "./about";
import { techPage, wearPage, zivaPage } from "./divisions";
import { advertisePage, booksPage, contactPage, mediaPage, ministryPage, projectsPage, socialPage } from "./other";
import type { PageDef } from "./types";

export * from "./types";

/** Every page whose text can be edited from the admin, in menu order. */
export const EDITABLE_PAGES: PageDef[] = [
  homePage,
  aboutPage,
  techPage,
  wearPage,
  zivaPage,
  booksPage,
  ministryPage,
  projectsPage,
  contactPage,
  advertisePage,
  socialPage,
];

export function findPage(id: string): PageDef | undefined {
  return EDITABLE_PAGES.find((page) => page.id === id);
}

export { homePage, aboutPage, techPage, wearPage, zivaPage, mediaPage, booksPage, ministryPage, projectsPage, contactPage, advertisePage, socialPage };
