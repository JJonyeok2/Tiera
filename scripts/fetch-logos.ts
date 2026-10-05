/* ---------------------------------------------------------------------------
 * Header: 도구 로고(파비콘) 내려받기.
 *   npx tsx scripts/fetch-logos.ts
 *
 * 왜 스크립트로 두는가:
 *   **로고를 직접 그리지 않기 때문이다.** 남의 상표를 흉내 내 SVG로 만드는 건
 *   재현이고, 그건 하지 않는다. 대신 각 서비스가 자기 도메인에 공개해 둔
 *   파비콘을 받아 우리 public/logos/ 아래에 놓는다. 디렉터리가 대상을
 *   식별하려고 그 대상의 아이콘을 쓰는, 일반적인 용법이다.
 *
 * 왜 외부 URL을 화면에 그대로 박지 않는가:
 *   그러면 방문자 브라우저가 페이지 한 장마다 제3자 도메인에 37번 요청한다.
 *   폰트를 self-host한 이유(방문자 IP가 남에게 가지 않게)를 스스로 뒤집는 꼴이다.
 *   구글 파비콘 서비스 같은 걸 쓰면 더 심하다 — 누가 어떤 AI 도구 목록을 보는지가
 *   통째로 한 회사에 넘어간다.
 *
 * 2026-09-26: 이 스크립트는 작업 환경의 네트워크 제한으로 돌리지 못했고, 실제 로고는
 * 다른 경로로 받았다(scripts/process-logos.py 머리말에 출처 정리). 네트워크가 되는
 * 곳에서 새 도구 로고를 받을 때는 이걸로 받은 뒤 process-logos.py로 크롭한다.
 *
 * 받은 뒤 할 일:
 *   db/seed-tools-data.ts의 각 항목에 logoUrl: "/logos/<slug>.png"를 적고
 *   npm run db:seed-tools를 다시 돌린다. 이 스크립트가 그 목록도 출력해 준다.
 *
 * 못 받는 도구가 나오는 건 정상이다(파비콘 경로가 특이하거나 봇을 막는 경우).
 * 그런 건 logoUrl을 비워 두면 카드가 이름 첫 글자 타일로 떨어진다 —
 * 빈칸이 아니라 대체 표시라 화면이 깨지지 않는다.
 * ------------------------------------------------------------------------- */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { SEED_TOOLS } from "../db/seed-tools-data";

const OUT_DIR = path.join(process.cwd(), "public", "logos");

/** 흔히 쓰이는 아이콘 경로들. 앞에서부터 되는 걸 쓴다. */
const CANDIDATES = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/favicon-196x196.png",
  "/favicon-192x192.png",
  "/icon.png",
  "/favicon.png",
  "/favicon.ico",
];

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

async function tryFetch(url: string): Promise<{ buf: Buffer; ext: string } | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      // 일부 사이트가 기본 UA를 막는다. 브라우저처럼 보이게 한다.
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TieraLogoFetcher/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = EXT_BY_TYPE[type];
    // content-type이 이미지가 아니면 404 페이지를 200으로 준 것이다.
    if (!ext) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // 1KB 미만이면 빈 파일이거나 1x1 플레이스홀더인 경우가 많다.
    if (buf.byteLength < 1024) return null;
    return { buf, ext };
  } catch {
    return null;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const ok: { slug: string; file: string }[] = [];
  const fail: string[] = [];

  for (const t of SEED_TOOLS) {
    const origin = new URL(t.siteUrl).origin;
    let got: { buf: Buffer; ext: string } | null = null;

    for (const c of CANDIDATES) {
      got = await tryFetch(origin + c);
      if (got) break;
    }

    if (!got) {
      fail.push(t.slug);
      process.stdout.write(`✗ ${t.slug}\n`);
      continue;
    }

    const file = `${t.slug}.${got.ext}`;
    await writeFile(path.join(OUT_DIR, file), got.buf);
    ok.push({ slug: t.slug, file });
    process.stdout.write(`✓ ${t.slug} (${(got.buf.byteLength / 1024).toFixed(0)}KB ${got.ext})\n`);
  }

  console.log(`\n받음 ${ok.length} / 실패 ${fail.length}`);
  if (fail.length > 0) {
    console.log(`실패(첫 글자 타일로 떨어짐): ${fail.join(", ")}`);
  }

  console.log("\n--- db/seed-tools-data.ts에 붙여 넣을 값 ---");
  for (const x of ok) {
    console.log(`  ${x.slug}: logoUrl: "/logos/${x.file}",`);
  }
  console.log("\n붙여 넣은 뒤 npm run db:seed-tools 를 다시 돌리세요.");
}

main().catch((e) => {
  console.error("로고 수집 실패\n", e);
  process.exit(1);
});
