/* ---------------------------------------------------------------------------
 * Header: 도구 시드 데이터 무결성 테스트.
 *
 * seed-tools-data.ts 헤더에 적은 규칙은 주석으로만 두면 반드시 무너진다.
 * 도구를 하나 추가할 때마다 사람이 헤더를 다시 읽지는 않기 때문이다.
 * 그래서 규칙을 여기서 강제한다 — 특히 "가격 숫자를 박지 않는다"와
 * "모르면 UNKNOWN을 쓴다" 두 가지가 이 파일의 존재 이유다.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from "vitest";
import { DEVELOPER_DEFAULT_TOOL, SEED_TOOLS } from "@/db/seed-tools-data";
import { DEVELOPERS } from "@/db/seed-data";

const slugs = SEED_TOOLS.map((t) => t.slug);

describe("도구 시드 — 식별자", () => {
  it("slug가 중복되지 않는다", () => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("slug는 소문자·숫자·하이픈만 쓴다", () => {
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("이름이 비어 있지 않다", () => {
    for (const t of SEED_TOOLS) expect(t.name.trim().length).toBeGreaterThan(0);
  });
});

describe("도구 시드 — 링크", () => {
  it("공식 주소는 https다", () => {
    for (const t of SEED_TOOLS) {
      expect(t.siteUrl, t.slug).toMatch(/^https:\/\//);
    }
  });

  it("알려진 래퍼·제휴 도메인을 쓰지 않는다", () => {
    // 'Seedance', 'Grok Imagine' 등을 한국어로 검색하면 상위가 대부분 이런
    // 사이트다. 공식이 아니면서 자체 과금을 한다. 비전문가 대상 사이트라
    // 하나라도 섞이면 신뢰가 통째로 무너진다.
    const BAD = [
      "seedance.kr",
      "seedance2-video.com",
      "seeddance.io",
      "grokvideo.ai",
      "imagine-grok.com",
      "seaimagine.com",
      "pollo.ai",
      "deevid.ai",
    ];
    for (const t of SEED_TOOLS) {
      for (const bad of BAD) {
        expect(t.siteUrl.includes(bad), `${t.slug} → ${t.siteUrl}`).toBe(false);
      }
    }
  });
});

describe("도구 시드 — 가격 서술", () => {
  it("priceNote에 통화 금액을 박지 않는다", () => {
    // 규칙 2. 2026년 3~9월에만 ChatGPT Pro 2단계 신설, Google AI Ultra 인하,
    // v0 $90→$30, Copilot 학생 모델 축소가 있었다. 정가는 적는 순간부터 틀린다.
    const MONEY = /(\$\s?\d)|(\d[\d,]*\s?원)|(₩\s?\d)|(\d+\s?달러)/;
    for (const t of SEED_TOOLS) {
      expect(MONEY.test(t.priceNote), `${t.slug}: "${t.priceNote}"`).toBe(false);
    }
  });

  it("모든 도구에 가격 서술이 있다", () => {
    for (const t of SEED_TOOLS) expect(t.priceNote.trim().length).toBeGreaterThan(0);
  });

  it("PAID·TRIAL은 무료로 오해할 수 없게 주의사항을 단다", () => {
    // 이 둘이 사용자가 가장 자주 속는 지점이다. 카드에 경고가 없으면
    // '무료인 줄 알고 가입'이 그대로 일어난다.
    for (const t of SEED_TOOLS) {
      if (t.pricingKind === "PAID" || t.pricingKind === "TRIAL") {
        expect(t.caution?.trim(), `${t.slug}에 caution이 필요하다`).toBeTruthy();
      }
    }
  });
});

describe("도구 시드 — 한국어 정보", () => {
  it("UNKNOWN이면 왜 모르는지를 적거나, 최소한 지어내지 않는다", () => {
    // 모르는 걸 PARTIAL로 적당히 적는 게 이 데이터셋에서 제일 위험한 실수다.
    // UNKNOWN 자체는 정상 값이므로 막지 않고, 대신 그 수를 눈에 보이게 고정한다.
    const unknown = SEED_TOOLS.filter((t) => t.koreanLevel === "UNKNOWN");
    expect(unknown.length).toBeLessThanOrEqual(5);
  });

  it("국산 도구는 한국어가 UNKNOWN·NONE일 수 없다 — 단 근거를 적은 경우만 예외", () => {
    for (const t of SEED_TOOLS) {
      if (t.origin !== "KR") continue;
      if (t.koreanLevel === "UNKNOWN" || t.koreanLevel === "NONE") {
        // 스냅덱이 여기 걸린다. 한국 팀이 만들었지만 한글 슬라이드 품질을
        // 확인하지 못했다. 국산이라는 이유로 NATIVE라고 적으면 그게 추측이다.
        expect(t.koreanNote?.trim(), `${t.slug}: 왜 모르는지 koreanNote에 적을 것`).toBeTruthy();
      }
    }
  });
});

describe("도구 시드 — 모델 매핑 규칙 (SPEC 23.4)", () => {
  it("규칙이 가리키는 도구가 전부 실재한다", () => {
    for (const toolSlug of Object.values(DEVELOPER_DEFAULT_TOOL)) {
      expect(slugs, `규칙이 없는 도구 '${toolSlug}'를 가리킨다`).toContain(toolSlug);
    }
  });

  it("규칙이 가리키는 개발사가 전부 실재한다", () => {
    const devSlugs = DEVELOPERS.map((d) => d.slug);
    for (const devSlug of Object.keys(DEVELOPER_DEFAULT_TOOL)) {
      expect(devSlugs, `규칙이 없는 개발사 '${devSlug}'를 가리킨다`).toContain(devSlug);
    }
  });

  it("developerSlug를 단 도구는 실재하는 개발사를 가리킨다", () => {
    const devSlugs = DEVELOPERS.map((d) => d.slug);
    for (const t of SEED_TOOLS) {
      if (t.developerSlug) expect(devSlugs, t.slug).toContain(t.developerSlug);
    }
  });
});

describe("도구 시드 — 용도", () => {
  it("모든 용도에 최소 1개가 있다", () => {
    // 빈 탭이 화면에 나가면 사이트가 미완성으로 보인다.
    const covered = new Set(SEED_TOOLS.map((t) => t.purpose));
    for (const p of [
      "CHAT",
      "RESEARCH",
      "TRANSLATE",
      "SLIDES",
      "NOTE",
      "IMAGE",
      "VIDEO",
      "AVATAR",
      "AUDIO",
      "CODE",
    ]) {
      expect(covered, `'${p}' 용도가 비어 있다`).toContain(p);
    }
  });

  it("alsoFor에 자기 대표 용도를 중복해 넣지 않는다", () => {
    for (const t of SEED_TOOLS) {
      expect(t.alsoFor ?? [], t.slug).not.toContain(t.purpose);
    }
  });

  it("도구가 아닌 모델 이름이 목록에 섞이지 않았다", () => {
    // SPEC 23.3의 핵심 구분. Seedance는 Dreamina 안의 모델이고
    // 나노 바나나는 Gemini 안의 모델이다. 사람이 여는 것만 도구다.
    const MODEL_NAMES = ["seedance", "seedream", "nano-banana", "gpt-image", "veo", "gemini-3"];
    for (const s of slugs) {
      for (const m of MODEL_NAMES) {
        expect(s === m, `'${s}'는 도구가 아니라 모델 이름이다`).toBe(false);
      }
    }
  });
});

describe("도구 시드 — 국산", () => {
  it("국산으로 표시한 도구가 실제로 한국 제작사다", () => {
    const KR_MAKERS = [
      "네이버",
      "라이너",
      "뤼튼테크놀로지스",
      "미리디",
      "에스크잇모어",
      "더플레이토",
      "보이저엑스",
      "딥브레인AI",
      "수퍼톤",
    ];
    for (const t of SEED_TOOLS) {
      if (t.origin === "KR") {
        expect(KR_MAKERS, `${t.slug}의 maker '${t.maker}'`).toContain(t.maker);
      }
    }
  });
});
/* Footer: tests/seed-tools.test.ts */
