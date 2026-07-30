import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fetchClasses } from "@/lib/integrations/composio";

// Step 2 of "Connect Google Classroom": Composio redirects here once the
// teacher finishes Google OAuth, appending status + connected_account_id.
// We store connected_account_id and pass it explicitly on every later
// Composio call — relying on Composio's own userId-based auto-lookup
// breaks the moment a teacher has more than one connected account under
// the same auth config.
//
// This is also the app's ONLY class-import path — there's no manual "sync"
// button. Classes are pulled once, right here, immediately after the
// teacher finishes connecting.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const connectedAccountId = url.searchParams.get("connected_account_id");

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  if (status !== "success" || !connectedAccountId) {
    return NextResponse.redirect(new URL("/dashboard?classroom_error=1", request.url));
  }

  await prisma.googleConnection.upsert({
    where: { teacherId: user.id },
    create: { teacherId: user.id, composioConnectedAccount: connectedAccountId },
    update: { composioConnectedAccount: connectedAccountId, status: "active" }
  });

  try {
    const courses = await fetchClasses(user.id, connectedAccountId);
    for (const course of courses) {
      await prisma.class.upsert({
        where: { googleCourseId: course.googleCourseId },
        create: {
          teacherId: user.id,
          googleCourseId: course.googleCourseId,
          className: course.name,
          section: course.section
        },
        update: { className: course.name, section: course.section, isActive: true }
      });
    }
    await prisma.googleConnection.update({
      where: { teacherId: user.id },
      data: { status: "active", lastSyncedAt: new Date() }
    });
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    // Connection was stored fine, but the import itself failed (e.g. a
    // transient Composio error right after linking). Mark it broken rather
    // than leaving a connection row that claims "active" but never actually
    // imported anything — the dashboard's Reconnect banner picks this up.
    console.error("Class import failed right after connecting:", err);
    await prisma.googleConnection.update({ where: { teacherId: user.id }, data: { status: "error" } });
    return NextResponse.redirect(new URL("/dashboard?classroom_error=1", request.url));
  }
}
