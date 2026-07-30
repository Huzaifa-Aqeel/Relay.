// Relay Pack Agent
// Generates ONLY grounded instructional content — practice questions or a
// review quiz drawn from real coursework. It does not write a "today's
// activity" summary or paraphrase the teacher's instruction in any way:
// what's shown to the substitute for that is the teacher's own
// INSTRUCTION: text, verbatim, with zero AI involvement. This keeps the
// one thing an app can quietly get subtly wrong — restating intent in its
// own words — out of the loop entirely.
import { groqComplete } from "../integrations/groq";
import type { ClassroomState } from "./context-builder";
import type { StudentSupportProfile } from "@/types";

export interface RelayPackDraft {
  generatedContent: { type: "practice_questions" | "review_quiz" | "none"; items: string[] } | null;
  classroomInfo: {
    routines: Record<string, unknown>;
    studentSupportProfiles: StudentSupportProfile[];
  };
}

const SYSTEM_PROMPT = `You are the Relay Pack Agent for Relay, a substitute-teacher continuity tool.
Your only job is deciding whether the teacher's instruction asks for practice questions or a review
quiz, and if so, drafting them FROM the real coursework provided below — nothing else.

Return ONLY valid JSON matching this shape:
{
  "generatedContentType": "practice_questions" | "review_quiz" | "none",
  "generatedContent": string[]   // the actual questions/quiz items, grounded in the coursework below, or [] if none
}
Only produce content if the teacher's instruction actually asks for practice questions, a quiz, or
similar — otherwise generatedContentType is "none" and generatedContent is [].
Base every question directly on the coursework provided below — titles, descriptions, whatever is
there. Never invent facts, topics, or academic content not present in that coursework.
Do not write any summary, explanation, timing, or classroom instructions — the app handles all of
that separately and does not use anything else from you.`;

export async function draftRelayPack(state: ClassroomState): Promise<RelayPackDraft> {
  // If there's no real coursework to ground questions in, there is nothing
  // for the AI to usefully do — skip the call entirely rather than ask a
  // model to guess. This is a code-level guarantee, not a prompt request.
  if (state.recentCoursework.length === 0) {
    return {
      generatedContent: null,
      classroomInfo: {
        routines: state.classroomRoutines,
        studentSupportProfiles: state.studentSupportProfiles
      }
    };
  }

  const userPrompt = `Teacher's instruction: "${state.teacherInstruction}"

Class: ${state.className} (${state.section})

Recent coursework (last 2 days):
${state.recentCoursework.map((c) => `- ${c.title}: ${c.description}`).join("\n")}`;

  const raw = await groqComplete({ system: SYSTEM_PROMPT, user: userPrompt, json: true });

  let parsed: any;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("Relay Pack Agent: failed to parse Groq response as JSON. Raw output:", raw);
    throw new Error("The AI response couldn't be parsed — please try again.");
  }

  const wantsContent = parsed.generatedContentType && parsed.generatedContentType !== "none";

  return {
    generatedContent: wantsContent
      ? { type: parsed.generatedContentType, items: parsed.generatedContent ?? [] }
      : null,
    classroomInfo: {
      routines: state.classroomRoutines,
      studentSupportProfiles: state.studentSupportProfiles
    }
  };
}
