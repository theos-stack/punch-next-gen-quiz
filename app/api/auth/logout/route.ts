import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Redirect to the public login screen even if an expired session cannot be cleared remotely.
  }

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
