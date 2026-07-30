import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { buildClassroomState } from "@/lib/ai/context-builder";
import { draftRelayPack } from "@/lib/ai/relay-pack-agent";
import { extractDisplayInstruction } from "@/lib/utils";
import type { RelayPackContent, StudentSupportProfile } from "@/types";

// Kicks off (or continues) the selected-class "I'm Out Today" flow. This
// route only GENERATES content — it never writes a relay_packs row. Nothing
// is persisted until the teacher explicitly approves it (see POST
// /api/relay-packs), so navigating away mid-review leaves no trace behind.
// Each teacher has one absence per day and can have at most one APPROVED
// Relay Pack per class under that absence; the absence row itself is created
// here since it's just a day marker, not a shareable artifact.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { instruction, classId } = await request.json();
  if (!instruction || typeof instruction !== "string") {
    return NextResponse.json({ error: "Instruction is required" }, { status: 400 });
  }
  if (!classId || typeof classId !== "string") {
    return NextResponse.json({ error: "Select a class before preparing a Relay Pack" }, { status: 400 });
  }

  const [classRecord, connection] = await Promise.all([
    prisma.class.findFirst({ where: { id: classId, teacherId: user.id, isActive: true } }),
    prisma.googleConnection.findUnique({ where: { teacherId: user.id } })
  ]);

  if (!classRecord) {
    return NextResponse.json({ error: "That class is unavailable" }, { status: 404 });
  }

  // `absence_date` is a Postgres DATE. Use a stable midnight UTC value so the
  // lookup and insert use the exact same date representation.
  const today = new Date();
  const absenceDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let absence = await prisma.absence.findFirst({ where: { teacherId: user.id, absenceDate } });
  if (!absence) {
    try {
      absence = await prisma.absence.create({ data: { teacherId: user.id, absenceDate, status: "active" } });
    } catch (err: any) {
      // Another request may have created today's absence first. The unique
      // database constraint keeps that race safe; reuse the winning row.
      if (err?.code !== "P2002") throw err;
      absence = await prisma.absence.findFirst({ where: { teacherId: user.id, absenceDate } });
      if (!absence) throw err;
    }
  }

  // Only an already-APPROVED pack blocks a re-generation — since drafts are
  // never persisted, generating (or regenerating) as many times as needed
  // before approving is always allowed.
  const existingPack = await prisma.relayPack.findUnique({
    where: { absenceId_classId: { absenceId: absence.id, classId: classRecord.id } }
  });
  if (existingPack) {
    return NextResponse.json(
      { error: "You have already created a Relay Pack for this class today.", code: "RELAY_PACK_EXISTS" },
      { status: 409 }
    );
  }

  const state = await buildClassroomState({
    teacherId: user.id,
    connectedAccountId: connection?.composioConnectedAccount ?? null,
    googleCourseId: classRecord.googleCourseId,
    className: classRecord.className,
    section: classRecord.section,
    teacherInstruction: instruction,
    classroomRoutines: classRecord.classroomRoutines as Record<string, unknown>,
    studentSupportProfiles: classRecord.studentSupportProfiles as unknown as StudentSupportProfile[]
  });
  const draft = await draftRelayPack(state);
  const content: RelayPackContent = {
    ...draft,
    teacherInstruction: extractDisplayInstruction(instruction),
    rawInstruction: instruction
  };

  return NextResponse.json({
    absenceId: absence.id,
    classId: classRecord.id,
    className: classRecord.className,
    section: classRecord.section,
    content,
    hasCoursework: state.recentCoursework.length > 0
  });
}
