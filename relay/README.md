# Relay

AI-powered classroom continuity platform. Next.js (App Router) + Supabase + Prisma,
Google Classroom via Composio, Groq for generation, Deepgram for voice handovers.

## 1. Set up Supabase

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor — creates all tables, the
   auto-provisioning trigger, `updated_at` triggers, and RLS policies.
3. Enable the **Google** provider under Authentication → Providers, using OAuth
   credentials from Google Cloud Console. Add these scopes on the Google Cloud
   consent screen (all read-only — Relay never writes to Classroom):
   `classroom.courses.readonly`, `classroom.coursework.me.readonly`,
   `classroom.courseworkmaterials.readonly`, `classroom.announcements.readonly`.
4. Create a **private** storage bucket named `handover-audio`.
5. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — same page (keep this server-only, never expose to the client).
   - `DATABASE_URL` / `DIRECT_URL` — Project Settings → Database → Connection
     string. Copy the **transaction pooler** string (port 6543) into
     `DATABASE_URL` — that's what the app uses at runtime. Copy the **session
     pooler** string (port 5432) into `DIRECT_URL` — Prisma needs this one
     specifically for `prisma db push` / `prisma migrate`, since migrations
     don't work over a transaction-mode pooler.

## 2. Set up integrations

- **Composio**: sign up at composio.dev, create a Google Classroom auth config
  (Toolkits → Google Classroom → Create Auth Config), then copy your project
  API key and the Auth Config ID (`ac_...`) into `.env.local`. The app uses
  `@composio/core` — the official SDK — rather than raw REST calls, since
  Composio's REST endpoints have moved versions more than once.
- **Groq**: get a key at console.groq.com.
- **Deepgram**: get a key at console.deepgram.com.

All three integration wrappers live in `src/lib/integrations/` — they're written
against the real APIs already, so dropping in keys is enough to go live. No mocking
layer to remove.

## 3. Install & run

```bash
npm install
npx prisma generate
npm run dev
```

Visit `localhost:3000`, sign in with Google, connect Classroom from the dashboard,
then set up a Classroom Profile for at least one class before trying "I'm Out Today".

## Architecture notes

- **Auth**: Supabase Google OAuth. A Postgres trigger (`on_auth_user_created`)
  auto-creates the `teachers` row — the app never manually provisions a teacher.
- **Data access**: Prisma connects directly to Postgres (bypasses RLS — RLS in
  `schema.sql` is a defense-in-depth backstop if you ever query via the Supabase
  client directly from a server component, which some routes do for the current
  user's session).
- **Substitute access**: no auth. `secure_token` on `relay_packs` is the sole
  credential. Packs are only reachable once `status = 'approved'` — drafts return
  404. See `src/app/substitute/[token]/page.tsx`.
- **Google Classroom sync is automatic, not manual**: classes import exactly
  once, right inside `src/app/api/classroom/callback/route.ts`, immediately
  after OAuth completes. There's no "Sync classes" button — if you need to
  re-pull classes, disconnect and reconnect.
- **Sign-out disconnects Classroom too**: `src/app/auth/signout/route.ts`
  deletes the teacher's Composio connected account before ending the Supabase
  session, so classroom access never sits linked to a session the teacher has
  left. Next sign-in starts from "not connected."
- **Self-healing connection status**: if a Composio call fails because the
  connected account was deleted/revoked (`ComposioConnectionInvalidError` in
  `src/lib/integrations/composio.ts`), the relevant route flips
  `google_connections.status` to `"error"`, which makes the dashboard show
  "Reconnect" again. This only catches it on the *next* attempted call though
  — it's reactive, not instant.
- **For instant detection once deployed**: Composio auto-detects real token
  revocation (the user revokes access in their own Google account settings)
  and flips that connection to `EXPIRED`, firing a
  `composio.connected_account.expired` webhook. This requires a public HTTPS
  URL to receive it, so it's not usable in local dev — set it up after
  deploying (Vercel gives you that public URL for free). See
  https://docs.composio.dev/docs/authentication for the exact event name and
  https://docs.composio.dev/docs/using-triggers for webhook subscription setup.
  Note this only covers *revocation*; manually deleting a connected account
  from the Composio dashboard is a direct action with no corresponding event —
  the self-healing behavior above is what catches that case.
- **AI pipeline** (`src/lib/ai/`): three single-purpose agents matching product.md
  §7 — `context-builder.ts` (gather, no generation), `relay-pack-agent.ts` (drafts
  the pack, incl. optional practice questions/quiz), `handover-agent.ts` (turns a
  transcript into the 4-point structured summary). Generated instructional content
  is never final until the teacher hits "Approve" in the AI Review step
  (`PATCH /api/relay-packs/[id]` with `action: "approve"`).
- **Design tokens** live in `tailwind.config.ts` (chalkboard green / relay amber)
  and are applied via the `.card` / `.btn-primary` / `.chip` utility classes in
  `globals.css` rather than scattered inline — change the palette in one place.

## What's stubbed vs. real

Everything is wired to real endpoints (Composio, Groq, Deepgram, Supabase Storage).
Nothing needs to be swapped out — just add API keys. The one manual step outside
this repo is registering the Google Cloud OAuth app and the Composio integration,
since those require accounts only you can create.
