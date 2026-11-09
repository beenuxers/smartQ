import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "./settings-form";
import { MarketForm } from "./market-form";
import { getMessages, resolveLocale } from "@/lib/i18n";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: { outlets: true },
  });
  const outlet = org.outlets[0];
  if (!outlet) redirect("/register");
  const t = getMessages(resolveLocale(org.locale));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-4xl display">
        {t.settings}
      </h1>
      <SettingsForm
        outlet={{
          id: outlet.id,
          name: outlet.name,
          activeSession: outlet.activeSession,
          lunchStart: outlet.lunchStart,
          lunchEnd: outlet.lunchEnd,
          dinnerStart: outlet.dinnerStart,
          dinnerEnd: outlet.dinnerEnd,
        }}
        labels={{
          sessionHours: t.sessionHours,
          lunch: t.lunch,
          dinner: t.dinner,
          allDay: t.allDay,
        }}
      />
      <MarketForm
        locale={org.locale}
        country={org.country}
        currency={org.currency}
        labels={{
          title: t.marketLanguage,
          billingCurrency: t.billingCurrency,
          uiLanguage: t.uiLanguage,
          save: t.save,
          saved: t.saved,
        }}
      />
    </div>
  );
}
