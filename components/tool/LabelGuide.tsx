/* ---------------------------------------------------------------------------
 * Header: "표시 보는 법" — 목록의 가격·한국어 표시가 무슨 뜻인지. SPEC 23.22.
 *
 * "무료로 시작"과 "체험만 무료"는 처음 보는 사람에게 같은 말로 읽힌다. 그런데
 * 하나는 계속 무료로 쓸 수 있고, 하나는 며칠 뒤 결제창이 뜬다 — 이 사이트가
 * 제일 먼저 알려주려는 차이다. 그래서 목록 바로 위에서 한 번 눌러 볼 수 있게 둔다.
 *
 * <details>라 JS 없이 열리고, 닫혀 있을 땐 한 줄만 차지한다. 열면 목록 위에 떠서 열린다.
 * 라벨 글자는 lib/labels.ts에서 그대로 가져온다 — 여기서 따로 적으면 라벨을
 * 고쳤을 때 설명만 옛 이름으로 남는다.
 * ------------------------------------------------------------------------- */
import type { KoreanLevel, PricingKind } from "@/db/schema";
import { KOREAN_LEVEL_LABEL, PRICING_LABEL } from "@/lib/labels";

const PRICING_MEANING: Record<PricingKind, string> = {
  FREE: "돈을 내지 않고 다 써요.",
  FREEMIUM: "무료로 쓰다가, 더 많이·더 좋게 쓰려면 결제해요.",
  TRIAL: "처음 몇 번만 무료예요. 계속 쓰려면 결제해야 해요.",
  PAID: "처음부터 결제가 필요해요.",
};

const KOREAN_MEANING: Record<KoreanLevel, string> = {
  NATIVE: "한국어를 기준으로 만들었어요.",
  GOOD: "화면·결과 모두 한국어로 무리 없어요.",
  PARTIAL: "되긴 하는데 어색한 곳이 있어요.",
  NONE: "영어로만 써야 해요.",
  UNKNOWN: "아직 직접 확인하지 못했어요.",
};

const PRICING_ORDER: PricingKind[] = ["FREE", "FREEMIUM", "TRIAL", "PAID"];
const KOREAN_ORDER: KoreanLevel[] = [
  "NATIVE",
  "GOOD",
  "PARTIAL",
  "NONE",
  "UNKNOWN",
];

export default function LabelGuide() {
  return (
    <details className="group relative text-[13px]">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1.5 text-[var(--color-text-mute)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text-dim)] [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-bold"
        >
          ?
        </span>
        표시 보는 법
      </summary>
      {/* 목록을 밀어내지 않게 아래로 띄워 연다. 열고 닫을 때 목록이 들썩이면 읽던 줄을 놓친다. */}
      <div className="absolute left-0 top-full z-20 mt-2 grid w-[min(40rem,calc(100vw-2rem))] gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] sm:grid-cols-2">
        <Group title="가격">
          {PRICING_ORDER.map((k) => (
            <Row
              key={k}
              label={PRICING_LABEL[k]}
              warn={k === "TRIAL" || k === "PAID"}
            >
              {PRICING_MEANING[k]}
            </Row>
          ))}
        </Group>
        <Group title="한국어">
          {KOREAN_ORDER.map((k) => (
            <Row key={k} label={KOREAN_LEVEL_LABEL[k]}>
              {KOREAN_MEANING[k]}
            </Row>
          ))}
        </Group>
        <p className="text-[12px] leading-relaxed text-[var(--color-text-mute)] sm:col-span-2">
          이름 옆{" "}
          <b className="font-medium text-[var(--color-text-dim)]">한국</b>은
          한국 회사가 만든 도구,{" "}
          <b className="font-medium text-[var(--color-text-dim)]">
            대학생 혜택
          </b>
          은 학생 인증으로 할인·무료가 있다는 뜻이에요. 줄을 누르면 시작하는
          법과 배울 곳이 나와요.
        </p>
      </div>
    </details>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold text-[var(--color-text-mute)]">
        {title}
      </p>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function Row({
  label,
  warn,
  children,
}: {
  label: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-2">
      <dt
        className={`font-semibold ${warn ? "text-[var(--color-tier-bronze)]" : "text-[var(--color-text)]"}`}
      >
        {label}
      </dt>
      <dd className="text-[var(--color-text-dim)]">{children}</dd>
    </div>
  );
}
/* Footer: components/tool/LabelGuide.tsx */
