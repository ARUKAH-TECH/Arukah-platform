import { permanentRedirect } from "next/navigation";

// ARUKAH MEDIA was retired from the public site in November 2026.
// Old links and search results go to the homepage instead of a dead page.
export default function MediaPage() {
  permanentRedirect("/");
}
