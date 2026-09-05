import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/branding/arukah/arukah-logo-transparent.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          gap: 32,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={220} height={147} alt="" />
        <div style={{ fontSize: 72, fontWeight: 700, color: "#ffffff" }}>ARUKAH</div>
        <div style={{ fontSize: 28, color: "#e3a82a" }}>
          Creating Solutions. Building Skills. Serving Communities.
        </div>
      </div>
    ),
    { ...size },
  );
}
