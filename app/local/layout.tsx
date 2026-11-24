/* ---------------------------------------------------------------------------
 * Header: /local 공용 레이아웃 — 내 컴퓨터로 돌리는 AI. SPEC 25.
 * ------------------------------------------------------------------------- */
export default function LocalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16 pt-7">
      {/* 뒤로 가기 링크는 각 페이지가 단다. 등급 페이지는 "다른 그래픽카드"로 가야 해서
          레이아웃에 공통으로 두면 링크가 두 줄이 된다. */}
      {children}
    </div>
  );
}
/* Footer: app/local/layout.tsx */
