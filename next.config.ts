import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
