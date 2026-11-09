import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      organizationId?: string;
      role?: string;
      country?: string;
      locale?: string;
      plan?: string;
      isPlatformAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    role?: string;
    country?: string;
    locale?: string;
    plan?: string;
    isPlatformAdmin?: boolean;
  }
}
