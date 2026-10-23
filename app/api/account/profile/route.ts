import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { normalizeDisplayName } from "@/lib/auth/profile-name.mjs";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const fullName = normalizeDisplayName(input.fullName);
  if (!fullName) {
    return NextResponse.json({ error: "Enter a display name between 2 and 60 characters." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getClaims();
    const studentId = auth?.claims?.sub;
    if (authError || typeof studentId !== "string") {
      return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
    }

    const { data, error } = await supabase.from("profiles")
      .update({ full_name: fullName })
      .eq("id", studentId)
      .select("full_name")
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Your profile could not be updated." }, { status: 403 });
    if (!data) return NextResponse.json({ error: "Your student profile could not be found." }, { status: 404 });

    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");
    revalidatePath("/account");
    return NextResponse.json({ fullName: data.full_name });
  } catch {
    return NextResponse.json({ error: "The profile service is unavailable. Please try again." }, { status: 503 });
  }
}
