/* ---------------------------------------------------------------------------
 * Header: "전체 도구 N개 둘러보기" 떠 있는 버튼.
 *
 * 첫 화면이 고르기 칸으로 꽉 차 있어서, 아래에 목록이 더 있다는 걸 모르고 떠나는
 * 사람이 생긴다. 예전엔 첫 화면 바닥에 글줄로 붙어 있었는데, 화면 높이에 따라
 * 바닥 밖으로 밀려나 안 보이기도 했다. 그래서 화면 아래 가운데에 **떠 있게** 둔다.
 *
 * - 목록이 화면에 들어오면 사라진다. 목록을 보고 있는데 "둘러보기"가 떠 있으면 거슬린다.
 *   다시 위로 올라가면 돌아온다.
 * - 누르면 목록 머리로 부드럽게 내려간다. 움직임 줄이기 설정이면 바로 이동한다.
 * - 화살표만 천천히 오르내린다(.tiera-float, app/globals.css). 글자는 가만히 둔다.
 * - JS가 없어도 그냥 `#all-tools`로 가는 링크라 동작한다.
 * ------------------------------------------------------------------------- */
"use client";

import { useEffect, useState } from "react";

const TARGET = "all-tools";

export default function ScrollCue({ count }: { count: number }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById(TARGET);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        // 목록 머리가 화면 안에 있거나, 이미 그보다 아래로 내려가 있으면 숨긴다.
        setHidden(e.isIntersecting || e.boundingClientRect.top < 0);
      },
      // 화면 바닥에서 조금 올라온 선을 기준으로 잡는다. 바닥 딱 맞춰 숨기면
      // 목록 머리와 버튼이 잠깐 겹쳐 보인다.
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  function onClick(ev: React.MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(TARGET);
    if (!target) return;
    ev.preventDefault();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
    // 주소에도 남겨서, 새로고침·공유해도 목록에서 시작한다.
    history.replaceState(null, "", `#${TARGET}`);
  }

  return (
    <a
      href={`#${TARGET}`}
      onClick={onClick}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className={`fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/95 py-2 pl-4 pr-3.5 text-[13px] font-medium text-[var(--color-text-dim)] shadow-[0_6px_24px_-8px_rgb(0_0_0/0.25)] backdrop-blur transition-[opacity,translate,color] duration-300 hover:text-[var(--color-text)] ${
        hidden
          ? "pointer-events-none translate-y-3 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      전체 도구 {count}개 둘러보기
      <span
        aria-hidden="true"
        className="tiera-float inline-block text-[14px] leading-none"
      >
        ↓
      </span>
    </a>
  );
}
/* Footer: components/site/ScrollCue.tsx */
