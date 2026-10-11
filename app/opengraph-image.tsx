import { ImageResponse } from "next/og";

export const alt = "The Middleman — Nigerian digital products marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f8f6f1",
          color: "#172b45",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ alignItems: "center", color: "#0b3d91", display: "flex", fontSize: 34, fontWeight: 700 }}>
            <div style={{ background: "#ff8a00", borderRadius: 999, display: "flex", height: 22, marginRight: 18, width: 22 }} />
            THE MIDDLEMAN
          </div>
          <div style={{ background: "#dce2e5", display: "flex", height: 2, margin: "36px 0 50px", width: "100%" }} />
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05, maxWidth: 980 }}>
            Find digital products made by Nigerian creators.
          </div>
          <div style={{ color: "#526577", display: "flex", fontSize: 30, marginTop: 36 }}>
            Ready-made products. Pay in naira through Paystack.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
