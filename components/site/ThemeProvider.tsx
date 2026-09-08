"use client";
/* ---------------------------------------------------------------------------
 * Header: 테마 상태 (light / dark / system)
 *
 * 저장은 localStorage 한 곳. 적용은 <html data-theme> 속성 하나.
 * "system"일 때는 속성을 제거해 CSS의 prefers-color-scheme가 결정하게 둔다 —
 * JS로 매체 질의를 흉내내면 OS 설정이 바뀔 때 따라가지 못한다.
 * ------------------------------------------------------------------------- */

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";
export const THEME_KEY = "tiera-theme";

interface Ctx {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  /** 하이드레이션이 끝나기 전에는 저장값을 모른다. 그 전에 UI를 그리면 깜빡인다. */
  ready: boolean;
}

const ThemeCtx = createContext<Ctx | null>(null);

function apply(theme: ThemeChoice) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: ThemeChoice = "system";
    try {
      const v = localStorage.getItem(THEME_KEY);
      if (v === "light" || v === "dark" || v === "system") stored = v;
    } catch {
      // 시크릿 모드 등에서 localStorage 접근 자체가 던진다. 기본값으로 진행한다.
    }
    setThemeState(stored);
    apply(stored);
    setReady(true);
  }, []);

  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t);
    apply(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      // 저장 실패해도 이번 세션 동안은 동작해야 한다.
    }
  }, []);

  return <ThemeCtx.Provider value={{ theme, setTheme, ready }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme은 ThemeProvider 안에서만 쓸 수 있다.");
  return ctx;
}

/**
 * 하이드레이션 전에 data-theme을 미리 박는 스크립트.
 * 이게 없으면 저장값이 dark인 사용자에게 첫 프레임이 라이트로 번쩍인다(FOUC).
 * <head>에서 동기 실행되어야 하므로 dangerouslySetInnerHTML로 넣는다.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY
)});if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
/* Footer: components/site/ThemeProvider.tsx */
