/* ---------------------------------------------------------------------------
 * Header: Auth.js 설정
 *
 * OAuth 자격증명이 없으면 해당 provider를 아예 등록하지 않는다.
 * 빈 문자열로 등록해두면 로그인 버튼은 보이는데 누르면 깨지는 상태가 된다.
 *
 * 개발용 로그인(dev-login)은 ALLOW_DEV_LOGIN=true이고 프로덕션이 아닐 때만 켠다.
 * 비밀번호를 검사하지 않는 provider이므로, 프로덕션에서 켜지면 누구나 아무
 * 계정으로 로그인할 수 있다. 그래서 조건을 두 개 걸었다.
 * ------------------------------------------------------------------------- */

import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET })
  );
}
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })
  );
}

export const DEV_LOGIN_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_LOGIN === "true";

if (DEV_LOGIN_ENABLED) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "개발용 로그인",
      credentials: { email: { label: "이메일", type: "email" } },
      async authorize(raw) {
        const email = typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;

        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing[0]) return existing[0];

        const [created] = await db
          .insert(users)
          .values({ email, name: email.split("@")[0] })
          .returning();
        return created;
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  // Credentials provider는 DB 세션과 함께 쓸 수 없어 JWT 전략을 쓴다.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
/* Footer: auth.ts */
