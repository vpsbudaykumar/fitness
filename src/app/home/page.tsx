"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";

type Workout = {
  id: string;
  focus: string;
  estimated_duration_minutes: number;
  exerciseCount: number;
};

type BodyLayer = {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
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
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      setName(profile?.name ?? null);

      const { data: plan } = await supabase
        .from("workout_plans")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      setHasPlan(Boolean(plan));

      if (!plan) {
        setWorkout(null);
        setLoading(false);
        return;
      }

      const { data: day } = await supabase
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

      const { count } = await supabase
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

  /*
   * BODY STATE
   *
   * These are visual/demo values for the current phase.
   * They are NOT connected to smartwatch data, AI,
   * hydration notifications, or external health APIs yet.
   */
  const bodyLayers: BodyLayer[] = [
    {
      label: "Move",
      value: 78,
      icon: <Flame size={18} strokeWidth={1.8} />,
      tone: "text-[#FF735C] bg-[#FF735C]/10",
    },
    {
      label: "Train",
      value: 64,
      icon: <Dumbbell size={18} strokeWidth={1.8} />,
      tone: "text-[#7657F6] bg-[#7657F6]/10",
    },
    {
      label: "Steps",
      value: 79,
      icon: <Footprints size={18} strokeWidth={1.8} />,
      tone: "text-[#08A6A6] bg-[#08A6A6]/10",
    },
    {
      label: "Hydrate",
      value: 81,
      icon: <Droplets size={18} strokeWidth={1.8} />,
      tone: "text-[#3B82F6] bg-[#3B82F6]/10",
    },
  ];

  return (
    <AppShell>
      <main className="pb-12">
        {/* =================================================
            GREETING
        ================================================= */}

        <section className="home-greeting">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">
                Your training space
              </p>

              <h1>
                Good morning
                <span>
                  {name ?? "there"}{" "}
                  <span
                    aria-hidden="true"
                    className="inline-block"
                  >
                    👋
                  </span>
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[#66727F]">
                Your training, movement, and daily habits
                in one place.
              </p>
            </div>

            <Link
              href="/profile"
              aria-label="View profile"
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#E7ECEA] bg-white text-xl shadow-sm transition hover:border-[#08A6A6]/30 hover:shadow-md sm:flex"
            >
              👤
            </Link>
          </div>
        </section>

        {/* =================================================
            BODY STATE
        ================================================= */}

        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#DDE8E5] bg-white shadow-[0_14px_40px_rgba(24,33,43,0.06)]">
          <div className="relative overflow-hidden p-5 sm:p-7">
            {/* DNA-inspired background structure */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[18px] border-[#08A6A6]/5"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 top-10 h-44 w-44 rounded-full border-[12px] border-[#7657F6]/5"
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    Your body state
                  </p>

                  <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold tracking-tight text-[#17212B] sm:text-3xl">
                    Building
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-[#66727F]">
                    You&apos;re building consistency today.
                    Training is on track and your daily
                    habits are looking strong.
                  </p>
                </div>

                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-[6px] border-[#08A6A6]/15 bg-[#EAF7F5]">
                  <span className="font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
                    74
                  </span>

                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#08A6A6]">
                    State
                  </span>
                </div>
              </div>

              {/* Four-layer DNA structure */}

              <div className="mt-7 grid grid-cols-2 gap-3">
                {bodyLayers.map((layer) => (
                  <div
                    key={layer.label}
                    className="rounded-2xl border border-[#E7ECEA] bg-[#F9FBFA] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${layer.tone}`}
                      >
                        {layer.icon}
                      </div>

                      <span className="font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
                        {layer.value}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
                        {layer.label}
                      </span>

                      <span className="text-[10px] text-[#9AA5AE]">
                        / 100
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E4EBE9]">
                      <div
                        className="h-full rounded-full bg-current opacity-70"
                        style={{
                          width: `${layer.value}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            BODY WEATHER + NEXT BEST ACTION
        ================================================= */}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[24px] border border-[#DDE8E5] bg-[#F9FBFA] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#08A6A6]/10 text-lg">
                ☀️
              </div>

              <div>
                <p className="eyebrow">
                  Body weather
                </p>

                <h2 className="mt-1 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                  Building
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#66727F]">
              Your training and movement are moving in
              the right direction. Keep the day consistent
              rather than chasing intensity.
            </p>
          </section>

          <section className="rounded-[24px] border border-[#DCD5FF] bg-[#F8F6FF] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-[#7657F6]">
                  Next best action
                </p>

                <h2 className="mt-2 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                  Start today&apos;s workout
                </h2>
              </div>

              <Sparkles
                size={22}
                className="shrink-0 text-[#7657F6]"
              />
            </div>

            <p className="mt-3 text-sm leading-6 text-[#66727F]">
              Your personalized session is ready.
              Consistency is today&apos;s biggest win.
            </p>

            {workout && (
              <Link
                href={`/workout/${workout.id}/overview`}
                className="mt-4 inline-flex items-center text-sm font-bold text-[#7657F6]"
              >
                Start workout
                <ArrowRight
                  size={16}
                  className="ml-1"
                />
              </Link>
            )}
          </section>
        </div>

        {/* =================================================
            today&apos;s WORKOUT
        ================================================= */}

        <section className="mt-5">
          {loading ? (
            <div className="today-card animate-pulse">
              <p className="eyebrow">
                today&apos;s session
              </p>

              <div className="mt-4 h-9 w-48 rounded-lg bg-[#DDE9E6]" />

              <div className="mt-4 h-4 w-52 rounded bg-[#E6EEEC]" />

              <div className="mt-7 h-12 w-full rounded-xl bg-[#DDE9E6]" />
            </div>
          ) : workout ? (
            <section className="today-card relative overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#08A6A6]/10"
              />

              <div
                aria-hidden="true"
                className="absolute -bottom-20 right-16 h-36 w-36 rounded-full bg-[#7657F6]/10"
              />

              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow">
                    today&apos;s session
                  </p>

                  <span className="tag-safe">
                    Ready
                  </span>
                </div>

                <h2 className="session-title mt-4 text-3xl sm:text-4xl">
                  {workout.focus}
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-[#66727F]">
                  Your personalized session is ready.
                  Focus on quality movement and consistent
                  effort.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-sm">
                  <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
                    <Timer
                      size={19}
                      strokeWidth={1.8}
                      className="text-[#08A6A6]"
                    />

                    <div className="metric mt-3 text-xl font-bold">
                      {workout.estimated_duration_minutes}
                    </div>

                    <div className="mt-1 text-xs text-[#66727F]">
                      Minutes
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
                    <Dumbbell
                      size={19}
                      strokeWidth={1.8}
                      className="text-[#7657F6]"
                    />

                    <div className="metric mt-3 text-xl font-bold">
                      {workout.exerciseCount}
                    </div>

                    <div className="mt-1 text-xs text-[#66727F]">
                      Exercises
                    </div>
                  </div>
                </div>

                <Link
                  href={`/workout/${workout.id}/overview`}
                  className="btn-primary mt-6 w-full sm:w-auto"
                >
                  Start workout
                  <ArrowRight
                    size={18}
                    className="ml-2"
                  />
                </Link>
              </div>
            </section>
          ) : (
            <section className="card">
              <p className="eyebrow">
                Training plan
              </p>

              <h2 className="mt-3 font-[Space_Grotesk] text-2xl font-bold">
                {hasPlan
                  ? "Workout plan ready"
                  : "Create your training plan"}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#66727F]">
                {hasPlan
                  ? "Your plan does not have an available workout day yet."
                  : "Create a personalized plan based on your profile, goals, equipment, schedule, and safety setup."}
              </p>

              {!hasPlan && (
                <>
                  <button
                    onClick={generate}
                    disabled={generating}
                    className="btn-primary mt-6 w-full sm:w-auto"
                  >
                    {generating
                      ? "Generating workout..."
                      : "Generate my workout"}

                    {!generating && (
                      <ArrowRight
                        size={18}
                        className="ml-2"
                      />
                    )}
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
        </section>

        {/* =================================================
            FORM JOURNEY
        ================================================= */}

        <section className="mt-5 rounded-[24px] border border-[#E2E7E5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">
                FORM Journey
              </p>

              <h2 className="mt-2 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                Build your consistency
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#66727F]">
                Your 90-day journey will track qualifying
                training days from your plan.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF735C]/10 text-[#FF735C]">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <span className="font-[Space_Grotesk] text-3xl font-bold text-[#17212B]">
                0
              </span>

              <span className="ml-1 text-sm text-[#8A96A0]">
                / 90 days
              </span>
            </div>

            <span className="text-xs font-semibold text-[#8A96A0]">
              Journey preview
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EEEC]">
            <div
              className="h-full w-0 rounded-full bg-[#FF735C]"
              aria-hidden="true"
            />
          </div>

          <p className="mt-3 text-xs text-[#8A96A0]">
            Your qualifying-day tracking will become
            active when the FORM Journey system is enabled.
          </p>
        </section>

        {/* =================================================
            COACH AGENT
        ================================================= */}

        <Link
          href="/coach"
          className="coach-card group mt-5 flex-col items-start justify-between"
        >
          <div className="flex w-full items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7657F6]/10">
              <Sparkles
                size={21}
                strokeWidth={1.8}
                className="text-[#7657F6]"
              />
            </div>

            <ArrowRight
              size={20}
              className="coach-arrow transition group-hover:translate-x-1"
            />
          </div>

          <div className="mt-8">
            <div className="coach-label">
              Coach Agent
            </div>

            <div className="mt-2 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
              Need help with today&apos;s workout?
            </div>

            <p className="mt-3 text-sm leading-6 text-[#66727F]">
              Get exercise alternatives, training
              adjustments, or help understanding your plan.
            </p>
          </div>

          <div className="mt-7 text-sm font-semibold text-[#7657F6]">
            Open Coach Agent →
          </div>
        </Link>

        {/* =================================================
            QUICK STATS
        ================================================= */}

        {workout && (
          <section className="mt-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                  <Timer
                    size={18}
                    className="text-[#08A6A6]"
                  />
                </div>

                <div className="stat-value mt-4">
                  {workout.estimated_duration_minutes}
                </div>

                <div className="stat-label">
                  Session minutes
                </div>
              </div>

              <div className="stat-card">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF735C]/10">
                  <Dumbbell
                    size={18}
                    className="text-[#FF735C]"
                  />
                </div>

                <div className="stat-value mt-4">
                  {workout.exerciseCount}
                </div>

                <div className="stat-label">
                  Exercises today
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}