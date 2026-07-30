import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import CopyLinkButton from "@/components/copy-link-button";

const PACK_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  approved: { label: "Ready to share", className: "bg-primary-light text-primary-dark" },
  sent: { label: "Sent", className: "bg-accent-light text-accent-dark" }
};

export default async function DashboardPage({ searchParams }: { searchParams: { classId?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [classes, connection, profile, recentPacks] = await Promise.all([
    prisma.class.findMany({ where: { teacherId: user.id, isActive: true } }),
    prisma.googleConnection.findUnique({ where: { teacherId: user.id } }),
    prisma.teacherProfile.findUnique({ where: { teacherId: user.id } }),
    prisma.relayPack.findMany({
      where: { absence: { teacherId: user.id } },
      include: { class: true, absence: true, handovers: true },
      orderBy: { createdAt: "desc" },
      take: 6
    })
  ]);

  const briefs = recentPacks.filter((p) => p.handovers.length > 0);
  const selectedClassId = searchParams.classId;
  const selectedClass = classes.find((classRecord) => classRecord.id === selectedClassId);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="flex items-center justify-between mb-12">
        <div>
          <p className="label-eyebrow mb-1">RELAY</p>
          <h1 className="text-2xl font-display font-semibold">
            {user.user_metadata?.full_name ? `Hi, ${user.user_metadata.full_name.split(" ")[0]}` : "Dashboard"}
          </h1>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-muted hover:text-ink">Sign out</button>
        </form>
      </header>

      {/* Primary action */}
      {selectedClass ? (
        <Link
          href={`/im-out-today?classId=${selectedClass.id}`}
          className="block card mb-10 border-primary/30 hover:border-primary transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="label-eyebrow mb-2 text-primary">PRIMARY ACTION · {selectedClass.className}</p>
              <h2 className="text-3xl font-display font-semibold mb-1">I&rsquo;m Out Today</h2>
              <p className="text-muted">Tell Relay how learning should continue — it handles the rest.</p>
            </div>
            <span className="text-4xl text-primary group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      ) : (
        <div className="card mb-10 border-line text-muted">
          <p className="label-eyebrow mb-2">PRIMARY ACTION</p>
          <h2 className="text-3xl font-display font-semibold mb-1">I&rsquo;m Out Today</h2>
          <p>Select a class below before preparing its Relay Pack.</p>
        </div>
      )}

      {(!connection || connection.status !== "active") && (
        <div className="card mb-10 flex items-center justify-between border-accent/40 bg-accent-light/30">
          <div>
            <p className="font-medium mb-1">
              {connection ? "Reconnect Google Classroom" : "Connect Google Classroom"}
            </p>
            <p className="text-sm text-muted">
              {connection
                ? "Your connection was revoked or expired — reconnect to keep Relay Packs up to date."
                : "Relay imports your active classes to build Relay Packs."}
            </p>
          </div>
          <a href="/api/classroom/connect" className="btn-primary">
            {connection ? "Reconnect" : "Connect"}
          </a>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <p className="label-eyebrow mb-4">Classes</p>
          {classes.length === 0 ? (
            <p className="text-muted text-sm">No classes yet. Connect Google Classroom to import them.</p>
          ) : (
            <ul className="space-y-3">
              {classes.map((c) => (
                <li
                  key={c.id}
                  className={`card flex items-center justify-between ${
                    selectedClassId === c.id ? "border-primary bg-primary-light/30" : ""
                  }`}
                >
                  <Link href={`/dashboard?classId=${c.id}`} className="flex-1" aria-label={`Select ${c.className}`}>
                    <p className="font-medium">{c.className}</p>
                    <p className="text-sm text-muted">{c.section}</p>
                  </Link>
                  <Link href={`/classes/${c.id}/profile`} className="text-sm text-primary hover:underline">
                    Classroom profile →
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {profile && !profile.profileCompleted && classes.length > 0 && (
            <p className="text-sm text-accent-dark mt-3">
              Finish setting up your classroom profile so Relay Packs are ready before you need one.
            </p>
          )}
        </section>

        <section>
          <p className="label-eyebrow mb-4">Recent Relay Packs</p>
          {recentPacks.length === 0 ? (
            <p className="text-muted text-sm">Nothing yet — Relay Packs you generate will show up here.</p>
          ) : (
            <ul className="space-y-3">
              {recentPacks.map((p) => {
                const statusInfo = PACK_STATUS_LABEL[p.status] ?? PACK_STATUS_LABEL.approved;
                return (
                  <li key={p.id} className="card">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{p.class.className}</p>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-full whitespace-nowrap ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted mb-3">{formatDate(p.absence.absenceDate)}</p>
                    <div className="flex items-center gap-4">
                      {p.handovers.length > 0 ? (
                        <Link href={`/reintegration/${p.absenceId}`} className="text-sm text-primary hover:underline">
                          View brief →
                        </Link>
                      ) : (
                        <Link href={`/relay-packs/${p.id}/preview`} className="text-sm text-primary hover:underline">
                          Preview →
                        </Link>
                      )}
                      {p.status === "approved" && <CopyLinkButton token={p.secureToken} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
