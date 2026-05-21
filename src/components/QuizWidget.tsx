"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { QuizQuestion } from "@/lib/quiz";

type Props = {
  toolId: string;
  questions: QuizQuestion[];
  questionCount?: number;
  shuffle?: boolean;
};

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDeck(
  questions: QuizQuestion[],
  questionCount: number | undefined,
  shuffle: boolean,
): QuizQuestion[] {
  const deck = shuffle ? shuffled(questions) : questions.slice();
  if (questionCount && questionCount > 0) return deck.slice(0, questionCount);
  return deck;
}

export function QuizWidget({
  toolId,
  questions,
  questionCount,
  shuffle = true,
}: Props) {
  const [deck, setDeck] = useState<QuizQuestion[]>(() =>
    pickDeck(questions, questionCount, shuffle),
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const report = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "rp:height",
            toolId,
            height: rootRef.current?.scrollHeight ?? 0,
          },
          "*",
        );
      }
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [toolId]);

  const current = deck[index];

  const onPick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (current && i === current.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const onNext = () => {
    if (index + 1 >= deck.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const onRestart = () => {
    setDeck(pickDeck(questions, questionCount, shuffle));
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setFinished(false);
  };

  const progressLabel = useMemo(
    () => `Question ${Math.min(index + 1, deck.length)} of ${deck.length}`,
    [index, deck.length],
  );

  if (deck.length === 0) {
    return (
      <div ref={rootRef} className="rp-root">
        <p className="rp-muted">No questions are active for this tool yet.</p>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correctCount / deck.length) * 100);
    return (
      <div ref={rootRef} className="rp-root">
        <p className="rp-quiz-score">
          You scored <strong>{correctCount} / {deck.length}</strong> ({pct}%)
        </p>
        <button type="button" className="rp-quiz-restart" onClick={onRestart}>
          Try again
        </button>
      </div>
    );
  }

  if (!current) return null;

  const revealed = selected !== null;

  return (
    <div ref={rootRef} className="rp-root">
      <p className="rp-quiz-progress">{progressLabel}</p>
      <p className="rp-quiz-question">{current.text}</p>
      <div className="rp-quiz-options" role="list">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correctIndex;
          const isPicked = i === selected;
          const cls = [
            "rp-quiz-option",
            revealed && isCorrect ? "correct" : "",
            revealed && isPicked && !isCorrect ? "incorrect" : "",
            revealed && !isPicked && !isCorrect ? "dim" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={i}
              type="button"
              role="listitem"
              className={cls}
              onClick={() => onPick(i)}
              disabled={revealed}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="rp-quiz-feedback">
          {selected === current.correctIndex ? (
            <p className="rp-success">Correct.</p>
          ) : (
            <p className="rp-error">
              Not quite — the answer is &ldquo;{current.options[current.correctIndex]}&rdquo;.
            </p>
          )}
          {current.explanation && (
            <p className="rp-quiz-explanation">{current.explanation}</p>
          )}
          <button type="button" className="rp-quiz-next" onClick={onNext}>
            {index + 1 >= deck.length ? "See score" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}
