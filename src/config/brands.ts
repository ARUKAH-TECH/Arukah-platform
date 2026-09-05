export type BrandId = "arukah" | "tech" | "footwear" | "ziva" | "ministry";

export interface Brand {
  id: BrandId;
  name: string;
  logo: {
    src: string;
    width: number;
    height: number;
  };
}

export const brands: Record<BrandId, Brand> = {
  arukah: {
    id: "arukah",
    name: "ARUKAH",
    logo: { src: "/branding/arukah/arukah-logo.jpg", width: 1080, height: 720 },
  },
  tech: {
    id: "tech",
    name: "ARUKAH TECH",
    logo: { src: "/branding/tech/arukah-tech-logo.jpg", width: 1080, height: 1080 },
  },
  footwear: {
    id: "footwear",
    name: "ARUKAH WEAR",
    logo: { src: "/branding/footwear/arukah-wear-logo.jpg", width: 1080, height: 1080 },
  },
  ziva: {
    id: "ziva",
    name: "ZIVA Special Classes",
    logo: { src: "/branding/ziva/ziva-logo.jpg", width: 272, height: 278 },
  },
  ministry: {
    id: "ministry",
    name: "Repent Online Ministries",
    logo: { src: "/branding/ministry/repent-online-ministries-logo.jpg", width: 988, height: 1280 },
  },
};
