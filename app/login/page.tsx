/* Header: 로그인.
   OAuth 자격증명이 없는 환경에서는 개발용 로그인만 노출된다 (auth.ts 참고). */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, DEV_LOGIN_ENABLED, signIn } from "@/auth";
import TierStar from "@/components/tier/TierStar";

export const metadata: Metadata = { title: "로그인 — Tiera" };

const hasGitHub = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

function safeCallback(raw: unknown): string {
  // 오픈 리다이렉트 방지: 같은 사이트 내부 경로만 허용한다.
  if (typeof raw !== "string") return "/";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const callbackUrl = safeCallback((await searchParams).callbackUrl);
  if (session?.user) redirect(callbackUrl);

  return (
    <div className="mx-auto max-w-sm py-20 text-center">
      <div className="flex justify-center">
        <TierStar tier="prism" size={56} glow />
      </div>
      <h1 className="mt-4 text-xl font-bold">Tiera 로그인</h1>
      <p className="mt-1 text-xs text-[var(--color-text-mute)]">
        평가를 남기려면 로그인이 필요합니다. 이름은 익명으로 숨길 수 있습니다.
      </p>

      <div className="mt-8 space-y-2">
        {hasGitHub && (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: callbackUrl });
            }}
          >
            <button className="w-full rounded-lg border border-[var(--color-line)] py-2.5 text-sm hover:border-[var(--color-text-mute)]">
              GitHub로 계속하기
            </button>
          </form>
        )}
        {hasGoogle && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button className="w-full rounded-lg border border-[var(--color-line)] py-2.5 text-sm hover:border-[var(--color-text-mute)]">
              Google로 계속하기
            </button>
          </form>
        )}

        {DEV_LOGIN_ENABLED && (
          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("dev-login", {
                email: String(formData.get("email") ?? ""),
                redirectTo: callbackUrl,
              });
            }}
            className="space-y-2 rounded-xl border border-dashed border-[var(--color-line)] p-4 text-left"
          >
            <p className="text-[11px] text-amber-400">
              개발용 로그인 — 비밀번호를 검사하지 않습니다. 프로덕션에서는 비활성화됩니다.
            </p>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-tier-prism)] focus:outline-none"
            />
            <button className="w-full rounded-lg bg-[var(--color-surface-2)] py-2 text-sm">
              이메일로 계속하기
            </button>
          </form>
        )}

        {!hasGitHub && !hasGoogle && !DEV_LOGIN_ENABLED && (
          <p className="text-xs text-[var(--color-down)]">
            사용 가능한 로그인 수단이 없습니다. 환경변수를 확인해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
/* Footer: app/login/page.tsx */
