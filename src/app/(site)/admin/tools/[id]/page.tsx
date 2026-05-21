import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { THEME_PRESETS, type ThemePreset } from "@/lib/themes";
import { EmbedSnippets } from "./EmbedSnippets";

async function updateTool(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const themePreset = String(formData.get("themePreset") ?? "card");
  const customCss = String(formData.get("customCss") ?? "");
  await prisma.tool.update({
    where: { id },
    data: {
      title,
      topic: topic || null,
      description: description || null,
      themePreset,
      customCss: customCss || null,
    },
  });
  revalidatePath(`/admin/tools/${id}`);
}

async function addPrompt(formData: FormData) {
  "use server";
  const toolId = String(formData.get("toolId"));
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  const count = await prisma.prompt.count({ where: { toolId } });
  await prisma.prompt.create({
    data: { toolId, text, order: count },
  });
  revalidatePath(`/admin/tools/${toolId}`);
}

async function togglePrompt(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const toolId = String(formData.get("toolId"));
  const current = await prisma.prompt.findUnique({ where: { id } });
  if (!current) return;
  await prisma.prompt.update({
    where: { id },
    data: { active: !current.active },
  });
  revalidatePath(`/admin/tools/${toolId}`);
}

async function deletePrompt(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const toolId = String(formData.get("toolId"));
  await prisma.prompt.delete({ where: { id } });
  revalidatePath(`/admin/tools/${toolId}`);
}

async function deleteTool(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await prisma.tool.delete({ where: { id } });
  redirect("/admin");
}

export default async function ToolEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await prisma.tool.findUnique({
    where: { id },
    include: {
      prompts: { orderBy: { order: "asc" } },
      _count: {
        select: {
          prompts: true,
          questions: true,
        },
      },
    },
  });
  if (!tool) notFound();

  const pendingCount = await prisma.reflection.count({
    where: {
      prompt: { toolId: tool.id },
      status: "PENDING",
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← All tools
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{tool.title}</h1>
          <p className="text-sm text-zinc-500">
            {tool.type === "REFLECTION" ? "Reflection tool" : "Quiz tool"}
            {tool.topic ? ` · ${tool.topic}` : ""}
          </p>
        </div>
        {tool.type === "REFLECTION" && (
          <Link
            href={`/admin/tools/${tool.id}/moderate`}
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 text-white font-medium px-4 hover:bg-zinc-800"
          >
            Moderation
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-amber-400 text-zinc-900 text-xs font-semibold">
                {pendingCount}
              </span>
            )}
          </Link>
        )}
      </div>

      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Embed this tool</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Copy a snippet and paste it into your site.
        </p>
        <EmbedSnippets toolId={tool.id} />
      </section>

      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Settings & theme</h2>
        <form action={updateTool} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="id" value={tool.id} />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Title</span>
            <input
              name="title"
              defaultValue={tool.title}
              required
              className="h-10 rounded-lg border border-zinc-300 px-3"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Topic</span>
            <input
              name="topic"
              defaultValue={tool.topic ?? ""}
              className="h-10 rounded-lg border border-zinc-300 px-3"
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Description (admin only)</span>
            <input
              name="description"
              defaultValue={tool.description ?? ""}
              className="h-10 rounded-lg border border-zinc-300 px-3"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Theme preset</span>
            <select
              name="themePreset"
              defaultValue={tool.themePreset}
              className="h-10 rounded-lg border border-zinc-300 px-3 bg-white"
            >
              {THEME_PRESETS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {t.description}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700">Custom CSS (optional, scoped to the widget)</span>
            <textarea
              name="customCss"
              defaultValue={tool.customCss ?? ""}
              rows={5}
              className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
              placeholder=".rp-root { /* your overrides */ }"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="h-10 rounded-lg bg-zinc-900 text-white font-medium px-5 hover:bg-zinc-800"
            >
              Save settings
            </button>
          </div>
        </form>
      </section>

      {tool.type === "REFLECTION" && (
        <section className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Prompts</h2>
          <p className="mt-1 text-sm text-zinc-500">
            The widget rotates through active prompts.
          </p>
          <form action={addPrompt} className="mt-4 flex gap-2">
            <input type="hidden" name="toolId" value={tool.id} />
            <input
              name="text"
              required
              placeholder="e.g. What was your biggest takeaway?"
              className="flex-1 h-10 rounded-lg border border-zinc-300 px-3"
            />
            <button
              type="submit"
              className="h-10 rounded-lg bg-zinc-900 text-white font-medium px-4 hover:bg-zinc-800"
            >
              Add prompt
            </button>
          </form>
          {tool.prompts.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No prompts yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {tool.prompts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2"
                >
                  <span className={`flex-1 text-sm ${p.active ? "text-zinc-900" : "text-zinc-400 line-through"}`}>
                    {p.text}
                  </span>
                  <form action={togglePrompt}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="toolId" value={tool.id} />
                    <button className="text-xs text-zinc-500 hover:text-zinc-900">
                      {p.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deletePrompt}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="toolId" value={tool.id} />
                    <button className="text-xs text-red-600 hover:text-red-700">Delete</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="bg-white rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
        <form action={deleteTool} className="mt-3">
          <input type="hidden" name="id" value={tool.id} />
          <button
            className="h-10 rounded-lg border border-red-300 text-red-700 font-medium px-4 hover:bg-red-50"
            type="submit"
          >
            Delete this tool and all its data
          </button>
        </form>
      </section>
    </div>
  );
}
