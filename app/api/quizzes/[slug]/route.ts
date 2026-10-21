import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return NextResponse.json({ error: "Sign in to view this quiz." }, { status: 401 });

  const { data: quiz, error } = await supabase.from("quizzes")
    .select("id, slug, title, summary, instructions, duration_minutes")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error) return NextResponse.json({ error: "Quiz could not be loaded." }, { status: 500 });
  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  const { data: questions, error: questionError } = await supabase.from("questions")
    .select("id, position, prompt, options").eq("quiz_id", quiz.id).order("position");
  if (questionError) return NextResponse.json({ error: "Quiz questions could not be loaded." }, { status: 500 });
  return NextResponse.json({ quiz, questions });
}
