import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import ClassProfileForm from "@/components/class-profile-form";

export default async function ClassProfilePage({ params }: { params: { classId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const classRecord = await prisma.class.findFirst({
    where: { id: params.classId, teacherId: user.id }
  });
  if (!classRecord) notFound();

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <p className="label-eyebrow mb-1">CLASSROOM PROFILE</p>
      <h1 className="text-3xl font-display font-semibold mb-2">
        {classRecord.className} — {classRecord.section}
      </h1>
      <p className="text-muted mb-10">
        This is the operational context Google Classroom doesn&rsquo;t capture. Set it once — Relay
        reuses it every time you&rsquo;re out.
      </p>
      <ClassProfileForm
        classId={classRecord.id}
        initialRoutines={classRecord.classroomRoutines as Record<string, string>}
        initialSupportProfiles={classRecord.studentSupportProfiles as { studentName: string; note: string }[]}
      />
    </main>
  );
}
