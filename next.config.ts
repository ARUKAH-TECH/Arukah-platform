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

// Standard browser protections for every page.
const securityHeaders = [
  // Browsers must use HTTPS for this site for the next two years.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Don't guess file types (stops some upload-based attacks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other websites can't show these pages inside a frame (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Send only the site name, not full addresses, to other websites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site never needs the camera, microphone or location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
