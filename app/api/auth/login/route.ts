import { NextResponse } from "next/server";
import { validateEmail, validatePassword } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Send a valid login request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!validateEmail(email) || !validatePassword(input.password)) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: input.password });
    if (error) {
      return NextResponse.json({ error: "We couldn't log you in with those details." }, { status: 401 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "The sign-in service is not configured yet. Please try again later." }, { status: 503 });
  }
}
