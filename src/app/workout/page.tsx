"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  Timer,
} from "lucide-react";
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

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setDays([]);
        setLoading(false);
        return;
      }

      const { data: plan } = await supabase
        .from("workout_plans")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
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
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = days[0];
  const upcoming = days.slice(1);

  return (
    <AppShell>
      <main className="pb-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="home-greeting">
          <p className="eyebrow">
            Training plan
          </p>

          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h1 className="page-title">
                Your workouts
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[#66727F]">
                Your personalized training plan,
                built around your goals, experience,
                equipment, and schedule.
              </p>
            </div>

            {!loading && days.length > 0 && (
              <div className="hidden shrink-0 rounded-2xl border border-[#E7ECEA] bg-white px-5 py-4 text-center shadow-sm sm:block">
                <div className="metric text-2xl font-bold text-[#17212B]">
                  {days.length}
                </div>

                <div className="mt-1 text-xs text-[#66727F]">
                  sessions
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
            <section className="today-card animate-pulse">
              <div className="h-4 w-28 rounded bg-[#DDE9E6]" />
              <div className="mt-5 h-9 w-48 rounded-lg bg-[#DDE9E6]" />
              <div className="mt-4 h-4 w-56 rounded bg-[#E6EEEC]" />
              <div className="mt-7 h-12 w-full rounded-xl bg-[#DDE9E6]" />
            </section>

            <section className="card hidden lg:block">
              <div className="h-4 w-24 rounded bg-[#E6EEEC]" />
              <div className="mt-5 h-8 w-32 rounded bg-[#E6EEEC]" />
              <div className="mt-4 h-4 w-40 rounded bg-[#E6EEEC]" />
            </section>
          </div>
        ) : days.length === 0 ? (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <section className="card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08A6A6]/10">
              <Dumbbell
                size={23}
                className="text-[#08A6A6]"
              />
            </div>

            <h2 className="mt-5 font-[Space_Grotesk] text-2xl font-bold">
              No workout plan yet
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#66727F]">
              Complete your setup and generate
              your personalized workout plan.
            </p>

            <Link
              href="/home"
              className="btn-primary mt-6 w-full sm:w-auto"
            >
              Go to Home
              <ArrowRight
                size={18}
                className="ml-2"
              />
            </Link>
          </section>
        ) : (
          <>
            {/* =================================================
                MOBILE PLAN COUNT
            ================================================= */}

            <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#E7ECEA] bg-white px-4 py-3 shadow-sm sm:hidden">
              <div className="flex items-center gap-3">
                <CalendarDays
                  size={18}
                  className="text-[#08A6A6]"
                />

                <span className="text-sm font-semibold text-[#17212B]">
                  Training schedule
                </span>
              </div>

              <span className="tag-safe">
                {days.length} sessions
              </span>
            </div>

            {/* =================================================
                TODAY + PLAN SUMMARY
            ================================================= */}

            <div className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
              {today && (
                <section className="today-card relative overflow-hidden">
                  <div
                    aria-hidden="true"
                    className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#08A6A6]/10"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute -bottom-20 right-20 h-36 w-36 rounded-full bg-[#7657F6]/10"
                  />

                  <div className="relative">
                    <div className="flex items-center justify-between gap-4">
                      <p className="eyebrow">
                        Today
                      </p>

                      <span className="tag-safe">
                        Day {today.day_number}
                      </span>
                    </div>

                    <h2 className="mt-4 font-[Space_Grotesk] text-3xl font-bold tracking-tight text-[#17212B] sm:text-4xl">
                      {today.focus}
                    </h2>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-[#66727F]">
                      Your next training session is
                      ready. Start when you are ready
                      and complete each exercise at
                      your own pace.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-3 py-2">
                        <Timer
                          size={17}
                          className="text-[#08A6A6]"
                        />

                        <span className="metric text-xs font-semibold">
                          {today.estimated_duration_minutes}{" "}
                          min
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/workout/${today.id}/overview`}
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
              )}

              <section className="card">
                <p className="eyebrow">
                  Your plan
                </p>

                <div className="mt-4 flex items-end gap-2">
                  <span className="metric text-4xl font-bold">
                    {days.length}
                  </span>

                  <span className="mb-1 text-sm text-[#66727F]">
                    sessions
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#66727F]">
                  A structured training plan
                  designed around your current
                  setup.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-[#F1F6F5] px-3 py-3">
                    <span className="text-xs text-[#66727F]">
                      Sessions
                    </span>

                    <span className="metric text-xs font-semibold">
                      {days.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[#F5F2FF] px-3 py-3">
                    <span className="text-xs text-[#66727F]">
                      Today
                    </span>

                    <span className="text-xs font-semibold text-[#7657F6]">
                      Day {today?.day_number ?? "—"}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* =================================================
                UPCOMING
            ================================================= */}

            {upcoming.length > 0 && (
              <section className="mt-10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">
                      Training schedule
                    </p>

                    <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
                      Upcoming sessions
                    </h2>
                  </div>

                  <span className="hidden text-sm text-[#66727F] sm:block">
                    {upcoming.length} remaining
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((day) => (
                    <Link
                      key={day.id}
                      href={`/workout/${day.id}/overview`}
                      className="group rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#08A6A6]/30 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="tag-ai">
                          Day {day.day_number}
                        </span>

                        <ArrowRight
                          size={18}
                          className="text-[#9AA5AF] transition group-hover:translate-x-1 group-hover:text-[#08A6A6]"
                        />
                      </div>

                      <h3 className="mt-5 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                        {day.focus}
                      </h3>

                      <div className="mt-4 flex items-center gap-2 text-xs text-[#66727F]">
                        <Timer
                          size={15}
                          className="text-[#08A6A6]"
                        />

                        <span className="metric">
                          {day.estimated_duration_minutes}{" "}
                          min
                        </span>
                      </div>

                      <div className="mt-5 text-sm font-semibold text-[#08A6A6]">
                        View workout →
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}