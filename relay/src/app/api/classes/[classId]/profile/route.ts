import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { classId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const classRecord = await prisma.class.findFirst({
    where: { id: params.classId, teacherId: user.id }
  });
  if (!classRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.class.update({
    where: { id: params.classId },
    data: {
      classroomRoutines: body.classroomRoutines ?? {},
      studentSupportProfiles: body.studentSupportProfiles ?? []
    }
  });

  // A class profile counts toward the teacher's overall profile-completed flag
  // once at least one class has routines saved.
  await prisma.teacherProfile.upsert({
    where: { teacherId: user.id },
    create: { teacherId: user.id, profileCompleted: true },
    update: { profileCompleted: true }
  });

  return NextResponse.json({ ok: true });
}
