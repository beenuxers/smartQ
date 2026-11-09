import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();

  const organizations = await prisma.organization.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { country: { contains: query } },
            { plan: { contains: query } },
            {
              memberships: {
                some: { user: { email: { contains: query } } },
              },
            },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      outlets: true,
      memberships: { include: { user: { select: { email: true, name: true } } } },
      _count: { select: { payments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl display">
            Organizations
          </h1>
          <p className="mt-2 text-sm text-white/60">{organizations.length} customers</p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search name, email, plan…"
            className="min-w-[16rem] rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#7dd3c0]"
          />
          <button className="rounded-[10px] bg-[#0f6b5c] px-4 py-2 text-sm font-semibold text-white">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-left text-sm">
          <thead className="text-white/50">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th>Country</th>
              <th>Plan</th>
              <th>Currency</th>
              <th>Outlets</th>
              <th>Usage</th>
              <th>Owner</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => {
              const owner = org.memberships.find((m) => m.role === "owner")?.user;
              return (
                <tr key={org.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="font-medium text-[#7dd3c0] hover:underline"
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td>{org.country}</td>
                  <td className="capitalize">{org.plan}</td>
                  <td>{org.currency}</td>
                  <td>{org.outlets.length}</td>
                  <td className="text-white/60">
                    {org.seatingsUsed} seat · {org.whatsappUsed} WA
                  </td>
                  <td className="text-white/60">{owner?.email ?? "—"}</td>
                  <td className="text-white/60">{org.createdAt.toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {organizations.length === 0 ? (
          <p className="px-4 py-8 text-sm text-white/50">No organizations found.</p>
        ) : null}
      </div>
    </div>
  );
}
