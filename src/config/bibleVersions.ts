// Bible versions in the app. All are public domain (free to publish).
// KJV is built into the pages; the others load from public/bible-versions/<id>/<book>.json,
// aligned to KJV verse numbers (verses some versions leave out are empty).
// Licensed versions (NIV, AMP, NKJV) are linked to BibleGateway, not copied.
export const BIBLE_VERSIONS = [
  { id: "kjv", short: "KJV", name: "King James Version (1611)" },
  { id: "bsb", short: "BSB", name: "Berean Standard Bible (modern English)" },
  { id: "web", short: "WEB", name: "World English Bible (modern English)" },
  { id: "asv", short: "ASV", name: "American Standard Version (1901)" },
  { id: "ylt", short: "YLT", name: "Young's Literal Translation (1898)" },
  { id: "darby", short: "Darby", name: "Darby Translation (1890)" },
] as const;

export type BibleVersionId = (typeof BIBLE_VERSIONS)[number]["id"];
