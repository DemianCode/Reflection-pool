import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReflectionWidget } from "@/components/ReflectionWidget";
import { buildWidgetCss, type ThemePreset } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await prisma.tool.findUnique({
    where: { id },
    include: {
      prompts: {
        where: { active: true },
        select: { id: true, text: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!tool) notFound();

  const css = buildWidgetCss(
    (tool.themePreset as ThemePreset) ?? "card",
    tool.customCss,
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <ReflectionWidget
        toolId={tool.id}
        prompts={tool.prompts}
        apiBase=""
      />
    </>
  );
}
