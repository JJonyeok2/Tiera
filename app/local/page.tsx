/* ---------------------------------------------------------------------------
 * Header: /local — 그래픽카드 등급 목록. SPEC 25.6.
 *
 * 화면의 기본 축은 그래픽카드다. 다만 카드 한 장이 아니라 VRAM 등급으로 묶는다.
 * v1은 메모리만 계산하므로 같은 VRAM이면 결과가 같고, 카드마다 페이지를 만들면
 * 내용이 같은 문서가 여러 개 생긴다(SPEC 17.3).
 *
 * 등급 카드마다 "대화는 몇 B급까지"를 한 줄로 붙인다. 목록만 봐도 감이 오게 한다.
 * 이 페이지는 DB를 읽지 않는다 — 코드에 든 데이터만으로 정적 생성된다.
 * ------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import GpuFinder from "@/components/local/GpuFinder";
import { ExtLink } from "@/components/dev/DevBits";
import { LOCAL_CHECKED_AT, VRAM_CLASSES, gpusInClass, type VramClass } from "@/lib/local/data";
import { USE_CASES, largestFit } from "@/lib/local/vram";
import { shareMeta } from "@/lib/site";

const TITLE = "내 컴퓨터로 돌릴 수 있는 AI";
const DESC =
  "그래픽카드를 고르면 그 카드로 돌릴 수 있는 로컬 AI 모델과 실행 명령을 보여줘요. Ollama·LM Studio·Hermes Agent로 무료로 써 보세요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/local" },
  ...shareMeta({ url: "/local", title: `${TITLE} — Tiera`, description: DESC }),
};

const CHAT = USE_CASES[0];

function ClassCard({ c }: { c: VramClass }) {
  const best = largestFit(c, CHAT.context);
  const cards = gpusInClass(c);
  return (
    <li>
      <Link
        href={`/local/${c.slug}`}
        data-testid="vram-class-card"
        className="group flex h-full flex-col gap-1.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-text-mute)]"
      >
        <h3 className="text-[17px] font-bold text-[var(--color-text)]">{c.label}</h3>
        {cards.length > 0 && (
          <p className="line-clamp-2 text-[12.5px] text-[var(--color-text-mute)]">
            {cards.map((g) => g.name).join(", ")}
          </p>
        )}
        <p className="mt-auto pt-1 text-[13px] text-[var(--color-text-dim)]">
          {best ? (
            <>
              대화: <strong className="text-[var(--color-text)]">{best.paramsB}B급</strong>까지 쾌적
            </>
          ) : (
            "쾌적하게 도는 모델이 거의 없어요"
          )}
        </p>
      </Link>
    </li>
  );
}

export default function LocalHome() {
  const dedicated = VRAM_CLASSES.filter((c) => c.kind === "DEDICATED");
  const mac = VRAM_CLASSES.filter((c) => c.kind === "UNIFIED");

  return (
    <div className="space-y-10">
      <Link href="/" className="text-[13px] text-[var(--color-text-mute)] hover:underline">
        ← 도구로 돌아가기
      </Link>
      <header className="space-y-2">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[var(--color-text)]">{TITLE}</h1>
        <p className="max-w-2xl text-[14.5px] leading-relaxed text-[var(--color-text-dim)]">
          AI를 인터넷 서비스가 아니라 <strong className="text-[var(--color-text)]">내 컴퓨터에서</strong> 돌리면
          돈이 안 들고, 내 글이 밖으로 나가지 않아요. 대신 그래픽카드 메모리(VRAM)만큼만 큰 모델을 쓸 수 있어요.
          내 카드로 뭐가 되는지 골라 보세요.
        </p>
        <p className="text-[12px] text-[var(--color-text-mute)]">
          {LOCAL_CHECKED_AT} 기준 · 모든 수치는{" "}
          <Link href="/about#local" className="underline underline-offset-4">
            계산 추정치
          </Link>
          예요. 실제로 재 본 값이 아니에요.
        </p>
      </header>

      <section className="max-w-xl">
        <GpuFinder />
      </section>

      <section className="space-y-3">
        <h2 className="text-[17px] font-bold text-[var(--color-text)]">그래픽카드</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="vram-classes">
          {dedicated.map((c) => (
            <ClassCard key={c.slug} c={c} />
          ))}
        </ul>
      </section>

      <section id="mac" className="scroll-mt-20 space-y-3">
        <h2 className="text-[17px] font-bold text-[var(--color-text)]">Mac (Apple 실리콘)</h2>
        <p className="text-[13.5px] text-[var(--color-text-dim)]">
          M1~M5 칩 Mac은 그래픽카드가 따로 없고 메모리를 나눠 써요. 메모리 용량으로 고르세요.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mac.map((c) => (
            <ClassCard key={c.slug} c={c} />
          ))}
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl bg-[var(--color-surface-2)] p-5">
          <h2 className="text-[15px] font-bold text-[var(--color-text)]">내 그래픽카드 확인하는 법</h2>
          <ul className="space-y-1 text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">
            <li>
              <strong className="text-[var(--color-text)]">Windows</strong>: Ctrl+Shift+Esc로 작업 관리자 → 성능 → GPU.
              이름과 &quot;전용 GPU 메모리&quot;가 보여요.
            </li>
            <li>
              <strong className="text-[var(--color-text)]">Mac</strong>: 왼쪽 위 사과 메뉴 → 이 Mac에 관하여 →
              &quot;메모리&quot; 용량을 보세요.
            </li>
          </ul>
        </div>
        <div className="space-y-2 rounded-2xl bg-[var(--color-surface-2)] p-5">
          <h2 className="text-[15px] font-bold text-[var(--color-text)]">처음이라면</h2>
          <ol className="list-decimal space-y-1 pl-5 text-[13.5px] leading-relaxed text-[var(--color-text-dim)]">
            <li>
              <ExtLink href="https://ollama.com/download">Ollama</ExtLink>를 설치해요. 모델을 받아서 돌려 주는 무료 프로그램이에요.
              버튼으로 쓰고 싶으면 <ExtLink href="https://lmstudio.ai">LM Studio</ExtLink>도 좋아요.
            </li>
            <li>등급 페이지에서 고른 모델의 명령을 복사해 터미널에 붙여 넣어요.</li>
            <li>
              비서처럼 일을 맡기고 싶으면{" "}
              <ExtLink href="https://hermes-agent.nousresearch.com">Hermes Agent</ExtLink>를 Ollama에 연결해요.
              이때는 &quot;에이전트&quot; 기준으로 골라야 해요.
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
/* Footer: app/local/page.tsx */
