/* ---------------------------------------------------------------------------
 * Header: 스크롤해서 닿으면 떠오르는 상자.
 *
 * 두 겹이다. 스크롤 타임라인을 지원하는 브라우저(크롬·엣지·사파리 최신)는 CSS
 * `.scroll-grow`가 스크롤에 맞춰 크기를 키운다(app/globals.css). 지원하지 않는
 * 브라우저(파이어폭스 등)는 아래 JS가 한 번 떠오르게 한다.
 *
 * 홈 첫 화면은 "하려는 일 고르기"만 보여주고, 그 아래 전체 목록은 내려가면서
 * 한 묶음씩 나타나게 한다. 첫 화면에 목록 머리가 걸쳐 보이면 고르기 칸과 목록이
 * 한꺼번에 눈에 들어와서, 무엇부터 하라는 화면인지가 흐려졌다.
 *
 * 지켜야 할 것:
 * - **JS가 없어도 내용이 보인다.** 서버 렌더 결과는 그냥 보이는 상태이고, 숨기는 건
 *   하이드레이션 뒤 "아직 화면 아래에 있는" 상자만이다. 이미 화면 안에 있는 상자를
 *   숨겼다가 다시 띄우면 깜빡인다.
 * - 움직임 줄이기 설정이면 아무것도 숨기지 않는다.
 * - 한 번 나타나면 다시 숨기지 않는다. 위아래로 오갈 때마다 깜빡이면 읽기 어렵다.
 * - 숨겨진 동안에도 DOM과 접근성 트리에는 그대로 있다(opacity만 바꾼다). 화면
 *   낭독기와 검색엔진, 페이지 내 찾기(Ctrl+F)가 목록을 그대로 본다.
 * ------------------------------------------------------------------------- */
"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "static" | "waiting" | "shown";

export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // 서버와 첫 렌더는 "static" — 아무 효과 없이 보이는 상태로 맞춘다(하이드레이션 불일치 방지).
  const [phase, setPhase] = useState<Phase>("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    // 스크롤 타임라인을 지원하면 CSS(.scroll-grow)가 맡는다. 둘이 같이 돌면
    // 숨겼다 띄우는 것과 크기 키우기가 겹쳐서 덜컹거린다.
    if (CSS.supports?.("animation-timeline: view()")) return;
    // 이미 화면 안(또는 위)에 있으면 건드리지 않는다.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setPhase("waiting");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("shown");
          io.disconnect();
        }
      },
      // 상자 윗부분이 화면에 조금 들어온 뒤에 띄운다. 0이면 가장자리에서 이미 끝나 있다.
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const motion =
    phase === "waiting"
      ? "translate-y-5 opacity-0"
      : phase === "shown"
        ? "translate-y-0 opacity-100 transition-[opacity,transform] duration-500 ease-out"
        : "";

  return (
    <div ref={ref} className={`scroll-grow ${motion} ${className}`.trim()}>
      {children}
    </div>
  );
}
/* Footer: components/site/Reveal.tsx */
