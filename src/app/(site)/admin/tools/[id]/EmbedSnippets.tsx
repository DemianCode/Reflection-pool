"use client";

import { useEffect, useState } from "react";

export function EmbedSnippets({ toolId }: { toolId: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const base = origin || "https://your-app.example.com";

  const iframeSnippet = `<iframe
  src="${base}/embed/${toolId}"
  style="width:100%;border:0;min-height:280px"
  loading="lazy"
  title="Reflection Pool widget"
></iframe>`;

  const scriptSnippet = `<div data-rp-tool="${toolId}"></div>
<script src="${base}/widget.js" async></script>`;

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <SnippetCard label="iframe embed (recommended)" snippet={iframeSnippet} />
      <SnippetCard label="Script embed (shadow DOM)" snippet={scriptSnippet} />
      <div className="md:col-span-2">
        <h3 className="text-sm font-medium text-zinc-700 mb-2">Preview</h3>
        <iframe
          src={`${base}/embed/${toolId}`}
          className="w-full rounded-lg border border-zinc-200"
          style={{ minHeight: 320 }}
          title="Embed preview"
        />
      </div>
    </div>
  );
}

function SnippetCard({ label, snippet }: { label: string; snippet: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-zinc-200 p-3 bg-zinc-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-700">{label}</span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(snippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs rounded-md bg-zinc-900 text-white px-2 py-1 hover:bg-zinc-800"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="text-xs bg-white border border-zinc-200 rounded p-2 overflow-x-auto">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
