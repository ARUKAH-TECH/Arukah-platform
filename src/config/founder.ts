// The founder and the meaning of the name — shared by the About page, the
// home page and book pages, and given to search engines as structured data
// (schema.org) so Google/Bing can connect the brand, the founder and the books.
// Everything here is public information the founder chose to publish.

import { socialLinks } from "@/config/social";

export const FOUNDER = {
  name: "Shepherd Justice Sarpong Oduro",
  legalName: "Sarpong Oduro Justice",
  alternateNames: ["Sarpong Oduro Justice", "Justice Sarpong Oduro", "Shepherd Justice Sarpong"],
  title: "Founder and Leader of ZIVARUKAH and Repent Online Ministries",
  photo: { src: "/branding/founder/shepherd-justice-sarpong-oduro.webp", width: 655, height: 826 },
  location: { region: "Ashanti Region", country: "GH" },
};

/** One sentence used in search descriptions. */
export const NAME_MEANING_SHORT = "ZIVARUKAH joins two Hebrew words: ZIVA (light, the light of God) and ARUKAH (healing, total restoration).";

export const ORG_DESCRIPTION =
  "ZIVARUKAH, from the Hebrew ZIVA (light of God) and ARUKAH (total restoration), is a Ghanaian brand founded and led by Shepherd Justice Sarpong Oduro. " +
  "It brings God's light and restoration to people spiritually and physically through ARUKAH TECH, ARUKAH WEAR, ZIVA Special Classes, the ZIVA Literacy app, ARUKAH MEDIA, ZIVARUKAH BOOKS and Repent Online Ministries.";

/** schema.org Person for the founder. */
export function founderLd(site: string) {
  const base = site.replace(/\/$/, "");
  return {
    "@type": "Person",
    "@id": `${base}/#founder`,
    name: FOUNDER.name,
    alternateName: FOUNDER.alternateNames,
    honorificPrefix: "Shepherd",
    givenName: "Justice",
    familyName: "Sarpong Oduro",
    jobTitle: "Founder and Leader",
    description:
      "Ghanaian minister, teacher, author and entrepreneur; founder and leader of ZIVARUKAH and Repent Online Ministries. Author of The Wicked and Unforgiving Student.",
    image: `${base}${FOUNDER.photo.src}`,
    url: `${base}/about`,
    worksFor: { "@id": `${base}/#organization` },
    homeLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: FOUNDER.location.region,
        addressCountry: FOUNDER.location.country,
      },
    },
    knowsAbout: ["Christian ministry", "Bible teaching", "Evangelism", "Teaching", "Literacy", "Software", "Footwear making", "Writing"],
    // Only real profile pages (search-result and chat links are left out).
    sameAs: socialLinks.map((link) => link.href).filter((href) => !href.includes("/search/") && !href.includes("wa.me")),
  };
}
