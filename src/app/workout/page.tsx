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

    const { data } = await supabase
      .from("workout_days")
      .select(
        "id, day_number, focus, estimated_duration_minutes"
      )
      .eq("plan_id", plan.id)
      .order("day_number");

    setDays(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">Training</p>

        <h1 className="page-title mt-1">
          Your workouts
        </h1>

        <p className="mt-3 max-w-xl text-sm text-white/60">
          Follow your personalized training plan and start
          each session when you are ready.
        </p>

        {loading ? (
          <div className="card mt-7 animate-pulse text-white/40">
            Loading your workouts...
          </div>
        ) : days.length === 0 ? (
          <section className="card mt-7">
            <p className="font-[Space_Grotesk] text-xl font-bold">
              No workout plan yet
            </p>

            <p className="mt-2 text-sm text-white/60">
              Complete your setup and generate your personalized
              workout plan.
            </p>

            <Link
              href="/home"
              className="btn-primary mt-5"
            >
              Go to Home
            </Link>
          </section>
        ) : (
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {days.map((day) => (
              <Link
                key={day.id}
                href={`/workout/${day.id}/overview`}
                className="card block transition hover:-translate-y-0.5 hover:border-[#3D5AFE]/50"
              >
                <p className="eyebrow">
                  Day {day.day_number}
                </p>

                <h2 className="mt-2 font-[Space_Grotesk] text-xl font-bold">
                  {day.focus}
                </h2>

                <p className="metric mt-3 text-sm text-white/50">
                  {day.estimated_duration_minutes} min
                </p>

                <div className="mt-5 text-sm font-semibold text-[#3D5AFE]">
                  View workout →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}