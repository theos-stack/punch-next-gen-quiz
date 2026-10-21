import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return NextResponse.json({ error: "Sign in to start a quiz." }, { status: 401 });

  const { data: quiz, error: quizError } = await supabase.from("quizzes")
    .select("id").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (quizError) return NextResponse.json({ error: "Quiz could not be loaded." }, { status: 500 });
  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  const { data: attemptId, error } = await supabase.rpc("start_quiz_attempt", { p_quiz_id: quiz.id });
  if (error || !attemptId) return NextResponse.json({ error: "A quiz attempt could not be started." }, { status: 500 });
  return NextResponse.json({ attemptId }, { status: 201 });
}
