import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { resolveDashboardOutlet } from "@/lib/outlet-context";

export default async function QrPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: { outlets: { orderBy: { createdAt: "asc" } } },
  });
  const outlet = await resolveDashboardOutlet(org.outlets, {
    id: session.user.id,
    organizationId: session.user.organizationId,
  });
  if (!outlet) redirect("/dashboard/settings");
  const t = getMessages(resolveLocale(org.locale));

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-4xl display">{t.qrCode}</h1>
        <p className="mt-2 text-muted">
          Print this for your entrance. Guests scan to join via WhatsApp-ready waitlist.
        </p>
        <p className="mt-1 text-sm text-muted">{outlet.name}</p>
      </div>
      <div className="panel text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/outlets/${outlet.slug}/qr`}
          alt={`QR for ${outlet.name}`}
          className="mx-auto w-64 rounded-2xl border border-line bg-white p-4"
        />
        <p className="mt-4 break-all text-sm text-muted">/join/{outlet.slug}</p>
        <a
          className="btn btn-primary mt-6"
          href={`/api/outlets/${outlet.slug}/qr`}
          download={`${outlet.slug}-qr.png`}
        >
          {t.downloadQr}
        </a>
      </div>
    </div>
  );
}
