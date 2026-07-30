// Handover Agent
// Converts the substitute's raw voice-handover transcript into the structured
// summary that powers the teacher's Reintegration Brief. Follows the 4-point
// framework from product.md section 7 (Lesson Coverage, Student Watchlist,
// Classroom Environment, Tomorrow's Handover).
import { groqComplete } from "../integrations/groq";

export interface StructuredHandover {
  lessonCoverage: { completed: string[]; notCompleted: string[] };
  studentWatchlist: { student: string; note: string }[];
  classroomEnvironment: string;
  tomorrowsHandover: string;
}

const SYSTEM_PROMPT = `You are the Handover Agent for Relay. A substitute teacher just recorded a
short voice summary after covering a class. Convert the transcript into JSON with this exact shape:
{
  "lessonCoverage": { "completed": string[], "notCompleted": string[] },
  "studentWatchlist": [{ "student": string, "note": string }],
  "classroomEnvironment": string,
  "tomorrowsHandover": string
}
If a section wasn't mentioned in the transcript, return an empty array/string for it — never invent
details. Keep entries short and scannable; the returning teacher is reading this in under a minute.`;

export async function structureHandover(transcript: string): Promise<StructuredHandover> {
  const raw = await groqComplete({
    system: SYSTEM_PROMPT,
    user: `Transcript:\n"""${transcript}"""`,
    json: true,
    temperature: 0.2
  });
  const parsed = JSON.parse(raw);
  return {
    lessonCoverage: {
      completed: parsed.lessonCoverage?.completed ?? [],
      notCompleted: parsed.lessonCoverage?.notCompleted ?? []
    },
    studentWatchlist: parsed.studentWatchlist ?? [],
    classroomEnvironment: parsed.classroomEnvironment ?? "",
    tomorrowsHandover: parsed.tomorrowsHandover ?? ""
  };
}
