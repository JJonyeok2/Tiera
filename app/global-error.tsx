"use client";
/* ---------------------------------------------------------------------------
 * Header: 최상위 에러 경계 — 루트 레이아웃 자체가 깨졌을 때만 뜬다.
 *
 * app/error.tsx는 레이아웃 안에서 렌더되므로, 레이아웃이 실패하면 그것도 못 뜬다.
 * 이 파일은 레이아웃을 대체하기 때문에 html/body를 직접 그려야 한다.
 *
 * 여기서는 테마 변수도 못 쓴다고 가정한다. globals.css를 불러오는 레이아웃이
 * 죽은 상황일 수 있어서, 색은 인라인으로 최소한만 박는다.
 * ------------------------------------------------------------------------- */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0c0f",
          color: "#f4f5f7",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, padding: "0 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13, letterSpacing: 2, color: "#8b91a1", margin: 0 }}>TIERA</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 14 }}>
            페이지를 여는 데 실패했어요
          </h1>
          <p style={{ fontSize: 14, color: "#a4a9b4", lineHeight: 1.6, marginTop: 8 }}>
            잠깐 뒤에 다시 시도해 주세요.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 22,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#0b0c0f",
              background: "#9ad9ff",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
          {error.digest && (
            <p style={{ marginTop: 28, fontSize: 11, color: "#6d7382" }}>{error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
/* Footer: app/global-error.tsx */
