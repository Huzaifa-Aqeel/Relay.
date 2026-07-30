"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SUGGESTION_CHIPS } from "@/types";
import type { RelayPackContent } from "@/types";

type GeneratedPack = {
  absenceId: string;
  classId: string;
  className: string;
  section: string;
  content: RelayPackContent;
  hasCoursework: boolean;
};
type Step = "instruction" | "review" | "done";

function ImOutTodayContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");
  const [step, setStep] = useState<Step>("instruction");
  const [instruction, setInstruction] = useState("");
  const [recording, setRecording] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [pack, setPack] = useState<GeneratedPack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Used for both the first generation and Regenerate — nothing is ever
  // persisted here, so calling this again before approving is always safe.
  async function generate() {
    if (!instruction.trim() || !classId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, classId })
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      const data: GeneratedPack = await res.json();
      setPack(data);
      setStep("review");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  // The ONLY action that actually creates a relay_packs row. If the teacher
  // never clicks this — regenerates a dozen times, or just navigates away —
  // nothing was ever written to the database.
  async function approve() {
    if (!pack) return;
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/relay-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ absenceId: pack.absenceId, classId: pack.classId, content: pack.content })
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Approval failed");
      setStep("done");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApproving(false);
    }
  }

  // Returns to the instruction step without persisting anything — there's
  // nothing to undo since Approve is the only thing that ever writes to the
  // database. The typed instruction stays so nothing has to be retyped.
  function goBack() {
    setPack(null);
    setError(null);
    setStep("instruction");
  }

  // Long-press-to-record voice input, per product.md.
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob);
      const res = await fetch("/api/transcribe", { method: "POST", body: form }).catch(() => null);
      if (res?.ok) {
        const { transcript } = await res.json();
        setInstruction((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <p className="label-eyebrow mb-1">I&rsquo;M OUT TODAY</p>

      {step === "instruction" && (
        <>
          <h1 className="text-3xl font-display font-semibold mb-2">How should learning continue?</h1>
          <p className="text-muted mb-8">
            Describe your intent in plain language — Relay combines it with your classroom context to
            build a substitute-ready pack for the class you selected.
          </p>

          {!classId && (
            <p className="text-sm text-accent-dark mb-4">
              Choose a class from the dashboard before preparing a Relay Pack.
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTION_CHIPS.map((chip) => (
              <button key={chip} className="chip" onClick={() => setInstruction(chip)}>
                {chip}
              </button>
            ))}
          </div>

          <textarea
            className="w-full border border-line rounded-md p-4 text-sm bg-paper focus:border-primary outline-none mb-2"
            rows={5}
            placeholder="e.g. Continue today's lesson and generate practice questions. INSTRUCTION: Give students 20 minutes to review before working independently, then discuss as a class."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <p className="text-xs text-muted mb-4">
            Write as much context as you want above — to give the substitute a specific, word-for-word
            instruction, add <span className="font-mono text-ink">INSTRUCTION:</span> followed by exactly
            what they should read. Only that part is shown to the substitute — if you don&rsquo;t include
            it, no instruction quote is shown to them at all.
          </p>

          <div className="flex items-center gap-3">
            <button onClick={generate} disabled={generating || !instruction.trim() || !classId} className="btn-primary">
              {generating ? "Building Relay Pack..." : "Prepare Relay Pack"}
            </button>
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`btn-secondary ${recording ? "bg-accent-light border-accent" : ""}`}
            >
              {recording ? "Recording... release to stop" : "Hold to dictate"}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </>
      )}

      {step === "review" && pack && (
        <>
          <h1 className="text-3xl font-display font-semibold mb-2">Review before sending</h1>
          <p className="text-muted mb-8">
            Approve this Relay Pack, or regenerate if the draft isn&rsquo;t right. Nothing is saved or
            shareable with a substitute until you approve it — regenerate as many times as you want.
          </p>
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-lg">
                {pack.className} <span className="text-muted text-sm font-sans">— {pack.section}</span>
              </h2>
            </div>
            {!pack.hasCoursework && (
              <p className="text-sm text-red-600 mb-3">
                No recent coursework was found in Google Classroom — if you want the substitute to
                follow the teacher&rsquo;s instruction directly, approve as-is.
              </p>
            )}
            <p className="text-sm mb-3">
              {pack.content.teacherInstruction || (
                <span className="text-muted italic">No specific instruction was provided.</span>
              )}
            </p>
            {pack.content.generatedContent && (
              <div className="bg-primary-light/40 rounded-md p-3 mb-3">
                <p className="text-xs uppercase tracking-wide text-primary-dark mb-2 font-mono">
                  {pack.content.generatedContent.type === "practice_questions" ? "Practice questions" : "Review quiz"}
                </p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  {pack.content.generatedContent.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={approve} disabled={approving} className="btn-primary text-sm px-3 py-1.5">
                {approving ? "Approving..." : "Approve"}
              </button>
              <button onClick={generate} disabled={generating} className="btn-secondary text-sm px-3 py-1.5">
                {generating ? "Regenerating..." : "Regenerate"}
              </button>
              <button
                onClick={goBack}
                disabled={approving || generating}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Go back
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </>
      )}

      {step === "done" && (
        <>
          <h1 className="text-3xl font-display font-semibold mb-2">All set</h1>
          <p className="text-muted mb-8">
            The Relay Pack is ready. Share the secure link with your substitute, or find it anytime from
            the dashboard.
          </p>
          <Link href="/dashboard" className="btn-primary inline-block">
            Back to dashboard
          </Link>
        </>
      )}
    </main>
  );
}

// useSearchParams() requires a Suspense boundary during static generation —
// next dev doesn't enforce this, but next build does. This wrapper is the
// actual page export; ImOutTodayContent holds all the real logic above.
export default function ImOutTodayPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-6 py-12">
          <p className="text-muted text-sm">Loading...</p>
        </main>
      }
    >
      <ImOutTodayContent />
    </Suspense>
  );
}
