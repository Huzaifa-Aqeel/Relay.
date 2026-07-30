export interface ClassRecord {
  id: string;
  googleCourseId: string;
  className: string;
  section: string;
  isActive: boolean;
  classroomRoutines: Record<string, unknown>;
  studentSupportProfiles: StudentSupportProfile[];
}

export interface StudentSupportProfile {
  studentName: string;
  note: string;
}

export interface RelayPackContent {
  // No AI-written summary — what's shown to the substitute as "today's
  // activity" is teacherInstruction below, verbatim, with zero paraphrasing.
  generatedContent: { type: "practice_questions" | "review_quiz" | "none"; items: string[] } | null;
  // Present only on Relay Packs generated before class routines became a
  // teacher-managed section. Kept optional so older saved packs still render.
  classInstructions?: {
    suggestedTiming: string[];
    activitySequence: string[];
  };
  classroomInfo: {
    routines: Record<string, unknown>;
    studentSupportProfiles: StudentSupportProfile[];
  };
  teacherInstruction: string;
  // The full, unparsed prompt the teacher typed — kept separately so
  // "Regenerate" still has the complete context even after teacherInstruction
  // has been narrowed down to just the INSTRUCTION: portion for display.
  // Optional so Relay Packs generated before this existed still render fine.
  rawInstruction?: string;
}

export const SUGGESTION_CHIPS = [
  "Continue today's lesson and generate practice questions.",
  "Continue today's lesson and generate a review quiz.",
  "Continue the current project.",
  "Reading activity."
] as const;
