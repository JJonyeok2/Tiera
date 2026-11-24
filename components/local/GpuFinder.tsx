"use client";
/* ---------------------------------------------------------------------------
 * Header: 내 그래픽카드 찾기 — 이름을 치면 해당 VRAM 등급 페이지로 보낸다. SPEC 25.6.
 *
 * 사람은 "VRAM 8GB"가 아니라 "3060 Ti"로 기억한다. 그래서 입구는 카드 이름이다.
 * 띄어쓰기·대소문자·"RTX" 유무를 무시하고 맞춘다("3060ti", "rtx3060 ti" 모두).
 * 숫자만 치면(예: "12", "12gb") 용량으로 보고 등급을 바로 고른다 — 목록에 없는 카드용.
 * ------------------------------------------------------------------------- */
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { GPUS, classForMemory, gpuClass, type Gpu, type VramClass } from "@/lib/local/data";

const norm = (s: string) => s.toLowerCase().replace(/geforce|radeon|nvidia|amd|rtx|gtx|rx|[^a-z0-9]/g, "");

interface Hit {
  key: string;
  label: string;
  sub: string;
  href: string;
}

function search(q: string): Hit[] {
  const raw = q.trim().toLowerCase();
  if (!raw) return [];
  const hits: Hit[] = [];

  // 용량 직접 입력: "8", "8gb", "8 기가"
  const mem = raw.match(/^(\d{1,3})\s*(gb|기가|g)?$/);
  if (mem) {
    const c = classForMemory(Number(mem[1]), "DEDICATED");
    hits.push(
      c
        ? { key: `mem-${c.slug}`, label: `VRAM ${mem[1]}GB`, sub: `${c.label} 페이지로`, href: `/local/${c.slug}` }
        : { key: "mem-none", label: `VRAM ${mem[1]}GB`, sub: "6GB보다 작으면 로컬 모델이 거의 안 돌아가요", href: "/local/6gb" },
    );
  }

  if (/^(mac|맥|맥북|아이맥|맥미니|맥스튜디오|m[1-5])/.test(raw.replace(/\s/g, ""))) {
    hits.push({ key: "mac", label: "Mac (Apple 실리콘)", sub: "메모리 용량별로 골라요", href: "/local#mac" });
  }

  const nq = norm(raw);
  if (nq) {
    const matched: { g: Gpu; c: VramClass }[] = [];
    for (const g of GPUS) {
      const names = [g.name, ...(g.aliases ?? [])].map(norm);
      const c = gpuClass(g);
      if (c && names.some((n) => n.includes(nq))) matched.push({ g, c });
    }
    for (const { g, c } of matched.slice(0, 6)) {
      hits.push({
        key: g.slug,
        label: g.name,
        sub: `${g.memoryGb}GB → ${c.label}`,
        href: `/local/${c.slug}?gpu=${g.slug}`,
      });
    }
  }
  return hits;
}

export default function GpuFinder() {
  const [q, setQ] = useState("");
  const hits = useMemo(() => search(q), [q]);
  const id = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[13px] font-medium text-[var(--color-text-dim)]">
        내 그래픽카드 이름이나 VRAM 용량
      </label>
      <input
        id={id}
        data-testid="gpu-finder"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="예: 3060 Ti, RX 7600, 12GB, 맥북"
        autoComplete="off"
        className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[15px] text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-mute)] focus:border-[var(--color-text-mute)]"
      />
      {q.trim() !== "" && (
        <ul className="space-y-1" data-testid="gpu-finder-results" aria-live="polite">
          {hits.length === 0 ? (
            <li className="px-1 text-[13px] text-[var(--color-text-mute)]">
              목록에 없는 카드예요. VRAM 용량을 숫자로 넣어 보세요(예: 8).
            </li>
          ) : (
            hits.map((h) => (
              <li key={h.key}>
                <Link
                  href={h.href}
                  className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 transition hover:bg-[var(--color-surface-2)]"
                >
                  <span className="text-[14px] font-medium text-[var(--color-text)]">{h.label}</span>
                  <span className="text-[12.5px] text-[var(--color-text-mute)]">{h.sub}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
/* Footer: components/local/GpuFinder.tsx */
