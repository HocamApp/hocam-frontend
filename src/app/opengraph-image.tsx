import { ImageResponse } from "next/og";

export const alt = "Hocam — Doğrulanmış YKS hocalarıyla online özel ders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fff8f5",
          color: "#211a1a",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            maxWidth: "1000px",
          }}
        >
          <div style={{ color: "#e83e72", display: "flex", fontSize: 48, fontWeight: 700 }}>
            HOCAM
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.08 }}>
            Doğrulanmış YKS hocalarıyla online özel ders
          </div>
          <div style={{ color: "#645b5b", display: "flex", fontSize: 32 }}>
            TYT ve AYT için hocaları karşılaştır, sana uygun olanı seç.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
