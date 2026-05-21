export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
};

export type QuizConfig = {
  bank?: string;
  questionCount?: number;
  shuffle?: boolean;
};

export function parseQuizConfig(raw: unknown): QuizConfig {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: QuizConfig = {};
  if (typeof r.bank === "string" && r.bank.length > 0) out.bank = r.bank;
  if (typeof r.questionCount === "number" && r.questionCount > 0) {
    out.questionCount = Math.floor(r.questionCount);
  }
  if (typeof r.shuffle === "boolean") out.shuffle = r.shuffle;
  return out;
}

export function normalizeQuestion(row: {
  id: string;
  text: string;
  options: unknown;
  correctIndex: number;
  explanation: string | null;
}): QuizQuestion | null {
  if (!Array.isArray(row.options)) return null;
  const options = row.options.map((o) => String(o));
  if (options.length < 2) return null;
  if (row.correctIndex < 0 || row.correctIndex >= options.length) return null;
  return {
    id: row.id,
    text: row.text,
    options,
    correctIndex: row.correctIndex,
    explanation: row.explanation,
  };
}
