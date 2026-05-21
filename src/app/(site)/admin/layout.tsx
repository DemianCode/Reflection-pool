import Link from "next/link";
import { redirect } from "next/navigation";
import { destroyAdminSession } from "@/lib/auth";

async function signOut() {
  "use server";
  await destroyAdminSession();
  redirect("/admin/login");
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-semibold text-zinc-900">
            Reflection Pool · admin
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
