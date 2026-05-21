"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Prompt = { id: string; text: string };

type TickerItem = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Props = {
  toolId: string;
  prompts: Prompt[];
  apiBase: string;
};

export function ReflectionWidget({ toolId, prompts, apiBase }: Props) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [localItems, setLocalItems] = useState<TickerItem[]>([]);
  const [remoteItems, setRemoteItems] = useState<TickerItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const prompt = prompts[promptIndex];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/api/tools/${toolId}/reflections`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: TickerItem[] };
        if (!cancelled) setRemoteItems(data.items);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [apiBase, toolId]);

  useEffect(() => {
    if (prompts.length <= 1) return;
    const t = setInterval(() => {
      setPromptIndex((i) => (i + 1) % prompts.length);
    }, 25000);
    return () => clearInterval(t);
  }, [prompts.length]);

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

  const tickerItems = useMemo(() => {
    const ids = new Set(localItems.map((i) => i.id));
    const merged = [
      ...localItems,
      ...remoteItems.filter((r) => !ids.has(r.id)),
    ];
    return merged.slice(0, 40);
  }, [localItems, remoteItems]);

  if (prompts.length === 0) {
    return (
      <div ref={rootRef} className="rp-root">
        <p className="rp-muted">No prompts are active for this tool yet.</p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (body.trim().length < 8) {
      setError("Please write at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/tools/${toolId}/reflections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt.id,
          body: body.trim(),
          authorName: authorName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error === "validation" ? "Reflection is too short or too long." : "Could not submit. Please try again.");
        return;
      }
      const data = await res.json();
      setLocalItems((items) => [
        {
          id: data.reflection.id,
          authorName: data.reflection.authorName,
          body: data.reflection.body,
          createdAt: data.reflection.createdAt,
        },
        ...items,
      ]);
      setBody("");
      setAuthorName("");
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 4000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={rootRef} className="rp-root">
      <p className="rp-prompt">{prompt.text}</p>
      <form onSubmit={onSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your reflection…"
          required
          minLength={8}
          maxLength={2000}
        />
        <div className="rp-row">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={60}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
        {error && <p className="rp-error">{error}</p>}
        {confirmed && (
          <p className="rp-success">
            Thanks — your reflection is pending review.
          </p>
        )}
      </form>

      {tickerItems.length > 0 && (
        <div className="rp-ticker">
          <div className="rp-ticker-track">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={`${item.id}-${i}`} className="rp-ticker-item">
                “{item.body}”
                <span className="rp-author">— {item.authorName}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
