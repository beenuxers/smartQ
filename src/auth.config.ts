import type { NextAuthConfig } from "next-auth";
import { isPlatformAdmin } from "@/lib/admin";

/**
 * Edge-safe Auth.js config (no Prisma / bcrypt / Node-only imports).
 * Used by middleware; full providers live in auth.ts.
 */
export const authConfig = {
  // Required on Vercel / reverse proxies so Auth.js trusts the request host.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.email = user.email;
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.role = (user as { role?: string }).role;
        token.country = (user as { country?: string }).country;
        token.locale = (user as { locale?: string }).locale;
        token.plan = (user as { plan?: string }).plan;
      }
      token.isPlatformAdmin = isPlatformAdmin(
        (token.email as string | undefined) ?? user?.email,
      );
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.role = token.role as string | undefined;
        session.user.country = token.country as string | undefined;
        session.user.locale = token.locale as string | undefined;
        session.user.plan = token.plan as string | undefined;
        session.user.isPlatformAdmin = Boolean(token.isPlatformAdmin);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
