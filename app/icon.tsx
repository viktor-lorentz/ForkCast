import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Cardinal tile with a gold plate. */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#990000" }}>
        <div
          style={{
            width: "62%",
            height: "62%",
            borderRadius: "50%",
            background: "#ffcc00",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "62%", height: "62%", borderRadius: "50%", border: "14px solid #990000", display: "flex" }} />
        </div>
      </div>
    ),
    size,
  );
}
