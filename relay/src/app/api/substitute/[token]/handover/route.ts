import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { transcribeAudio } from "@/lib/integrations/deepgram";
import { structureHandover } from "@/lib/ai/handover-agent";

// Public route — substitutes are never authenticated. The secure_token IS
// the authorization. Uses the Supabase service-role client for storage since
// there's no logged-in user session to act as.
export async function POST(request: Request, { params }: { params: { token: string } }) {
  const pack = await prisma.relayPack.findUnique({ where: { secureToken: params.token } });
  if (!pack || pack.status === "draft") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await request.formData();
  const audio = form.get("audio") as File | null;
  if (!audio) return NextResponse.json({ error: "No audio provided" }, { status: 400 });

  const buffer = await audio.arrayBuffer();

  // Store the raw recording in Supabase Storage (bucket: "handover-audio",
  // create it as a private bucket in your Supabase project) so the teacher
  // can play it back later if needed.
  const admin = createAdminClient();
  const path = `${pack.id}-${Date.now()}.webm`;
  const { data: uploadData } = await admin.storage
    .from("handover-audio")
    .upload(path, buffer, { contentType: audio.type || "audio/webm" });

  const transcript = await transcribeAudio(buffer, audio.type || "audio/webm");
  const structuredSummary = await structureHandover(transcript);

  const handover = await prisma.handover.create({
    data: {
      relayPackId: pack.id,
      audioUrl: uploadData?.path ?? null,
      transcript,
      structuredSummary: structuredSummary as any
    }
  });

  await prisma.relayPack.update({ where: { id: pack.id }, data: { status: "sent" } });

  return NextResponse.json({ ok: true, handoverId: handover.id });
}
