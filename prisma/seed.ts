import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tool = await prisma.tool.create({
    data: {
      type: "REFLECTION",
      title: "Workshop reflection",
      topic: "Module 1 — Onboarding",
      themePreset: "card",
      prompts: {
        create: [
          { text: "What was your biggest takeaway?", order: 0 },
          { text: "Which idea changed how you think about the topic?", order: 1 },
          { text: "What question is still open for you?", order: 2 },
        ],
      },
    },
    include: { prompts: true },
  });

  for (let i = 0; i < 3; i++) {
    await prisma.reflection.create({
      data: {
        promptId: tool.prompts[0].id,
        authorName: ["Alex", "Riley", "Sam"][i],
        body: [
          "The framing around feedback loops really clicked for me.",
          "I want to revisit the section on noticing assumptions.",
          "Loved the worked example — going to try it on my next project.",
        ][i],
        status: "APPROVED",
      },
    });
  }

  console.log("Seeded reflection tool:", tool.id);

  const quiz = await prisma.tool.create({
    data: {
      type: "QUIZ",
      title: "Module 1 quick check",
      topic: "Module 1 — Onboarding",
      themePreset: "card",
      questions: {
        create: [
          {
            text: "What is the primary purpose of a feedback loop?",
            options: [
              "To slow a process down",
              "To let a system adjust based on its own output",
              "To remove all variability",
              "To document past results",
            ],
            correctIndex: 1,
            explanation:
              "A feedback loop feeds a system's output back as input so it can self-correct.",
          },
          {
            text: "Which of these is *not* a useful reflection prompt?",
            options: [
              "What surprised you?",
              "What would you do differently?",
              "Was this fun, yes or no?",
              "What is still unclear?",
            ],
            correctIndex: 2,
            explanation:
              "Closed yes/no prompts rarely surface insight — open prompts do.",
          },
          {
            text: "What does 'noticing your assumptions' help you do?",
            options: [
              "Defend your existing position more confidently",
              "Skip the planning phase",
              "Identify hidden constraints in your thinking",
              "Memorize a checklist",
            ],
            correctIndex: 2,
            explanation:
              "Surfacing assumptions reveals the implicit rules shaping how you frame a problem.",
          },
        ],
      },
    },
  });

  console.log("Seeded quiz tool:", quiz.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
