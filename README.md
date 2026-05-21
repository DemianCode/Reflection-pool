# Reflection Pool

Build embeddable learning tools — reflection prompts and (soon) quizzes — for
any topic, with per-instance theming. Each "tool" you create produces two
copy-paste snippets you can drop into any website:

```html
<!-- iframe embed -->
<iframe src="https://your-app.example.com/embed/<TOOL_ID>" style="width:100%;border:0;min-height:280px" loading="lazy"></iframe>

<!-- script embed (shadow DOM) -->
<div data-rp-tool="<TOOL_ID>"></div>
<script src="https://your-app.example.com/widget.js" async></script>
```

## What's in this first pass

- **Admin** at `/admin` (single-admin auth via `ADMIN_PASSWORD`).
- **Reflection Tool** end-to-end:
  - Create per-topic tool instances.
  - Author rotating prompts.
  - Public widget: prompt rotation, validated submissions, instant local
    confirmation, scrolling ticker of approved entries.
  - Moderation queue: approve / reject / delete.
- **Both embed paths**: iframe (`/embed/<id>`) and script tag (`/widget.js`)
  that mounts into shadow DOM on the host page.
- **Theming**: pick a preset (`card`, `minimal`, `bold`, `ticker-dark`) and
  optionally append custom CSS scoped to the widget root.
- Submissions: validated (8–2000 chars), names sanitized (`<>` stripped,
  whitespace/empty becomes "Anonymous"), all created with `PENDING` status.

The Quiz tool is scaffolded in the data model (`Question` table, `QUIZ` type)
but not yet wired into the widget. That's the next slice.

## Getting set up locally

Requires Node 22+, npm, and a Postgres 14+ server.

```bash
# 1. Install deps
npm install

# 2. Configure env (copy and edit)
cp .env.example .env
# Set DATABASE_URL to your local Postgres, e.g.:
#   postgresql://USER:PASSWORD@localhost:5432/reflection_pool?schema=public
# Set ADMIN_PASSWORD and AUTH_SECRET (32+ chars).

# 3. Run migrations
npx prisma migrate dev

# 4. (Optional) seed a sample tool
npx tsx prisma/seed.ts

# 5. Start the dev server
npm run dev
```

Then:
- `http://localhost:3000/` → marketing page with link to admin
- `http://localhost:3000/admin` → tool dashboard (you'll be redirected to `/login`)
- `http://localhost:3000/embed/<TOOL_ID>` → public iframe target

## Moving to production (Supabase, Vercel, etc.)

The only thing tying this to local Postgres is `DATABASE_URL`. To switch:

1. Provision a Postgres database (Supabase, Neon, Railway, etc.).
2. Update `DATABASE_URL` in your hosting provider's env vars.
3. Run `npx prisma migrate deploy` against the production DB.
4. Set `ADMIN_PASSWORD`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL`.

No code changes needed.

## Data model (Prisma)

- `Tool` — type (`REFLECTION` | `QUIZ`), title, topic, themePreset, customCss
- `Prompt` — belongs to a reflection Tool; text, active, order
- `Reflection` — belongs to Prompt; authorName, body, status
  (`PENDING`/`APPROVED`/`REJECTED`)
- `Question` — belongs to a quiz Tool; text, options (jsonb), correctIndex,
  explanation, bank, active

## Embed delivery

- **iframe** (`/embed/<id>`): the safest option. Full style isolation; the
  embedded widget posts its height via `postMessage` so the host page can
  auto-resize if desired.
- **Script** (`/widget.js` + `<div data-rp-tool>`): the widget mounts into a
  Shadow DOM rooted on the host's div, so host page CSS can't leak in.
  Convenient when the host wants a single `<script>` tag.

The script bundle (`/widget.js`) is a tiny standalone vanilla-JS implementation
— **not** the React component — so it has zero peer-dependency requirements
on the host page.

## Theming

Each tool stores:
- `themePreset` — one of the named presets in `src/lib/themes.ts`. Each preset
  sets CSS variables (`--rp-bg`, `--rp-accent`, `--rp-radius`, etc.) plus the
  base widget styles.
- `customCss` — optional CSS appended after the preset, scoped to `.rp-root`
  (and `:host` in shadow DOM).

To add a new preset, add an entry to `THEME_PRESETS` and `PRESET_CSS` in
`src/lib/themes.ts`.
