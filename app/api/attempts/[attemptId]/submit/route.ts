import { NextResponse } from "next/server";
import { validateSubmissionAnswers } from "@/lib/quiz/submission.mjs";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId)) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return NextResponse.json({ error: "Sign in to submit this quiz." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const result = validateSubmissionAnswers((body as { answers?: unknown } | null)?.answers);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });

  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    p_attempt_id: attemptId,
    p_answers: result.answers,
  });
  if (error) {
    const status = error.code === "P0002" ? 404 : error.code === "22023" ? 400 : error.code === "55000" ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? "Your answers could not be submitted." : error.message }, { status });
  }
  return NextResponse.json({ result: data });
}
