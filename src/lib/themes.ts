export type ThemePreset = "card" | "minimal" | "bold" | "ticker-dark";

export const THEME_PRESETS: { id: ThemePreset; label: string; description: string }[] = [
  { id: "card", label: "Card", description: "Soft shadows, rounded, light background." },
  { id: "minimal", label: "Minimal", description: "Borderless, transparent, inherits host typography." },
  { id: "bold", label: "Bold", description: "High contrast, large typography, vivid accent." },
  { id: "ticker-dark", label: "Ticker Dark", description: "Dark surface, neon accent — good for embed strips." },
];

const PRESET_CSS: Record<ThemePreset, string> = {
  card: `
    :host, .rp-root {
      --rp-bg: #ffffff;
      --rp-surface: #f7f7f8;
      --rp-text: #111111;
      --rp-muted: #6b7280;
      --rp-accent: #4f46e5;
      --rp-border: #e5e7eb;
      --rp-radius: 14px;
      --rp-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .rp-root { background: var(--rp-bg); color: var(--rp-text); border: 1px solid var(--rp-border); border-radius: var(--rp-radius); padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,.04); font-family: var(--rp-font); }
  `,
  minimal: `
    :host, .rp-root {
      --rp-bg: transparent;
      --rp-surface: rgba(0,0,0,0.04);
      --rp-text: inherit;
      --rp-muted: #6b7280;
      --rp-accent: #2563eb;
      --rp-border: rgba(0,0,0,0.1);
      --rp-radius: 6px;
      --rp-font: inherit;
    }
    .rp-root { background: var(--rp-bg); color: var(--rp-text); padding: 12px 0; font-family: var(--rp-font); }
  `,
  bold: `
    :host, .rp-root {
      --rp-bg: #fff7ed;
      --rp-surface: #ffedd5;
      --rp-text: #1c1917;
      --rp-muted: #57534e;
      --rp-accent: #ea580c;
      --rp-border: #fdba74;
      --rp-radius: 4px;
      --rp-font: "Georgia", ui-serif, serif;
    }
    .rp-root { background: var(--rp-bg); color: var(--rp-text); border: 2px solid var(--rp-accent); border-radius: var(--rp-radius); padding: 24px; font-family: var(--rp-font); }
    .rp-root h2, .rp-root .rp-prompt { font-weight: 800; letter-spacing: -0.02em; }
  `,
  "ticker-dark": `
    :host, .rp-root {
      --rp-bg: #0b0f19;
      --rp-surface: #131a2b;
      --rp-text: #e6e9f2;
      --rp-muted: #94a3b8;
      --rp-accent: #22d3ee;
      --rp-border: #1f2937;
      --rp-radius: 10px;
      --rp-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .rp-root { background: var(--rp-bg); color: var(--rp-text); border: 1px solid var(--rp-border); border-radius: var(--rp-radius); padding: 20px; font-family: var(--rp-font); }
  `,
};

export const WIDGET_BASE_CSS = `
  .rp-root * { box-sizing: border-box; }
  .rp-root .rp-prompt { font-size: 1.15rem; line-height: 1.4; margin: 0 0 12px 0; }
  .rp-root .rp-muted { color: var(--rp-muted); font-size: .875rem; }
  .rp-root textarea, .rp-root input[type="text"] {
    width: 100%; padding: 10px 12px; border: 1px solid var(--rp-border);
    border-radius: 8px; background: var(--rp-bg); color: var(--rp-text);
    font: inherit; font-family: var(--rp-font);
  }
  .rp-root textarea { min-height: 96px; resize: vertical; }
  .rp-root button {
    appearance: none; border: 0; background: var(--rp-accent); color: white;
    padding: 10px 16px; border-radius: 8px; cursor: pointer; font: inherit; font-weight: 600;
  }
  .rp-root button:disabled { opacity: .5; cursor: not-allowed; }
  .rp-root .rp-row { display: flex; gap: 8px; align-items: center; margin-top: 10px; }
  .rp-root .rp-row input[type="text"] { flex: 1; }
  .rp-root .rp-error { color: #dc2626; font-size: .875rem; margin-top: 6px; }
  .rp-root .rp-success { color: #059669; font-size: .875rem; margin-top: 6px; }
  .rp-root .rp-ticker {
    margin-top: 18px; overflow: hidden; border-top: 1px dashed var(--rp-border);
    padding-top: 12px;
  }
  .rp-root .rp-ticker-track {
    display: flex; gap: 32px; white-space: nowrap;
    animation: rp-scroll 40s linear infinite;
    will-change: transform;
  }
  .rp-root .rp-ticker-item { color: var(--rp-text); }
  .rp-root .rp-ticker-item .rp-author { color: var(--rp-muted); margin-left: 6px; font-size: .8rem; }
  @keyframes rp-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  .rp-root .rp-quiz-progress {
    color: var(--rp-muted); font-size: .8rem; text-transform: uppercase;
    letter-spacing: .04em; margin: 0 0 8px 0;
  }
  .rp-root .rp-quiz-question {
    font-size: 1.15rem; line-height: 1.4; margin: 0 0 14px 0; font-weight: 600;
  }
  .rp-root .rp-quiz-options {
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;
  }
  .rp-root .rp-quiz-option {
    appearance: none; text-align: left; width: 100%;
    padding: 10px 14px; border-radius: 8px;
    background: var(--rp-surface); color: var(--rp-text);
    border: 1px solid var(--rp-border); cursor: pointer;
    font: inherit; font-family: var(--rp-font); font-weight: 500;
    transition: background .15s, border-color .15s, opacity .15s;
  }
  .rp-root .rp-quiz-option:hover:not(:disabled) { border-color: var(--rp-accent); }
  .rp-root .rp-quiz-option:disabled { cursor: default; }
  .rp-root .rp-quiz-option.correct {
    border-color: #059669; color: #059669;
    box-shadow: inset 0 0 0 1px #059669;
  }
  .rp-root .rp-quiz-option.incorrect {
    border-color: #dc2626; color: #dc2626;
    box-shadow: inset 0 0 0 1px #dc2626;
  }
  .rp-root .rp-quiz-option.dim { opacity: .55; }
  .rp-root .rp-quiz-feedback { margin-top: 4px; }
  .rp-root .rp-quiz-explanation {
    color: var(--rp-muted); font-size: .9rem; margin: 6px 0 12px 0;
  }
  .rp-root .rp-quiz-next, .rp-root .rp-quiz-restart {
    margin-top: 4px;
  }
  .rp-root .rp-quiz-score {
    font-size: 1.1rem; margin: 0 0 12px 0;
  }
`;

export function buildWidgetCss(preset: ThemePreset, customCss: string | null | undefined): string {
  const base = PRESET_CSS[preset] ?? PRESET_CSS.card;
  return base + "\n" + WIDGET_BASE_CSS + "\n" + (customCss ?? "");
}
