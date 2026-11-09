import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isPlatformAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email || !isPlatformAdmin(session.user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="display text-lg font-semibold tracking-tight">
              SmartQ
            </Link>
            <span className="admin-badge">Platform</span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-white/75">
            <Link href="/admin" className="hover:text-white">
              Overview
            </Link>
            <Link href="/admin/organizations" className="hover:text-white">
              Organizations
            </Link>
            <Link href="/admin/payments" className="hover:text-white">
              Payments
            </Link>
            <Link href="/dashboard" className="text-white/45 hover:text-white/70">
              Customer dashboard
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="text-white/45 hover:text-white/70">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
