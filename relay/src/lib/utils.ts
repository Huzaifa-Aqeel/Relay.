import { randomBytes } from "crypto";

// Generates the secure, unguessable token substitutes use to open a Relay Pack.
// URL-safe, 32 bytes -> 43 base64url chars, no DB round-trip needed to be unique
// in practice, but the DB column still enforces uniqueness as a backstop.
export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// Teachers can write a longer, messy prompt for the AI's context but mark the
// exact words they want the substitute to read verbatim by prefixing them
// with "INSTRUCTION:". Only the text after that marker becomes the
// substitute-facing "Teacher's activity instruction" — everything before it
// is still sent to the AI as context, just never shown directly. If the
// marker isn't present at all, this returns "" — there is no fallback to
// showing the whole prompt; the UI hides that section entirely in that case.
export function extractDisplayInstruction(rawInstruction: string): string {
  const match = rawInstruction.match(/INSTRUCTION\s*:\s*([\s\S]*)/i);
  return match ? match[1].trim() : "";
}
