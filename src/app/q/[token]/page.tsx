import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPartiesAhead } from "@/lib/analytics";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { PositionClient } from "./position-client";

export default async function PositionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const party = await prisma.party.findUnique({
    where: { token },
    include: { outlet: { include: { organization: true } } },
  });
  if (!party) notFound();

  const ahead = await getPartiesAhead(party.outletId, party.queueNumber);
  const t = getMessages(resolveLocale(party.outlet.organization.locale));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        SmartQ
      </div>
      <h1 className="display mt-3 text-3xl font-semibold tracking-tight">
        {party.outlet.name}
      </h1>
      <PositionClient
        token={token}
        initial={{
          queueNumber: party.queueNumber,
          status: party.status,
          partiesAhead: ahead,
          guestName: party.guestName,
        }}
        labels={{
          yourNumber: t.yourNumber,
          position: t.position,
          waiting: t.waiting,
          notified: t.notified,
          tableReady: t.tableReady,
          seated: t.seated,
          noShow: t.noShow,
        }}
      />
    </main>
  );
}
