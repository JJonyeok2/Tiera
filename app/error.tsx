"use client";
/* ---------------------------------------------------------------------------
 * Header: 라우트 에러 경계.
 *
 * 이게 없으면 서버에서 예외가 나는 순간 Next 기본 화면
 * ("Application error: a client-side exception has occurred")이 그대로 뜬다.
 * 사용자는 뭐가 잘못됐는지도, 뭘 하면 되는지도 알 수 없다.
 *
 * 원문 메시지는 화면에 찍지 않는다. 서버 예외 메시지에는 SQL이나 접속 정보가
 * 섞여 나올 수 있다. 대신 Next가 붙여주는 digest를 보여준다 —
 * 이 값으로 서버 로그에서 해당 예외를 정확히 찾을 수 있다.
 * ------------------------------------------------------------------------- */

import { useEffect } from "react";
import Link from "next/link";
import TierStar from "@/components/tier/TierStar";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 서버 로그로 넘긴다. 사용자에게 보이는 것과 별개로 원인은 남아야 한다.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <div className="flex justify-center opacity-60">
        <TierStar tier="bronze" size={48} />
      </div>

      <h1 className="mt-5 text-lg font-bold">잠시 문제가 생겼어요</h1>
      <p className="mt-2 text-sm text-[var(--color-text-dim)]">
        데이터를 불러오지 못했습니다. 잠깐 뒤에 다시 시도하면 대부분 해결됩니다.
      </p>

      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-lg bg-[var(--color-tier-prism)] px-4 py-2 text-xs font-semibold text-white"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-text-mute)]"
        >
          랭킹으로
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-[11px] text-[var(--color-text-mute)]">
          문제가 계속되면 이 코드를 알려주세요 —{" "}
          <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
/* Footer: app/error.tsx */
