"use client";

import { useRef, useState } from "react";

const PROMPTS = [
  "Lesson coverage — what was completed, and what wasn't?",
  "Student watchlist — which students need academic or behavioral follow-up?",
  "Classroom environment — any disruptions or operational issues?",
  "Tomorrow's handover — the one thing the teacher must know before class"
];

export default function VoiceHandover({ token }: { token: string }) {
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function stopAndSubmit() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setSubmitting(true);

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob);
      const res = await fetch(`/api/substitute/${token}/handover`, { method: "POST", body: form });
      setSubmitting(false);
      if (res.ok) setSubmitted(true);
    };
    recorder.stop();
  }

  if (submitted) {
    return <p className="text-sm text-primary">Handover submitted. Thanks for covering this class.</p>;
  }

  return (
    <div>
      <ul className="text-sm text-muted space-y-1.5 mb-5">
        {PROMPTS.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="text-accent-dark">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {!recording && !submitting && (
        <button onClick={start} className="btn-primary">
          Start voice handover
        </button>
      )}
      {recording && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-accent-dark">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </span>
          <button onClick={stopAndSubmit} className="btn-primary">
            Stop &amp; submit
          </button>
        </div>
      )}
      {submitting && <p className="text-sm text-muted">Submitting handover...</p>}
    </div>
  );
}
