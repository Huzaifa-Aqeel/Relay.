# Relay

**AI-powered classroom continuity for teachers **

> Class doesn't stop when you're out.

## The problem

When a teacher is unexpectedly absent, the substitute gets almost nothing useful: a
sticky note, a half-remembered verbal handoff, or silence. Google Classroom organizes
coursework, but it doesn't capture the operational knowledge a substitute actually
needs — classroom routines, which students need extra support, what today's lesson
was really about. That knowledge lives only in the teacher's head, and it's usually
too late to get it out of there once they're already sick in bed.

## What it does

- **"I'm Out Today"** — a teacher describes their intent in one sentence (or dictates
  it by voice). Relay combines that with their real Google Classroom coursework and
  their saved classroom profile to draft a substitute-ready pack.
- **Grounded, not guessed** — Relay only generates practice questions or a review quiz or any material
  when there's real, recently-posted coursework to base them on. If there isn't, it
  says so plainly instead of inventing plausible-sounding content about the wrong
  topic.
- **Nothing is shareable until approved** — a teacher can regenerate as many times as
  they want; nothing is saved to the database, and no substitute link exists, until
  they explicitly click Approve.
- **One secure link, no account** — the substitute opens today's activity, class
  routines, and student support notes without signing up for anything.
- **Voice handover → Reintegration Brief** — the substitute records a 60-second voice
  summary at the end of class. Relay turns it into a structured brief (what got done,
  who needs follow-up, what to know before tomorrow) so the teacher can catch up in
  under a minute instead of replaying an audio file.

## Demo


- **Demo video:** : https://youtu.be/RA9TACechlM?si=3AbtNszFmAsyHZud


## ⚠️ Access note for judges

This project uses real Google Classroom data via OAuth, and the Google Cloud
consent screen is still in **Testing** mode (not yet through Google's app
verification process — a multi-week process not practical to complete before this
submission). In Testing mode, Google only allows sign-in from Google accounts
explicitly added as test users.

**If you'd like to sign in and try the live app yourself, email me your Google
account address at _\[your email here]_ and I'll add you as a test user** — takes
under a minute on my end. Alternatively, the demo video walks through the full
flow end-to-end if you'd rather not wait on that.

## Tech stack

Next.js_14 (AppRouter) · Supabase (Auth + Postgres + Storage) · Prisma · Composio
(Google Classroom) · Groq (LLM) · Deepgram (speech-to-text) · Tailwind

## How it works

Three single-purpose AI steps, matching how a human would actually do this task:

1. **Context Builder** — gathers the teacher's instruction, saved classroom routines,
   student support notes, and recently-posted Google Classroom coursework. No
   generation happens here, just assembly.
2. **Relay Pack Agent** — decides whether the teacher's instruction calls for
   practice questions or a quiz, and if so, drafts them *from the actual coursework
   fetched above*. If there's no coursework to ground them in, it skips generation
   entirely rather than let an LLM guess. Everything the substitute sees under
   "Today's Activity" is the teacher's own words — the AI never rewrites or
   paraphrases the teacher's intent.
3. **Handover Agent** — after class, turns the substitute's voice recording into a
   structured four-part summary (lesson coverage, student watchlist, classroom
   environment, tomorrow's handover).

Substitute access is a bare secure token, not an account — `relay_packs.secure_token`
is the only credential, and a pack is unreachable until its status is `approved`.


## What's next
- Wire up Composio's `connected_account.expired` webhook for instant reconnect
  detection instead of catching it on the next failed call
- Multi-day absence planning, not just single-day
- Move past Google's unverified/testing OAuth mode for real public use
- collabration with teachers for testing and review.


## Architecture notes

- **Auth**: Supabase Google OAuth. A Postgres trigger (`on_auth_user_created`)
  auto-creates the `teachers` row.
- **Data access**: Prisma connects directly to Postgres. RLS in `schema.sql` is a
  defense-in-depth backstop for any direct Supabase-client queries.
- **Substitute access**: no auth, `secure_token` is the sole credential. A pack is
  only reachable once `status = 'approved'` — nothing is ever created in the
  database as a "draft"; `POST /api/relay-packs` is the only route that ever writes
  a row, and it only runs when the teacher clicks Approve.
- **Google Classroom sync is automatic**: classes import once, immediately after
  OAuth completes, inside `src/app/api/classroom/callback/route.ts`.
- **Sign-out disconnects Classroom too**: `src/app/auth/signout/route.ts` deletes the
  teacher's Composio connected account before ending the session.
- **Self-healing connection status**: a failed Composio call (revoked/deleted
  account) flips `google_connections.status` to `"error"`, surfacing "Reconnect" on
  the dashboard on the next page load.
- **Design tokens** live in `tailwind.config.ts`, applied via `.card` / `.btn-primary`
  / `.chip` utility classes in `globals.css`.
