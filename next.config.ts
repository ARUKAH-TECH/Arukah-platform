import type { NextConfig } from "next";

// Images uploaded through the admin dashboard are served from the Supabase
// "media" storage bucket. Only that exact path on our own project is
// allowed through the image optimizer — nothing else on the internet.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null; // not configured (e.g. a bare local build) — allow nothing extra
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            port: "",
            pathname: "/storage/v1/object/public/media/**",
            search: "",
          },
        ]
      : [],
  },
  // The old Vercel production address permanently forwards to the real
  // domain. Only this exact host matches, so preview deployments
  // (arukah-platform-<hash>-arukah-tech.vercel.app) and localhost are
  // unaffected.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "arukah-platform.vercel.app" }],
        destination: "https://zivarukah.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
