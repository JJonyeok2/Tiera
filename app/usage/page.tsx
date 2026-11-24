/* ---------------------------------------------------------------------------
 * Header: /usage — 지금 누가 제일 많이 쓰이나. SPEC 26.
 *
 * 숫자 하나로 승부를 내지 않는다. 잣대 세 개를 나란히 놓고 "잣대마다 1등이 다르다"를 보여준다.
 *
 * 규칙
 * - 잣대끼리 숫자를 섞지 않는다. 단위가 다르다(명 / 방문 % / 토큰 %). 합산 순위는 없다.
 * - 모든 숫자 옆에 기준 시점과 출처.
 * - 승패 말투를 쓰지 않는다. "이 잣대에서는 1등".
 * - A·B는 코드 데이터라 DB 없이도 뜬다. C만 DB를 읽고, 실패하면 그 칸만 안내로 바뀐다.
 *
 * ISR 1시간. C는 하루 한 번 갱신되고, A·B는 배포 때만 바뀐다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import WebShareTrend, { type TrendSeries } from "@/components/usage/WebShareTrend";
import { BRANDS, brandName, getBrand } from "@/lib/usage/brands";
import { APP_SOURCE, APP_USERS, WEB_SHARE, latestFullWebMonth } from "@/lib/usage/monthly";
import { getApiUsage } from "@/lib/usage/queries";
import { shareMeta } from "@/lib/site";

export const revalidate = 3600;

const TITLE = "지금 누가 제일 많이 쓰이나";
const DESC =
  "ChatGPT, Gemini, Claude 중 누가 많이 쓰일까요? 국내 앱 사용자, 세계 웹 방문, 개발자 API 사용량을 나란히 놓으면 잣대마다 1등이 달라요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/usage" },
  ...shareMeta({ url: "/usage", title: `${TITLE} — Tiera`, description: DESC }),
};

const BIG3 = BRANDS.filter((b) => b.big3);

/** 3강은 고정 색, 나머지는 회색. 색은 브랜드를 따라가고 순위를 따라가지 않는다 */
function brandColor(key: string): string {
  return getBrand(key)?.big3 ? `var(--c-brand-${key})` : "var(--color-text-mute)";
}

const fmtMonth = (m: string) => m.replace("-", ".");
const fmtMan = (n: number) => `${n.toLocaleString("ko-KR")}만 명`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function SourceLink({ label, url, secondHand }: { label: string; url: string; secondHand?: boolean }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
      {label}
      {secondHand && <span className="sr-only"> (원 출처를 인용한 보도)</span>}
    </a>
  );
}

