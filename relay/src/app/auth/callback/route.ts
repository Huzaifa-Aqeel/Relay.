import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // The teachers row is auto-created by the on_auth_user_created trigger,
  // so we can send them straight to the dashboard.
  return NextResponse.redirect(`${origin}/dashboard`);
}
