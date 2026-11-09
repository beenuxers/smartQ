import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { JoinForm } from "./join-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const outlet = await prisma.outlet.findUnique({
    where: { slug },
    include: { organization: true },
  });
  if (!outlet) notFound();

  const t = getMessages(resolveLocale(outlet.organization.locale));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          SmartQ
        </div>
        <h1 className="display mt-3 text-3xl font-semibold tracking-tight">
          {outlet.name}
        </h1>
        <p className="mt-2 text-sm text-muted">{t.joinTitle}</p>
      </div>
      <JoinForm slug={slug} labels={t} />
    </main>
  );
}
