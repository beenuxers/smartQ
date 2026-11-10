"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isOwnerRole } from "@/lib/outlet-context";
import { COUNTRY_DEFAULTS, type CountryCode } from "@/lib/product";

export async function updateMarketSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId || !isOwnerRole(session.user.role)) {
    return { ok: false as const, error: "Owners only" };
  }

  const nextLocale = String(formData.get("locale") || "en");
  const nextCountry = String(formData.get("country") || "MY") as CountryCode;
  const currencyMode = String(formData.get("currency") || "USD");

  if (!["en", "ms", "id"].includes(nextLocale)) {
    return { ok: false as const, error: "Invalid language" };
  }
  if (!["SG", "ID", "MY"].includes(nextCountry)) {
    return { ok: false as const, error: "Invalid country" };
  }

  const nextCurrency =
    currencyMode === "auto"
      ? COUNTRY_DEFAULTS[nextCountry].localCurrency
      : currencyMode;

  if (!["USD", "MYR", "SGD", "IDR"].includes(nextCurrency)) {
    return { ok: false as const, error: "Invalid currency" };
  }

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      locale: nextLocale,
      country: nextCountry,
      currency: nextCurrency,
    },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/billing");
  revalidatePath("/join", "layout");

  return {
    ok: true as const,
    locale: nextLocale,
    country: nextCountry,
    currency: nextCurrency,
  };
}
