import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ReflectionStatus } from "@prisma/client";

async function setStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const toolId = String(formData.get("toolId"));
  const status = String(formData.get("status")) as ReflectionStatus;
  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) return;
  await prisma.reflection.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/tools/${toolId}/moderate`);
}

async function deleteReflection(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const toolId = String(formData.get("toolId"));
  await prisma.reflection.delete({ where: { id } });
  revalidatePath(`/admin/tools/${toolId}/moderate`);
}

export default async function ModeratePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  const { filter = "PENDING" } = await searchParams;
  const tool = await prisma.tool.findUnique({
    where: { id },
    select: { id: true, title: true, type: true },
  });
  if (!tool || tool.type !== "REFLECTION") notFound();

  const where: { prompt: { toolId: string }; status?: ReflectionStatus } = {
    prompt: { toolId: tool.id },
  };
  if (filter !== "ALL") where.status = filter as ReflectionStatus;

  const reflections = await prisma.reflection.findMany({
    where,
    include: { prompt: { select: { text: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const tabs = [
    { id: "PENDING", label: "Pending" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" },
    { id: "ALL", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/tools/${tool.id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {tool.title}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Moderation queue</h1>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/tools/${tool.id}/moderate?filter=${t.id}`}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === t.id
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {reflections.length === 0 ? (
        <p className="text-sm text-zinc-500">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {reflections.map((r) => (
            <li key={r.id} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-500">
                    Prompt: <span className="italic">{r.prompt.text}</span>
                  </p>
                  <p className="mt-2 text-zinc-900">{r.body}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    — {r.authorName} · {r.createdAt.toLocaleString()} · {r.status}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {r.status !== "APPROVED" && (
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700">
                        Approve
                      </button>
                    </form>
                  )}
                  {r.status !== "REJECTED" && (
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button className="text-xs px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-700">
                        Reject
                      </button>
                    </form>
                  )}
                  <form action={deleteReflection}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="toolId" value={tool.id} />
                    <button className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
