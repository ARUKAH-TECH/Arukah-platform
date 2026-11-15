import type { PublicMedia } from "@/db/projects";

// Photos for projects that are kept with the website itself (public/works/),
// added by the developer when the owner sends them in chat. They show
// together with any photos uploaded in Admin → Projects. Learners' work:
// names blurred and no faces, with the school's permission.

const m = (slug: string, file: string, altText: string, caption: string, width: number, height: number): PublicMedia => ({
  id: `static-${slug}-${file}`,
  kind: "image",
  url: `/works/${slug}/${file}`,
  altText,
  caption,
  width,
  height,
});

const PHOTOS: Record<string, PublicMedia[]> = {
  "faith-generation-ministry-harvest-banner-2026": [
    m("faith-generation-ministry-harvest-banner-2026", "banner.webp", "Faith Generation Ministry Fundraising and Annual Harvest banner, 29 November 2026", "The finished banner design", 1600, 1000),
  ],
  "jhs1-design-in-nature-projects": [
    m("jhs1-design-in-nature-projects", "water-cycle.webp", "JHS 1 model of the water cycle with sun, clouds, rain, mountains and a river, made from cardboard, cotton and modelling dough", "The Water Cycle: 3-D model", 1200, 1600),
    m("jhs1-design-in-nature-projects", "solar-system.webp", "JHS 1 poster of the solar system with modelled planets on painted orbits", "The Solar System", 1600, 1200),
    m("jhs1-design-in-nature-projects", "digestive-system.webp", "JHS 1 cardboard collage of the human digestive system with labelled organs", "The Digestive System: cardboard collage", 1080, 1440),
    m("jhs1-design-in-nature-projects", "housefly-life-cycle.webp", "JHS 1 drawing of the four stages of the housefly's life cycle", "The Four Stages of a Housefly", 1600, 860),
  ],
};

export const projectPhotos = (slug: string) => PHOTOS[slug] ?? [];
