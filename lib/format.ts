/* Header: 표시 포맷 헬퍼 */
export function formatContext(tokens: number | null): string {
  if (tokens === null) return "–";
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M 토큰`;
  return `${Math.round(tokens / 1000).toLocaleString("ko-KR")}K 토큰`;
}

export function formatPrice(v: string | null): string {
  if (v === null) return "–";
  const n = Number(v);
  return `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2).replace(/0$/, "")}`;
}

export const MODALITY_LABEL: Record<string, string> = {
  TEXT: "텍스트",
  IMAGE: "이미지",
  AUDIO: "오디오",
  VIDEO: "비디오",
};
/* Footer: lib/format.ts */
