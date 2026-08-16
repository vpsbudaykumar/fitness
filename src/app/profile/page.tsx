import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const [{ data: profile }, { data: preferences }] = await Promise.all([supabase.from("profiles").select("name, age, height_cm, weight_kg, sex, experience_level, units").eq("id", user.id).maybeSingle(), supabase.from("training_preferences").select("goal, equipment, workout_location, days_per_week, session_duration_minutes").eq("user_id", user.id).maybeSingle()]);
  return <main className="max-w-sm mx-auto px-6 pt-16 pb-10"><Link href="/home" className="text-sm text-accent">← Home</Link><h1 className="mt-5 text-2xl font-bold">Your profile</h1><dl className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"><div><dt className="text-white/40">Name</dt><dd>{profile?.name ?? "—"}</dd></div><div><dt className="text-white/40">Experience</dt><dd>{profile?.experience_level ?? "—"}</dd></div><div><dt className="text-white/40">Measurements</dt><dd>{profile?.height_cm ?? "—"} cm · {profile?.weight_kg ?? "—"} kg</dd></div><div><dt className="text-white/40">Goal</dt><dd>{preferences?.goal?.replaceAll("_", " ") ?? "—"}</dd></div><div><dt className="text-white/40">Schedule</dt><dd>{preferences ? `${preferences.days_per_week} days · ${preferences.session_duration_minutes} min` : "—"}</dd></div><div><dt className="text-white/40">Equipment</dt><dd>{preferences?.equipment?.join(", ") ?? "—"}</dd></div></dl></main>;
}
