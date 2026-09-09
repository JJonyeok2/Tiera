/* Header: 링크 공유용 OG 이미지.
   next/og로 요청 시 생성한다. 정적 PNG를 두면 디자인 토큰이 바뀔 때마다 손으로 다시 만들어야 한다. */
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tiera — AI 모델 티어표";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          background: "#0b0c0f",
          color: "#f4f5f7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              borderRadius: 16,
              background: "linear-gradient(135deg,#8be9fd,#bd93f9 45%,#ff79c6)",
            }}
          />
          <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: -2 }}>Tiera</div>
        </div>

        <div style={{ marginTop: 34, fontSize: 52, fontWeight: 700, lineHeight: 1.25 }}>
          AI 모델 티어표
        </div>
        <div style={{ marginTop: 16, fontSize: 30, color: "#a4a9b4", lineHeight: 1.45 }}>
          벤치마크 점수와 사람의 체감 평가를 나란히
        </div>

        <div style={{ marginTop: 44, display: "flex", gap: 12 }}>
          {[
            ["PRISM", "#9ad9ff"],
            ["GOLD", "#e8c66a"],
            ["SILVER", "#c3c8d1"],
            ["BRONZE", "#c08a5e"],
          ].map(([label, color]) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                fontSize: 24,
                fontWeight: 700,
                color: "#0b0c0f",
                background: color,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
/* Footer: app/opengraph-image.tsx */
