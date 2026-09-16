import { ImageResponse } from "next/og";

export const alt = "The Middleman — Buy and sell digital work safely";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7f3ec",
          color: "#1c1b18",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ alignItems: "center", display: "flex", fontSize: 34, fontWeight: 700 }}>
            <div style={{ background: "#f26419", borderRadius: 999, display: "flex", height: 22, marginRight: 18, width: 22 }} />
            THE MIDDLEMAN
          </div>
          <div style={{ background: "#e8e0d5", display: "flex", height: 2, margin: "36px 0 50px", width: "100%" }} />
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05, maxWidth: 980 }}>
            Buy and sell digital work without the trust problem.
          </div>
          <div style={{ color: "#6f6a63", display: "flex", fontSize: 30, marginTop: 36 }}>
            Verified creators. Clear prices. Escrow-protected payments.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
