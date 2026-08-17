"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type Workout = {
  id: string;
  focus: string;
  estimated_duration_minutes: number;
  exerciseCount: number;
};

export default function HomePage() {
  const [name, setName] = useState<string | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const s = createClient();

      const {
        data: { user },
      } = await s.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      /* ---------------------------------------------
         PROFILE
      --------------------------------------------- */

      const { data: profile } = await s
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      setName(profile?.name ?? null);

      /* ---------------------------------------------
         LATEST WORKOUT PLAN
      --------------------------------------------- */

      const { data: plan } = await s
        .from("workout_plans")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setHasPlan(Boolean(plan));

      if (!plan) {
        setWorkout(null);
        setLoading(false);
        return;
      }

      /* ---------------------------------------------
         FIRST WORKOUT DAY
      --------------------------------------------- */

      const { data: day } = await s
        .from("workout_days")
        .select(
          "id, focus, estimated_duration_minutes"
        )
        .eq("plan_id", plan.id)
        .order("day_number")
        .limit(1)
        .maybeSingle();

      if (!day) {
        setWorkout(null);
        setLoading(false);
        return;
      }

      /* ---------------------------------------------
         EXERCISE COUNT
      --------------------------------------------- */

      const { count } = await s
        .from("workout_exercises")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("workout_day_id", day.id);

      setWorkout({
        ...day,
        exerciseCount: count ?? 0,
      });
    } catch {
      setWorkout(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---------------------------------------------
     GENERATE WORKOUT
  --------------------------------------------- */

  async function generate() {
    setGenerating(true);
    setError("");

    try {
      const response = await fetch(
        "/api/workout-plans/generate",
        {
          method: "POST",
        }
      );

      const body: unknown = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "string"
            ? body.error
            : "Could not generate your workout."
        );
      }

      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not generate your workout."
      );
    } finally {
      setGenerating(false);
    }
  }

  /* ---------------------------------------------
     UI
  --------------------------------------------- */

  return (
    <AppShell>
      <main className="pb-28">

        {/* =========================================
            GREETING
        ========================================= */}

        <section className="home-greeting">
          <p className="eyebrow">
            Your training space
          </p>

          <h1>
            Good morning
            <span>
              {name ?? "there"}
            </span>
          </h1>
        </section>

        {/* =========================================
            TODAY'S WORKOUT
        ========================================= */}

        {loading ? (
          <section className="today-card animate-pulse">
            <p className="eyebrow">
              Today&apos;s session
            </p>

            <div className="mt-4 h-8 w-40 rounded-lg bg-white/10" />

            <div className="mt-4 h-4 w-48 rounded bg-white/10" />

            <div className="mt-6 h-12 w-full rounded-xl bg-white/10" />
          </section>
        ) : workout ? (
          <section className="today-card">

            <p className="eyebrow">
              Today&apos;s session
            </p>

            <h2 className="session-title">
              {workout.focus}
            </h2>

            <div className="session-meta">
              <span>
                {workout.estimated_duration_minutes} min
              </span>

              <span>•</span>

              <span>
                {workout.exerciseCount} exercises
              </span>
            </div>

            <Link
              href={`/workout/${workout.id}/overview`}
              className="btn-primary mt-6 w-full"
            >
              View workout
            </Link>

          </section>
        ) : (
          <section className="card">

            <p className="eyebrow">
              Training plan
            </p>

            <h2 className="mt-2 font-[Space_Grotesk] text-xl font-bold">
              {hasPlan
                ? "Workout plan ready"
                : "No workout plan yet"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              {hasPlan
                ? "Your plan does not have an available workout day yet."
                : "Create a plan based on your profile, goals, equipment, and safety setup."}
            </p>

            {!hasPlan && (
              <>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="btn-primary mt-6 w-full"
                >
                  {generating
                    ? "Generating workout..."
                    : "Generate My Workout"}
                </button>

                {error && (
                  <p
                    role="alert"
                    className="tag-stop mt-4"
                  >
                    {error}
                  </p>
                )}
              </>
            )}

          </section>
        )}

        {/* =========================================
            QUICK STATS
        ========================================= */}

        {workout && (
          <section className="stats-grid">

            <div className="stat-card">
              <div className="stat-value">
                {workout.estimated_duration_minutes}
              </div>

              <div className="stat-label">
                Minutes
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-value">
                {workout.exerciseCount}
              </div>

              <div className="stat-label">
                Exercises
              </div>
            </div>

          </section>
        )}

        {/* =========================================
            COACH
        ========================================= */}

        <Link
          href="/coach"
          className="coach-card"
        >
          <div>

            <div className="coach-label">
              Coach
            </div>

            <div className="coach-title">
              Need to adjust today?
              Ask the coach
            </div>

          </div>

          <div className="coach-arrow">
            →
          </div>
        </Link>

        {/* =========================================
            FUTURE FEATURES
        ========================================= */}

        <section className="locked-card">

          <div>
            <div className="locked-title">
              Progress tracking
            </div>

            <div className="locked-subtitle">
              Your training history and progress will appear here.
            </div>
          </div>

          <span className="tag-ai">
            Coming soon
          </span>

        </section>

      </main>
    </AppShell>
  );
}