import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { StructuredHandover } from "@/lib/ai/handover-agent";

export default async function ReintegrationPage({ params }: { params: { absenceId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const absence = await prisma.absence.findFirst({
    where: { id: params.absenceId, teacherId: user.id },
    include: { relayPacks: { include: { class: true, handovers: true } } }
  });
  if (!absence) notFound();

  const withHandovers = absence.relayPacks.filter((p) => p.handovers.length > 0);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <p className="label-eyebrow mb-1">REINTEGRATION BRIEF</p>
      <h1 className="text-3xl font-display font-semibold mb-2">{formatDate(absence.absenceDate)}</h1>
      <p className="text-muted mb-10">What happened while you were out — from your substitute&rsquo;s handover.</p>

      {withHandovers.length === 0 && (
        <p className="text-sm text-muted">No handovers submitted yet for this absence.</p>
      )}

      <div className="space-y-8">
        {withHandovers.map((pack) => {
          const summary = pack.handovers[0].structuredSummary as unknown as StructuredHandover;
          return (
            <div key={pack.id} className="card">
              <h2 className="font-display font-semibold text-lg mb-4">
                {pack.class.className} <span className="text-muted text-sm font-sans">— {pack.class.section}</span>
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted font-mono mb-2">Completed</p>
                  <ul className="text-sm space-y-1">
                    {summary.lessonCoverage.completed.length > 0 ? (
                      summary.lessonCoverage.completed.map((c, i) => <li key={i}>✓ {c}</li>)
                    ) : (
                      <li className="text-muted">Nothing noted</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted font-mono mb-2">Outstanding</p>
                  <ul className="text-sm space-y-1">
                    {summary.lessonCoverage.notCompleted.length > 0 ? (
                      summary.lessonCoverage.notCompleted.map((c, i) => <li key={i}>○ {c}</li>)
                    ) : (
                      <li className="text-muted">Nothing noted</li>
                    )}
                  </ul>
                </div>
              </div>

              {summary.studentWatchlist.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wide text-muted font-mono mb-2">Student watchlist</p>
                  <ul className="text-sm space-y-1.5">
                    {summary.studentWatchlist.map((s, i) => (
                      <li key={i} className="border-l-2 border-accent pl-3">
                        <span className="font-medium">{s.student}</span> — {s.note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.classroomEnvironment && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wide text-muted font-mono mb-2">Classroom environment</p>
                  <p className="text-sm">{summary.classroomEnvironment}</p>
                </div>
              )}

              {summary.tomorrowsHandover && (
                <div className="mt-5 bg-accent-light/40 rounded-md p-3">
                  <p className="text-xs uppercase tracking-wide text-accent-dark font-mono mb-1">
                    Before class tomorrow
                  </p>
                  <p className="text-sm">{summary.tomorrowsHandover}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
