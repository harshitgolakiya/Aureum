import { ImageResponse } from "next/og";

export const alt = "Aureum — The 360° Industrial Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#101a2b",
        color: "#fbfaf6",
        padding: "68px 76px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 610,
          height: 610,
          border: "1px solid rgba(183,154,88,.45)",
          borderRadius: "50%",
          right: -145,
          top: -185,
          boxShadow:
            "0 0 0 90px rgba(183,154,88,.05), 0 0 0 180px rgba(183,154,88,.025)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 44, height: 2, background: "#b79a58" }} />
          <div
            style={{
              fontSize: 17,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "#bbc3d2",
            }}
          >
            The 360° Industrial Developer
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 108 }}>
            Aureum
          </div>
          <div
            style={{
              width: 800,
              fontSize: 42,
              lineHeight: 1.22,
              letterSpacing: -1.5,
              color: "#d2cfcb",
            }}
          >
            From opportunity to sustainable long-term performance.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,.2)",
            paddingTop: 22,
            fontSize: 15,
            letterSpacing: 3,
            color: "#8a9aaf",
            textTransform: "uppercase",
          }}
        >
          <span>Intelligence · Strategy · Execution</span>
          <span>360° Perspective</span>
        </div>
      </div>
    </div>,
    size,
  );
}
