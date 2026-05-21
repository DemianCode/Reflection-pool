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

  console.log("Seeded tool:", tool.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
