export type BrandId = "arukah" | "tech" | "footwear" | "ziva" | "ministry";

export interface Brand {
  id: BrandId;
  name: string;
  logo: {
    src: string;
    width: number;
    height: number;
    /**
     * Backdrop color needed behind the logo on light backgrounds. Only set
     * when the logo's own artwork has white lettering that's illegible
     * without a dark backdrop (currently just ARUKAH TECH, whose wordmark
     * and service labels are white) — everything else sits directly on
     * the page background with no box around it.
     */
    background?: string;
  };
}

export const brands: Record<BrandId, Brand> = {
  arukah: {
    id: "arukah",
    name: "ARUKAH",
    logo: { src: "/branding/arukah/arukah-logo-transparent.png", width: 1080, height: 720 },
  },
  tech: {
    id: "tech",
    name: "ARUKAH TECH",
    logo: {
      src: "/branding/tech/arukah-tech-logo-transparent.png",
      width: 1080,
      height: 1080,
      background: "#14110c",
    },
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
    logo: {
      src: "/branding/ministry/repent-online-ministries-logo-transparent.png",
      width: 988,
      height: 1280,
    },
  },
};
