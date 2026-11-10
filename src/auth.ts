import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./lib/db";
import { isPlatformAdmin } from "./lib/admin";
import { authConfig } from "./auth.config";
import {
  clientIp,
  peekRateLimit,
  rateLimit,
  recordFailure,
  resetRateLimit,
} from "./lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const LOGIN_IP_LIMIT = 30;
const LOGIN_IP_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_EMAIL_LIMIT = 10;
const LOGIN_EMAIL_WINDOW_MS = 15 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (raw, request) => {
        // Any uncaught throw here becomes Auth.js `error=Configuration`.
        try {
          const parsed = credentialsSchema.safeParse(raw);
          if (!parsed.success) return null;

          const email = parsed.data.email.toLowerCase();
          const ip = request ? clientIp(request) : "unknown";

          const ipLimit = await rateLimit({
            key: `login:ip:${ip}`,
            limit: LOGIN_IP_LIMIT,
            windowMs: LOGIN_IP_WINDOW_MS,
          });
          if (!ipLimit.ok) return null;

          const emailLock = await peekRateLimit({
            key: `login:email:${email}`,
            limit: LOGIN_EMAIL_LIMIT,
            windowMs: LOGIN_EMAIL_WINDOW_MS,
          });
          if (!emailLock.ok) return null;

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              memberships: {
                include: { organization: true },
                take: 1,
              },
            },
          });
          if (!user) {
            await recordFailure({
              key: `login:email:${email}`,
              limit: LOGIN_EMAIL_LIMIT,
              windowMs: LOGIN_EMAIL_WINDOW_MS,
            });
            return null;
          }

          const valid = await bcrypt.compare(
            parsed.data.password,
            user.passwordHash,
          );
          if (!valid) {
            await recordFailure({
              key: `login:email:${email}`,
              limit: LOGIN_EMAIL_LIMIT,
              windowMs: LOGIN_EMAIL_WINDOW_MS,
            });
            return null;
          }

          await resetRateLimit(`login:email:${email}`);

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
        } catch (err) {
          console.error("credentials authorize failed", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      if (user) {
        token.email = user.email;
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.role = (user as { role?: string }).role;
        token.country = (user as { country?: string }).country;
        token.locale = (user as { locale?: string }).locale;
        token.plan = (user as { plan?: string }).plan;
      }

      // Keep plan/market/role in sync after upgrades & staff changes (Node auth path only).
      const organizationId = token.organizationId as string | undefined;
      const userId = token.sub;
      if (organizationId) {
        try {
          const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { plan: true, country: true, locale: true },
          });
          if (org) {
            token.plan = org.plan;
            token.country = org.country;
            token.locale = org.locale;
          }
          if (userId) {
            const membership = await prisma.membership.findUnique({
              where: {
                userId_organizationId: {
                  userId,
                  organizationId,
                },
              },
              select: { role: true },
            });
            if (membership) token.role = membership.role;
          }
        } catch (err) {
          console.error("jwt org refresh failed", err);
        }
      }

      token.isPlatformAdmin = isPlatformAdmin(
        (token.email as string | undefined) ?? user?.email,
      );
      return token;
    },
  },
});
