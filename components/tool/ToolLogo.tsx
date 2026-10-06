/* ---------------------------------------------------------------------------
 * Header: 도구 로고 타일. 목록 행·용도 고르기·상세 머리말이 같이 쓴다.
 *
 * 로고가 있으면 흰 타일을 꽉 채우고(파일 쪽에서 크롭·여백을 맞춰 뒀다 —
 * scripts/process-logos.py), 없으면 이름 첫 글자를 회색 타일에 쓴다.
 * **로고를 직접 그리지 않는다.** 남의 상표를 흉내 내는 건 재현이다.
 *
 * 다크에서는 --c-logo-filter로 한 톤 어둡게 한다. 순백 타일 수십 개가 눈부셨다.
 * ------------------------------------------------------------------------- */
import Image from "next/image";

const SIZE = {
  sm: { box: "h-6 w-6 rounded-md", px: 24, text: "text-[11px]" },
  md: { box: "h-10 w-10 rounded-xl", px: 40, text: "text-[15px]" },
  lg: { box: "h-14 w-14 rounded-2xl", px: 56, text: "text-[20px]" },
} as const;

/** 이름 첫 글자. 영문은 대문자로, 한글은 그대로. */
function initial(name: string): string {
  const c = name.trim()[0] ?? "?";
  return /[a-z]/.test(c) ? c.toUpperCase() : c;
}

export default function ToolLogo({
  name,
  logoUrl,
  size = "md",
  className = "",
}: {
  name: string;
  logoUrl: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const s = SIZE[size];
  if (logoUrl) {
    return (
      <span
        style={{ filter: "var(--c-logo-filter)" }}
        className={`block shrink-0 overflow-hidden bg-white ring-1 ring-inset ring-black/10 ${s.box} ${className}`}
      >
        <Image src={logoUrl} alt="" width={s.px} height={s.px} className="h-full w-full" unoptimized />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-[var(--color-surface-2)] font-bold text-[var(--color-text-dim)] ring-1 ring-inset ring-[var(--color-line)] ${s.box} ${s.text} ${className}`}
    >
      {initial(name)}
    </span>
  );
}
/* Footer: components/tool/ToolLogo.tsx */
