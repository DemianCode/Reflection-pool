import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReflectionWidget } from "@/components/ReflectionWidget";
import { QuizWidget } from "@/components/QuizWidget";
import { buildWidgetCss, type ThemePreset } from "@/lib/themes";
import { normalizeQuestion, parseQuizConfig } from "@/lib/quiz";

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
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <QuizWidget
          toolId={tool.id}
          questions={questions}
          questionCount={quizConfig.questionCount}
          shuffle={quizConfig.shuffle ?? true}
        />
      </>
    );
  }

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
