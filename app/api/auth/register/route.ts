import { NextResponse } from "next/server";
import { validateEmail, validateFullName, validatePassword } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Send a valid registration request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";

  if (!validateFullName(fullName)) {
    return NextResponse.json({ error: "Enter a name between 2 and 60 characters." }, { status: 400 });
  }
  if (!validateEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!validatePassword(input.password)) {
    return NextResponse.json({ error: "Choose a password between 8 and 128 characters." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: new URL("/auth/callback?next=/dashboard", request.url).toString(),
      },
    });

    if (error) {
      return NextResponse.json({ error: "We couldn't create your account. Check your details and try again." }, { status: 400 });
    }

    return NextResponse.json({ requiresEmailConfirmation: !data.session });
  } catch {
    return NextResponse.json({ error: "The sign-up service is not configured yet. Please try again later." }, { status: 503 });
  }
}
