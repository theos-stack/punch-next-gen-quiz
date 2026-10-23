import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";

export async function requireStudent(nextPath: string) {
  if (!hasSupabaseEnvironment()) redirect("/login?setup=missing");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || typeof claims?.sub !== "string") {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", claims.sub).maybeSingle();
  const userClaims = claims as typeof claims & { email?: string; user_metadata?: { full_name?: string } };
  const metadataName = typeof userClaims.user_metadata?.full_name === "string"
    ? userClaims.user_metadata.full_name.trim()
    : "";

  return {
    supabase,
    studentId: claims.sub,
    displayName: profile?.full_name || metadataName || "Student",
    email: typeof userClaims.email === "string" ? userClaims.email : "",
  };
}
