import { homePage } from "./home";
import { techPage, wearPage, zivaPage } from "./divisions";
import type { PageDef } from "./types";

export * from "./types";

/** Every page whose text can be edited from the admin, in menu order. */
export const EDITABLE_PAGES: PageDef[] = [homePage, techPage, wearPage, zivaPage];

export function findPage(id: string): PageDef | undefined {
  return EDITABLE_PAGES.find((page) => page.id === id);
}

export { homePage, techPage, wearPage, zivaPage };
