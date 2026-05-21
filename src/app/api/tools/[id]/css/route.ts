import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildWidgetCss, type ThemePreset } from "@/lib/themes";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tool = await prisma.tool.findUnique({
    where: { id },
    select: { themePreset: true, customCss: true },
  });
  if (!tool) {
    return new NextResponse("", { status: 404 });
  }
  const css = buildWidgetCss(
    (tool.themePreset as ThemePreset) ?? "card",
    tool.customCss,
  );
  return new NextResponse(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
