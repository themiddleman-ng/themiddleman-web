import { naira, type PublicGigCard } from "@/lib/og/public-gig";

const ink = "#1E1E22";
const bone = "#F5F2EC";
const muted = "#A1A1AA";
const peach = "#F97316";
const sans = "Noto Sans";

export function defaultOgCard(logoSrc: string | null) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: ink, color: bone, padding: 72, fontFamily: sans }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {logoSrc ? <img src={logoSrc} width={56} height={56} alt="" style={{ borderRadius: 12 }} /> : null}
          <div style={{ display: "flex", marginLeft: 18, fontSize: 28, fontWeight: 700, fontFamily: sans }}>The Middleman</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980, fontFamily: sans }}>
            Find digital products made by Nigerian creators.
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: muted, fontFamily: sans }}>
            Purchases are paused. Browsing does not start a payment.
          </div>
        </div>
      </div>
    </div>
  );
}

export function gigOgCard(gig: PublicGigCard, logoSrc: string | null, coverSrc: string | null) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: ink, color: bone, fontFamily: sans }}>
      {coverSrc ? (
        <img src={coverSrc} width={480} height={630} alt="" />
      ) : (
        <div style={{ display: "flex", width: 28, height: 630, background: peach }} />
      )}
      <div style={{ display: "flex", width: coverSrc ? 720 : 1172, flexDirection: "column", justifyContent: "space-between", padding: 56 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {logoSrc ? <img src={logoSrc} width={48} height={48} alt="" style={{ borderRadius: 10 }} /> : null}
          <div style={{ display: "flex", marginLeft: 14, fontSize: 24, fontWeight: 700, fontFamily: sans }}>The Middleman</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, fontFamily: sans }}>{gig.title}</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 42, fontWeight: 700, color: peach, fontFamily: sans }}>{gig.priceNgn > 0 ? naira(gig.priceNgn) : "Free example"}</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 24, lineHeight: 1.35, color: muted, fontFamily: sans }}>{gig.description}</div>
        </div>
      </div>
    </div>
  );
}
