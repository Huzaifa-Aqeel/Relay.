import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startGoogleClassroomConnection } from "@/lib/integrations/composio";

// Step 1 of "Connect Google Classroom": kick off the Composio-managed OAuth flow.
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const redirectUrl = `${new URL(request.url).origin}/api/classroom/callback`;
  try {
    const { redirectUrl: composioAuthUrl } = await startGoogleClassroomConnection(user.id, redirectUrl);
    // Composio's SDK types this as possibly null/undefined even though a
    // successful link() call always returns one — guard explicitly so the
    // TypeScript build (next build, unlike next dev) doesn't fail on the
    // narrower type NextResponse.redirect() requires.
    if (!composioAuthUrl) {
      throw new Error("Composio did not return a redirect URL");
    }
    return NextResponse.redirect(composioAuthUrl);
  } catch (err) {
    console.error("Composio connect failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error connecting to Composio" },
      { status: 500 }
    );
  }
}
