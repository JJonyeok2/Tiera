/* ---------------------------------------------------------------------------
 * Header: 링크 공유용 OG 이미지.
 *
 * next/og로 요청 시 생성한다. 정적 PNG를 두면 디자인이 바뀔 때마다 손으로
 * 다시 만들어야 한다.
 *
 * **한글 글꼴을 반드시 넘긴다.** next/og 기본 글꼴에는 한글이 없어서, 예전
 * 버전은 제목이 "AI □□ □□□"로 나갔다. 카톡·슬랙에 링크를 보내면 그게 떴다.
 * 문구와 글꼴의 관계는 lib/og-copy.ts 머리말 참고.
 *
 * 티어 알약(PRISM·GOLD…)은 뺐다. 모델 순위표 시절의 얼굴이다. 지금 이 사이트를
 * 처음 보는 사람에게 알려야 할 건 "쓸 일로 고르는 곳"이라는 사실이다.
 * ------------------------------------------------------------------------- */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_CHIPS, OG_SUBTITLE, OG_TITLE } from "@/lib/og-copy";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Tiera — ${OG_TITLE}`;

export default async function OpengraphImage() {
  const dir = join(process.cwd(), "assets/og");
  const [bold, medium] = await Promise.all([
    readFile(join(dir, "Pretendard-Bold.subset.otf")),
    readFile(join(dir, "Pretendard-Medium.subset.otf")),
  ]);

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
          background: "#0d1117",
          color: "#f4f5f7",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              display: "flex",
              borderRadius: 14,
              background: "linear-gradient(135deg,#7b68ff,#ffb868)",
            }}
          />
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>Tiera</div>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: -2,
          }}
        >
          {OG_TITLE}
        </div>
        <div style={{ marginTop: 20, fontSize: 30, fontWeight: 500, color: "#a4acb9", lineHeight: 1.45 }}>
          {OG_SUBTITLE}
        </div>

        <div style={{ marginTop: 48, display: "flex", gap: 12 }}>
          {OG_CHIPS.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                fontSize: 26,
                fontWeight: 500,
                color: "#d7dce4",
                background: "#171d26",
                border: "1px solid #333c4b",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: medium, weight: 500, style: "normal" },
      ],
    }
  );
}
/* Footer: app/opengraph-image.tsx */
