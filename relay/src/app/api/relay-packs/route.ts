import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateSecureToken } from "@/lib/utils";
import type { RelayPackContent } from "@/types";

// The ONLY place a relay_packs row is ever created. Called exactly once,
// when the teacher clicks Approve on generated (but never-persisted) content
// from POST /api/absences. If a teacher regenerates five times and then
// navigates away without approving, nothing here ever runs — no draft rows,
// no cleanup needed, no ifs and buts.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { absenceId, classId, content } = await request.json();
  if (!absenceId || !classId || !content) {
    return NextResponse.json({ error: "Missing absenceId, classId, or content" }, { status: 400 });
  }

  const [absence, classRecord] = await Promise.all([
    prisma.absence.findFirst({ where: { id: absenceId, teacherId: user.id } }),
    prisma.class.findFirst({ where: { id: classId, teacherId: user.id } })
  ]);
  if (!absence || !classRecord) {
    return NextResponse.json({ error: "Absence or class not found" }, { status: 404 });
  }

  try {
    const pack = await prisma.relayPack.create({
      data: {
        absenceId: absence.id,
        classId: classRecord.id,
        secureToken: generateSecureToken(),
        status: "approved",
        expiresAt: addOneWeek(absence.absenceDate),
        relayPackJson: content as RelayPackContent as any
      }
    });
    return NextResponse.json({ pack });
  } catch (err: any) {
    // Race: two approve clicks (double-submit, or two tabs) for the same
    // class on the same absence. The unique constraint makes this safe.
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "You have already created a Relay Pack for this class today.", code: "RELAY_PACK_EXISTS" },
        { status: 409 }
      );
    }
    throw err;
  }
}

function addOneWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 7);
  return d;
}