/** 한 잣대 안의 가로 막대. 축은 그 잣대 안에서만 — 다른 잣대 막대와 길이를 비교하지 않는다 */
function Bars({ rows }: { rows: { key: string; label: string; value: number; text: string; rank?: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2 text-[13px]">
          <span className="truncate text-[var(--color-text)]">
            {r.rank && <span className="mr-1 tabular-nums text-[var(--color-text-mute)]">{r.rank}</span>}
            {r.label}
          </span>
          <span className="h-2.5 overflow-hidden rounded-r bg-[var(--color-surface-2)]">
            <span
              className="block h-full rounded-r"
              style={{ width: `${(r.value / max) * 100}%`, background: brandColor(r.key) }}
            />
          </span>
          <span className="tabular-nums text-[var(--color-text-dim)]">{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function UsagePage() {
  const api = await getApiUsage();
  const web = latestFullWebMonth();
  const webRanked = Object.entries(web.share)
    .map(([key, v]) => ({ key, v: v ?? 0 }))
    .sort((a, b) => b.v - a.v);
  const appTop = APP_USERS[0];
  const appMonth = appTop?.month ?? "";

  const tiles = [
    {
      id: "app",
      label: "국내 앱 사용자",
      top: appTop ? brandName(appTop.brand) : "–",
      value: appTop ? fmtMan(appTop.manUsers) : "–",
      second: APP_USERS[1] ? `2등 ${brandName(APP_USERS[1].brand)} ${fmtMan(APP_USERS[1].manUsers)}` : "",
      when: `${fmtMonth(appMonth)} 한 달`,
    },
    {
      id: "web",
      label: "세계 웹 방문",
      top: brandName(webRanked[0].key),
      value: fmtPct(webRanked[0].v),
      second: `2등 ${brandName(webRanked[1].key)} ${fmtPct(webRanked[1].v)}`,
      when: `${fmtMonth(web.month)} 한 달`,
    },
    api.status === "ok"
      ? {
          id: "api",
          label: "개발자 API",
          top: brandName(api.usage.shares[0].brand),
          value: fmtPct(api.usage.shares[0].share),
          second: api.usage.shares[1]
            ? `2등 ${brandName(api.usage.shares[1].brand)} ${fmtPct(api.usage.shares[1].share)}`
            : "",
          when: `${api.usage.start.slice(5).replace("-", ".")}~${api.usage.end.slice(5).replace("-", ".")} 7일`,
        }
      : {
          id: "api",
          label: "개발자 API",
          top: "–",
          // "아직 안 모였다"와 "못 불러왔다"는 다른 상황이다. 첫 배포 직후는 전자다.
          value: api.status === "empty" ? "데이터를 모으는 중이에요" : "지금은 불러오지 못했어요",
          second: "",
          when: "",
        },
  ];

  const months = WEB_SHARE.map((m) => m.month);
  const trend: TrendSeries[] = BIG3.map((b) => ({
    key: b.key,
    name: b.name,
    color: `var(--c-brand-${b.key})`,
    points: WEB_SHARE.flatMap((m) => {
      const v = m.share[b.key];
      return v === undefined ? [] : [{ month: m.month, value: v }];
    }),
  }));
  const first = WEB_SHARE.find((m) => Object.keys(m.share).length >= 7)!;

  return (
    <div className="space-y-10 pb-16 pt-7">
      <Link href="/" className="text-[13px] text-[var(--color-text-mute)] hover:underline">
        ← 도구로 돌아가기
      </Link>

      <header className="space-y-2">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[var(--color-text)]">{TITLE}</h1>
        <p className="max-w-2xl text-[14.5px] leading-relaxed text-[var(--color-text-dim)]">
          &quot;요즘 누가 제일 많이 써?&quot;에 대한 답은 <strong className="text-[var(--color-text)]">무엇으로 재느냐</strong>에
          따라 달라요. 세 가지 잣대를 나란히 놓았어요. 잣대끼리는 단위가 달라서 합치지 않았어요.
        </p>
      </header>

      <section aria-labelledby="tiles-h" className="space-y-3">
        <h2 id="tiles-h" className="text-[17px] font-bold text-[var(--color-text)]">잣대별 1등</h2>
        <ul className="grid gap-3 sm:grid-cols-3" data-testid="usage-tiles">
          {tiles.map((t) => (
            <li
              key={t.id}
              data-testid={`tile-${t.id}`}
              className="flex flex-col gap-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <span className="text-[12.5px] text-[var(--color-text-mute)]">{t.label}</span>
              {t.top === "–" ? (
                <span className="text-[14px] text-[var(--color-text-dim)]">{t.value}</span>
              ) : (
                <>
                  <span className="text-[22px] font-bold text-[var(--color-text)]">{t.top}</span>
                  <span className="text-[15px] font-semibold tabular-nums text-[var(--color-text)]">{t.value}</span>
                  <span className="text-[12.5px] text-[var(--color-text-dim)]">{t.second}</span>
                  <span className="mt-auto pt-1 text-[11.5px] text-[var(--color-text-mute)]">{t.when}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="big3-h" className="space-y-4" data-testid="big3">
        <div>
          <h2 id="big3-h" className="text-[17px] font-bold text-[var(--color-text)]">ChatGPT · Gemini · Claude</h2>
          <p className="text-[13px] text-[var(--color-text-mute)]">
            잣대마다 막대 길이의 기준이 달라요. 같은 잣대 안에서만 비교해 주세요.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-[13.5px] font-semibold text-[var(--color-text-dim)]">국내 앱 사용자 · {fmtMonth(appMonth)}</h3>
            <Bars
              rows={BIG3.map((b) => {
                const a = APP_USERS.find((x) => x.brand === b.key);
                return { key: b.key, label: b.name, value: a?.manUsers ?? 0, text: a ? fmtMan(a.manUsers) : "–" };
              })}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-[13.5px] font-semibold text-[var(--color-text-dim)]">세계 웹 방문 · {fmtMonth(web.month)}</h3>
            <Bars
              rows={BIG3.map((b) => {
                const v = web.share[b.key];
                return { key: b.key, label: b.name, value: v ?? 0, text: v === undefined ? "–" : fmtPct(v) };
              })}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-[13.5px] font-semibold text-[var(--color-text-dim)]">개발자 API · 최근 7일</h3>
            {api.status === "ok" ? (
              <Bars
                rows={BIG3.map((b) => {
                  const s = api.usage.shares.find((x) => x.brand === b.key);
                  const rank = s ? api.usage.shares.indexOf(s) + 1 : undefined;
                  return {
                    key: b.key,
                    label: b.name,
                    value: s?.share ?? 0,
                    text: s ? `${fmtPct(s.share)} · ${rank}등` : "–",
                  };
                })}
              />
            ) : (
              <p className="text-[13px] text-[var(--color-text-mute)]">지금은 불러오지 못했어요.</p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="trend-h" className="space-y-3">
        <div>
          <h2 id="trend-h" className="text-[17px] font-bold text-[var(--color-text)]">세계 웹 방문 점유율, 1년 사이</h2>
          <p className="text-[13.5px] text-[var(--color-text-dim)]">
            {fmtMonth(first.month)} ChatGPT {first.share.chatgpt}%, Claude {first.share.claude}% →{" "}
            {fmtMonth(web.month)} ChatGPT {web.share.chatgpt}%, Claude {web.share.claude}%.
          </p>
        </div>
        <WebShareTrend series={trend} months={months} />
      </section>

      <section aria-labelledby="api-h" className="space-y-3" data-testid="api-section">
        <div>
          <h2 id="api-h" className="text-[17px] font-bold text-[var(--color-text)]">개발자 API에서는</h2>
          <p className="text-[13.5px] text-[var(--color-text-dim)]">
            앱을 만드는 개발자들이 OpenRouter를 거쳐 쓴 토큰 양이에요. 사람들이 직접 쓰는 순위와 꽤 달라요.
          </p>
        </div>
        {api.status === "ok" ? (
          <>
            <Bars
              rows={api.usage.shares.slice(0, 8).map((s, i) => ({
                key: s.brand,
                label: brandName(s.brand),
                value: s.share,
                rank: i + 1,
                text:
                  fmtPct(s.share) +
                  (s.deltaPt === undefined || Math.abs(s.deltaPt) < 0.05
                    ? ""
                    : ` (${s.deltaPt > 0 ? "▲" : "▼"}${Math.abs(s.deltaPt).toFixed(1)}%p)`),
              }))}
            />
            <p className="text-[12px] text-[var(--color-text-mute)]">
              {api.usage.start} ~ {api.usage.end} (UTC) 7일 합계 기준, 괄호는 그 전 7일 대비. 상위 50개 모델 밖 합계
              {" "}{fmtPct(api.usage.otherShare)}는 순위에서 뺐어요.
            </p>
          </>
        ) : (
          <p className="text-[13.5px] text-[var(--color-text-mute)]" data-testid="api-unavailable">
            {api.status === "empty" ? "아직 7일치가 다 모이지 않았어요." : "지금은 불러오지 못했어요."} 잠시 뒤 다시 와 주세요.
          </p>
        )}
      </section>

      <section aria-labelledby="how-h" className="space-y-3 rounded-2xl bg-[var(--color-surface-2)] p-5" id="sources">
        <h2 id="how-h" className="text-[15px] font-bold text-[var(--color-text)]">잣대마다 무엇을 세고, 무엇을 못 세나</h2>
        <dl className="space-y-3 text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">
          <div>
            <dt className="font-semibold text-[var(--color-text)]">국내 앱 사용자</dt>
            <dd>
              한국인 스마트폰에서 한 달 동안 앱을 연 사람 수(추정). PC 웹으로만 쓰는 사람은 빠져요. 조사에 있는 서비스만
              비교할 수 있어요. 출처: <SourceLink {...APP_SOURCE} />
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-text)]">세계 웹 방문</dt>
            <dd>
              Similarweb이 집계하는 전 세계 생성형 AI 웹사이트 방문 중 각 사이트의 몫. 숫자가 공개된 곳은 ChatGPT·Gemini·Claude·DeepSeek·Grok·Copilot·Perplexity 7곳이에요. 앱
              사용은 안 들어가요. Similarweb이 매달 공개하는 수치를 인용한 보도에서 옮겼어요:{" "}
              {[...new Map(WEB_SHARE.map((m) => [m.source.url, m.source])).values()].map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ", "}
                  <SourceLink {...s} />
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-text)]">개발자 API</dt>
            <dd>
              OpenRouter를 거친 요청의 토큰 양. 시장 전체도, 각 회사 자체 API 사용량도 아니에요. 많이 쓰인다는 뜻이지
              성능 순위가 아니에요.
              {api.status === "ok" && (
                <>
                  {" "}Source: OpenRouter (
                  <SourceLink label="openrouter.ai/rankings" url="https://openrouter.ai/rankings" />
                  ), as of {api.usage.asOf.slice(0, 16)}. Licensed under CC BY 4.0.
                </>
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
/* Footer: app/usage/page.tsx */
