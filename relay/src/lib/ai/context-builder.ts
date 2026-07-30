// Context Builder Agent
// Assembles the single structured "classroom state" that every later step
// (Relay Pack Agent) reads from. Does no generation itself — just gathering
// and organizing, per product.md section 7.
import { fetchRecentCoursework, ComposioConnectionInvalidError } from "../integrations/composio";
import { prisma } from "../prisma";
import type { StudentSupportProfile } from "@/types";

export interface ClassroomState {
  className: string;
  section: string;
  teacherInstruction: string;
  classroomRoutines: Record<string, unknown>;
  studentSupportProfiles: StudentSupportProfile[];
  recentCoursework: Awaited<ReturnType<typeof fetchRecentCoursework>>;
}

export async function buildClassroomState(params: {
  teacherId: string;
  connectedAccountId: string | null;
  googleCourseId: string;
  className: string;
  section: string;
  teacherInstruction: string;
  classroomRoutines: Record<string, unknown>;
  studentSupportProfiles: StudentSupportProfile[];
}): Promise<ClassroomState> {
  let recentCoursework: ClassroomState["recentCoursework"] = [];

  if (params.connectedAccountId) {
    try {
      recentCoursework = await fetchRecentCoursework(
        params.teacherId,
        params.connectedAccountId,
        params.googleCourseId
      );
    } catch (err) {
      // Classroom coursework is a nice-to-have for the Relay Pack, not a
      // hard requirement — the teacher's instruction and stored classroom
      // profile are still enough to build something useful. So we degrade
      // gracefully (empty coursework) rather than failing the whole
      // "I'm Out Today" flow over a broken Classroom connection.
      if (err instanceof ComposioConnectionInvalidError) {
        console.error(`Google Classroom connection invalid for teacher ${params.teacherId}:`, err.message);
        await prisma.googleConnection
          .update({ where: { teacherId: params.teacherId }, data: { status: "error" } })
          .catch(() => {});
      } else {
        console.error("Failed to fetch recent coursework:", err);
      }
    }
  }

  return {
    className: params.className,
    section: params.section,
    teacherInstruction: params.teacherInstruction,
    classroomRoutines: params.classroomRoutines,
    studentSupportProfiles: params.studentSupportProfiles,
    recentCoursework
  };
}
