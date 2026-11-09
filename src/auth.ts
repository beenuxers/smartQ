import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./lib/db";
import { isPlatformAdmin } from "./lib/admin";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: {
            memberships: {
              include: { organization: true },
              take: 1,
            },
          },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        const membership = user.memberships[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership?.organizationId,
          role: membership?.role,
          country: membership?.organization.country,
          locale: membership?.organization.locale,
          plan: membership?.organization.plan,
          isPlatformAdmin: isPlatformAdmin(user.email),
        };
      },
    }),
  ],
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
      // Re-check allowlist each request so ADMIN_EMAILS changes apply after re-login / token refresh
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
});
