import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const items = await prisma.reflection.findMany({
    where: {
      prompt: { toolId: id },
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      authorName: true,
      body: true,
      createdAt: true,
    },
  });
  return NextResponse.json(
    { items },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=5, stale-while-revalidate=30",
      },
    },
  );
}

const SubmitSchema = z.object({
  promptId: z.string().min(1),
  body: z.string().min(8).max(2000),
  authorName: z.string().max(60).optional(),
});

function sanitizeName(name: string | undefined): string {
  if (!name) return "Anonymous";
  const trimmed = name.trim().replace(/[<>]/g, "").slice(0, 60);
  return trimmed.length === 0 ? "Anonymous" : trimmed;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  const parsed = SubmitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const prompt = await prisma.prompt.findFirst({
    where: { id: parsed.data.promptId, toolId: id, active: true },
    select: { id: true },
  });
  if (!prompt) {
    return NextResponse.json(
      { error: "prompt_not_found" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const reflection = await prisma.reflection.create({
    data: {
      promptId: prompt.id,
      authorName: sanitizeName(parsed.data.authorName),
      body: parsed.data.body.trim(),
      status: "PENDING",
    },
    select: { id: true, authorName: true, body: true, createdAt: true },
  });

  return NextResponse.json(
    { ok: true, reflection },
    { status: 201, headers: CORS_HEADERS },
  );
}
