import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ToolType } from "@prisma/client";

async function createTool(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  if (!title || (type !== "REFLECTION" && type !== "QUIZ")) {
    redirect("/admin?error=invalid");
  }
  const tool = await prisma.tool.create({
    data: {
      title,
      topic: topic || null,
      type: type as ToolType,
    },
  });
  redirect(`/admin/tools/${tool.id}`);
}

export default async function AdminHome() {
  const tools = await prisma.tool.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { prompts: true, questions: true } },
    },
  });

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Create a new tool</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Pick a type and topic. You can change the theme and content after.
        </p>
        <form action={createTool} className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Title</span>
            <input
              name="title"
              required
              placeholder="e.g. Workshop reflection"
              className="h-10 rounded-lg border border-zinc-300 px-3 text-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Topic (optional)</span>
            <input
              name="topic"
              placeholder="e.g. Module 1, Science"
              className="h-10 rounded-lg border border-zinc-300 px-3 text-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Type</span>
            <select
              name="type"
              className="h-10 rounded-lg border border-zinc-300 px-3 text-zinc-900 bg-white"
              defaultValue="REFLECTION"
            >
              <option value="REFLECTION">Reflection</option>
              <option value="QUIZ">Quiz</option>
            </select>
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg bg-zinc-900 text-white font-medium px-5 hover:bg-zinc-800"
          >
            Create
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">Your tools</h2>
        {tools.length === 0 ? (
          <p className="text-sm text-zinc-500">No tools yet. Create one above.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/tools/${t.id}`}
                  className="block bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-400"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900">{t.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {t.type === "REFLECTION" ? "Reflection" : "Quiz"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {t.topic ? `${t.topic} · ` : ""}
                    {t.type === "REFLECTION"
                      ? `${t._count.prompts} prompt${t._count.prompts === 1 ? "" : "s"}`
                      : `${t._count.questions} question${t._count.questions === 1 ? "" : "s"}`}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
