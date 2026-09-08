"use client";
/* Header: 비교 트레이 상태.
   최대 3개 제한은 여기 한 곳에서만 강제한다. URL이 아니라 메모리에 두는 이유는
   "고르는 중"은 공유할 상태가 아니고, 확정(비교하기)되는 순간에만 URL이 되기 때문이다. */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export const MAX_COMPARE = 3;

interface Item {
  slug: string;
  name: string;
}
interface Ctx {
  items: Item[];
  has: (slug: string) => boolean;
  toggle: (item: Item) => void;
  clear: () => void;
  full: boolean;
}

const CompareCtx = createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);

  const toggle = useCallback((item: Item) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.slug === item.slug);
      if (exists) return prev.filter((p) => p.slug !== item.slug);
      if (prev.length >= MAX_COMPARE) return prev; // 초과 선택은 조용히 무시하지 않고 UI에서 막는다
      return [...prev, item];
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      has: (slug) => items.some((i) => i.slug === slug),
      toggle,
      clear: () => setItems([]),
      full: items.length >= MAX_COMPARE,
    }),
    [items, toggle]
  );

  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error("useCompare는 CompareProvider 안에서만 쓸 수 있다.");
  return ctx;
}
/* Footer: components/ranking/CompareContext.tsx */
