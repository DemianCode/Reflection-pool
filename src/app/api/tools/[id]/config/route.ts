import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeQuestion, parseQuizConfig } from "@/lib/quiz";

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
      config: true,
      prompts: {
        where: { active: true },
        select: { id: true, text: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!tool) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=10, stale-while-revalidate=60",
  };

  if (tool.type === "QUIZ") {
    const quizConfig = parseQuizConfig(tool.config);
    const rows = await prisma.question.findMany({
      where: {
        toolId: tool.id,
        active: true,
        ...(quizConfig.bank ? { bank: quizConfig.bank } : {}),
      },
      select: {
        id: true,
        text: true,
        options: true,
        correctIndex: true,
        explanation: true,
      },
      orderBy: { createdAt: "asc" },
    });
    const questions = rows
      .map((r) => normalizeQuestion(r))
      .filter((q): q is NonNullable<typeof q> => q !== null);
    return NextResponse.json(
      {
        id: tool.id,
        type: tool.type,
        title: tool.title,
        topic: tool.topic,
        theme: { preset: tool.themePreset, customCss: tool.customCss },
        quiz: {
          questionCount: quizConfig.questionCount,
          shuffle: quizConfig.shuffle ?? true,
          questions,
        },
      },
      { headers },
    );
  }

  return NextResponse.json(
    {
      id: tool.id,
      type: tool.type,
      title: tool.title,
      topic: tool.topic,
      theme: { preset: tool.themePreset, customCss: tool.customCss },
      prompts: tool.prompts,
    },
    { headers },
  );
}
