"use client";
/* Header: 무한 스크롤 목록.
   첫 페이지는 서버 컴포넌트가 렌더해서 넘겨준다(LCP). 이후 페이지만 API로 가져온다. */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RankingRow from "./RankingRow";
import TierDivider from "./TierDivider";
import type { TierName } from "@/db/schema";
import type { RankingRow as Row } from "@/lib/queries";

export default function RankingList({
  initialRows,
  total,
}: {
  initialRows: Row[];
  total: number;
}) {
  const params = useSearchParams();
  const key = params.toString();

  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // 필터가 바뀌면 서버가 새 initialRows를 내려주므로 목록을 통째로 갈아끼운다.
  useEffect(() => {
    setRows(initialRows);
    setError(null);
  }, [initialRows, key]);

  const loadMore = useCallback(async () => {
    if (loading || rows.length >= total) return;
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams(key);
      sp.set("offset", String(rows.length));
      const res = await fetch(`/api/models?${sp.toString()}`);
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { data: Row[] };
      setRows((prev) => [...prev, ...json.data]);
    } catch {
      setError("더 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [key, loading, rows.length, total]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  if (rows.length === 0) {
    const q = params.get("q");
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--color-text-dim)]">
          {q ? `'${q}'와 일치하는 모델이 없어요` : "이 조건에 해당하는 모델이 없어요"}
        </p>
        <Link
          href="/"
          className="mt-3 inline-block text-xs text-[var(--color-tier-prism)] hover:underline"
        >
          필터 초기화
        </Link>
      </div>
    );
  }

  // 점수 내림차순이라 같은 티어는 연속으로 붙는다. 바뀌는 지점에서 끊기만 하면 된다.
  const groups: { tier: TierName; rows: Row[] }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.tier === r.tier) last.rows.push(r);
    else groups.push({ tier: r.tier, rows: [r] });
  }

  return (
    <>
      {groups.map((g) => (
        <section key={g.tier} aria-label={`${g.tier} 티어`}>
          <TierDivider tier={g.tier} count={g.rows.length} />
          <ul>
            {g.rows.map((r) => (
              <RankingRow key={r.slug} row={r} />
            ))}
          </ul>
        </section>
      ))}
      <div ref={sentinel} className="h-8" />
      {loading && (
        <p className="py-4 text-center text-xs text-[var(--color-text-mute)]">불러오는 중…</p>
      )}
      {error && (
        <p className="py-4 text-center text-xs text-[var(--color-down)]">
          {error}{" "}
          <button onClick={() => void loadMore()} className="underline">
            다시 시도
          </button>
        </p>
      )}
    </>
  );
}
/* Footer: components/ranking/RankingList.tsx */
