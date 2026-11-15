import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "ForkCast: which USC dining hall has food you can eat, every meal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when someone shares the link in iMessage, Slack or social apps. */
export default async function OpengraphImage() {
  const mark = `data:image/png;base64,${(await readFile(join(process.cwd(), "public", "logo-mark.png"))).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#faf7f2", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <img src={mark} width={112} height={112} alt="" />
              <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: -3 }}>
                <span style={{ color: "#1c1917" }}>Fork</span>
                <span style={{ color: "#990000" }}>Cast</span>
              </div>
            </div>
            <div style={{ fontSize: 40, color: "#44403c", marginTop: 12, maxWidth: 560 }}>Your forecast for USC dining, built around what you can eat.</div>
          </div>
          <div style={{ fontSize: 26, color: "#78716c" }}>EVK · Parkside · USC Village</div>
        </div>
        <div
          style={{
            width: 430,
            display: "flex",
            flexDirection: "column",
            background: "#990000",
            borderRadius: 40,
            padding: 40,
            color: "white",
            boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            alignSelf: "center",
          }}
        >
          <div style={{ fontSize: 24, color: "#ffcc00", fontWeight: 700, letterSpacing: 2 }}>DINNER · GO TO</div>
          <div style={{ fontSize: 58, fontWeight: 800, marginTop: 8 }}>USC Village</div>
          <div style={{ fontSize: 26, color: "#ffcc00", marginTop: 14 }}>4 min walk from your dorm</div>
          <div style={{ fontSize: 26, marginTop: 14, opacity: 0.92 }}>12 mains fit you. No sesame per USC labels.</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 22, background: "rgba(255,255,255,0.15)", borderRadius: 999, padding: "8px 18px", alignSelf: "flex-start" }}>
            Checked against USC labels
          </div>
        </div>
      </div>
    ),
    size,
  );
}
