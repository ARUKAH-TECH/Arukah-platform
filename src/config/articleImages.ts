// Cover pictures for articles that are kept with the website (public/works/articles/),
// added by the developer when the owner sends them in chat. An image uploaded
// in Admin → Articles always takes priority.

export interface StaticArticleImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

const IMAGES: Record<string, StaticArticleImage> = {
  "free-creative-arts-lessons-ghana": {
    url: "/works/articles/free-creative-arts-lessons-ghana.webp",
    alt: "Free Creative Arts lessons for KG to JHS 3 in Ghana on ZIVA Learning: children drawing, modelling and painting",
    width: 1536,
    height: 1024,
  },
};

export const articleImage = (slug: string) => IMAGES[slug] ?? null;
