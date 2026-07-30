import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { disconnectGoogleClassroom } from "@/lib/integrations/composio";

// Signing out of Relay also disconnects Google Classroom — a teacher's
// classroom access shouldn't stay linked to a browser session they've
// already left. This is a full delete (not disable), so the next sign-in
// starts from a clean "not connected" state rather than a paused one.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const connection = await prisma.googleConnection.findUnique({ where: { teacherId: user.id } });
    if (connection) {
      try {
        await disconnectGoogleClassroom(connection.composioConnectedAccount);
      } catch (err) {
        // Already gone on Composio's side, or a transient API error — either
        // way, don't block sign-out over it. We still clear our own row below.
        console.error("Failed to disconnect Google Classroom on sign-out:", err);
      }
      await prisma.googleConnection.delete({ where: { teacherId: user.id } }).catch(() => {});
    }
  }

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
