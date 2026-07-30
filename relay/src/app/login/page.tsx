"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: [
          "https://www.googleapis.com/auth/classroom.courses.readonly",
          "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
          "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
          "https://www.googleapis.com/auth/classroom.announcements.readonly"
        ].join(" ")
      }
    });
  }

  return (
    <main className="min-h-screen bg-base">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="label-eyebrow tracking-[0.2em]">RELAY</span>
        <button
          onClick={signIn}
          className="text-sm font-medium text-ink hover:text-primary transition-colors"
        >
          Sign in →
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="label-eyebrow mb-4">Classroom continuity, handled</p>
          <h1 className="text-5xl sm:text-6xl font-display font-semibold text-ink leading-[1.05] mb-6">
            Class doesn&rsquo;t stop
            <br />
            when you&rsquo;re out.
          </h1>
          <p className="text-muted text-lg leading-relaxed mb-10 max-w-md">
            Connect Google Classroom once. When you&rsquo;re unexpectedly out, Relay turns your
            classroom context and one instruction into a substitute-ready pack — then hands your
            summary back to you when you return.
          </p>

          <div className="flex items-center gap-4 mb-12">
            <button onClick={signIn} className="btn-primary flex items-center gap-2 px-6 py-3 text-base">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 009 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.97 10.72A5.4 5.4 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 000 9c0 1.45.35 2.83.95 4.05l3.02-2.33z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 00.95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Signature element: the handoff */}
          <div className="flex items-center gap-3 text-sm font-mono text-muted max-w-xs">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span>You</span>
            <span className="flex-1 h-px bg-line relative">
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent" />
            </span>
            <span>Substitute</span>
            <span className="flex-1 h-px bg-line" />
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span>You</span>
          </div>
        </div>

        {/* Hero visual: a mocked Relay Pack card for credibility */}
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/5 rounded-lg -rotate-1" />
          <div className="card relative shadow-sm">
            <p className="label-eyebrow mb-1">RELAY PACK</p>
            <h3 className="font-display font-semibold text-xl mb-4">
              Algebra I <span className="text-muted text-sm font-sans">— Period 4</span>
            </h3>
            <div className="flex gap-2 mb-5 text-xs font-mono">
              <span className="px-2 py-1 rounded-full bg-primary-light text-primary-dark">
                Today&rsquo;s Activity
              </span>
              <span className="px-2 py-1 rounded-full text-muted">Class Routine</span>
              <span className="px-2 py-1 rounded-full text-muted">Handover</span>
            </div>
            <div className="bg-primary-light/40 rounded-md p-3 mb-3">
              <p className="text-xs uppercase tracking-wide text-primary-dark mb-1 font-mono">
                Practice questions
              </p>
              <p className="text-sm">1. Solve for x: 3x + 7 = 22</p>
              <p className="text-sm">2. Simplify: 4(2x − 3) + 5</p>
            </div>
            <div className="border-l-2 border-accent pl-3">
              <p className="text-xs uppercase tracking-wide text-muted font-mono mb-1">
                Teacher&rsquo;s activity instruction
              </p>
              <p className="text-sm">Give students 20 minutes to review before working independently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — maps to product.md's 3 phases */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <p className="label-eyebrow mb-3">How it works</p>
        <h2 className="text-3xl font-display font-semibold mb-12 max-w-lg">
          Three moments. One connected flow.
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Before class",
              body: "Tell Relay how learning should continue — a sentence is enough. It combines that with your classroom context to prepare a substitute-ready pack."
            },
            {
              step: "02",
              title: "During class",
              body: "Your substitute opens one secure link — no account needed. Today's activity, class routines, and student support info, organized and ready."
            },
            {
              step: "03",
              title: "When you're back",
              body: "Your substitute leaves a short voice handover. Relay turns it into a Reintegration Brief — what happened, in under a minute to read."
            }
          ].map((s) => (
            <div key={s.step}>
              <p className="font-mono text-accent-dark text-sm mb-3">{s.step}</p>
              <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-muted">
          <span className="label-eyebrow">RELAY</span>
          <span>Built for teachers, not around them.</span>
        </div>
      </footer>
    </main>
  );
}
