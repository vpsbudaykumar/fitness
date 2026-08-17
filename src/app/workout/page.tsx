"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type WorkoutDay = {
  id: string;
  day_number: number;
  focus: string;
  estimated_duration_minutes: number;
  exerciseCount: number;
};

export default function WorkoutPage() {
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: plan } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!plan) {
      setDays([]);
      setLoading(false);
      return;
    }

    const { data: workoutDays } = await supabase
      .from("workout_days")
      .select(
        "id, day_number, focus, estimated_duration_minutes"
      )
      .eq("plan_id", plan.id)
      .order("day_number");

    if (!workoutDays) {
      setDays([]);
      setLoading(false);
      return;
    }

    const daysWithCounts = await Promise.all(
      workoutDays.map(async (day) => {
        const { count } = await supabase
          .from("workout_exercises")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("workout_day_id", day.id);

        return {
          ...day,
          exerciseCount: count ?? 0,
        };
      })
    );

    setDays(daysWithCounts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = days[0];
  const upcoming = days.slice(1);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">Training plan</p>

        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="page-title">
              Your workouts
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
              Your personalized training plan, built around your
              goals, experience, equipment, and schedule.
            </p>
          </div>

          {days.length > 0 && (
            <div className="metric rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
              {days.length} sessions
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="card h-64 animate-pulse" />
            <div className="card h-64 animate-pulse" />
          </div>
        ) : days.length === 0 ? (
          <section className="card mt-8">
            <p className="eyebrow">Get started</p>

            <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold">
              No workout plan yet
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
              Complete your setup and generate a personalized
              workout plan based on your goals and preferences.
            </p>

            <Link
              href="/home"
              className="btn-primary mt-6"
            >
              Go to Home
            </Link>
          </section>
        ) : (
          <>
            {today && (
              <section className="relative mt-8 overflow-hidden rounded-3xl border border-[#3D5AFE]/30 bg-[#3D5AFE]/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,.18)] sm:p-8">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#3D5AFE]/10 blur-3xl" />

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tag-safe">
                      Today
                    </span>

                    <span className="eyebrow">
                      Day {today.day_number}
                    </span>
                  </div>

                  <h2 className="mt-4 font-[Space_Grotesk] text-3xl font-bold tracking-tight sm:text-4xl">
                    {today.focus}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="metric rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm text-white/70">
                      {today.estimated_duration_minutes} min
                    </span>

                    <span className="metric rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm text-white/70">
                      {today.exerciseCount} exercises
                    </span>
                  </div>

                  <Link
                    href={`/workout/${today.id}/overview`}
                    className="btn-primary mt-7 w-full sm:w-auto"
                  >
                    Start workout →
                  </Link>
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section className="mt-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow">Training schedule</p>

                    <h2 className="mt-1 font-[Space_Grotesk] text-2xl font-bold">
                      Upcoming sessions
                    </h2>
                  </div>

                  <span className="text-xs text-white/40">
                    {upcoming.length} remaining
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {upcoming.map((day) => (
                    <Link
                      key={day.id}
                      href={`/workout/${day.id}/overview`}
                      className="group card block transition duration-200 hover:-translate-y-1 hover:border-[#3D5AFE]/40 hover:bg-[#2A3040]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="eyebrow">
                          Day {day.day_number}
                        </span>

                        <span className="text-xs text-white/30 transition group-hover:text-white/60">
                          →
                        </span>
                      </div>

                      <h3 className="mt-4 font-[Space_Grotesk] text-xl font-bold">
                        {day.focus}
                      </h3>

                      <div className="mt-4 flex items-center gap-3 text-sm text-white/50">
                        <span className="metric">
                          {day.estimated_duration_minutes} min
                        </span>

                        <span className="text-white/20">
                          •
                        </span>

                        <span className="metric">
                          {day.exerciseCount} exercises
                        </span>
                      </div>

                      <div className="mt-6 text-sm font-semibold text-[#3D5AFE] transition group-hover:text-white">
                        View workout →
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}