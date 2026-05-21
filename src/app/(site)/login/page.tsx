import { redirect } from "next/navigation";
import { createAdminSession, checkAdminPassword, isAdmin } from "@/lib/auth";

async function signIn(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (!checkAdminPassword(password)) {
    redirect("/login?error=1");
  }
  await createAdminSession();
  redirect("/admin");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <form
        action={signIn}
        className="w-full max-w-sm bg-white rounded-xl border border-zinc-200 p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-zinc-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter the admin password set in <code>ADMIN_PASSWORD</code>.
        </p>
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="mt-4 w-full h-10 rounded-lg border border-zinc-300 px-3 text-zinc-900"
          placeholder="Password"
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">Incorrect password.</p>
        )}
        <button
          type="submit"
          className="mt-4 h-10 w-full rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
