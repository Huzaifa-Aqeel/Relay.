import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/integrations/deepgram";

export async function POST(request: Request) {
  const form = await request.formData();
  const audio = form.get("audio") as File | null;
  if (!audio) return NextResponse.json({ error: "No audio provided" }, { status: 400 });

  const buffer = await audio.arrayBuffer();
  const transcript = await transcribeAudio(buffer, audio.type || "audio/webm");
  return NextResponse.json({ transcript });
}
