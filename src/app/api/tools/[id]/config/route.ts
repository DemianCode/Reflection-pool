import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tool = await prisma.tool.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      title: true,
      topic: true,
      themePreset: true,
      customCss: true,
      prompts: {
        where: { active: true },
        select: { id: true, text: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!tool) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(
    {
      id: tool.id,
      type: tool.type,
      title: tool.title,
      topic: tool.topic,
      theme: { preset: tool.themePreset, customCss: tool.customCss },
      prompts: tool.prompts,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=10, stale-while-revalidate=60",
      },
    },
  );
}
