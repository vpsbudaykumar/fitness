"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Target,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  exercise_name_snapshot: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  exercise?: {
    primary_muscle: string;
  }[];
};

export default function Overview() {
  const { dayId } = useParams<{ dayId: string }>();

  const [items, setItems] = useState<Item[]>([]);
  const [duration, setDuration] = useState(0);
  const [focus, setFocus] = useState("Workout");
  const [resume, setResume] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkout() {
      if (!dayId) return;

      setLoading(true);

      const supabase = createClient();

      const { data: workoutDay } = await supabase
        .from("workout_days")
        .select("focus, estimated_duration_minutes")
        .eq("id", dayId)
        .maybeSingle();

      setFocus(workoutDay?.focus ?? "Workout");
      setDuration(workoutDay?.estimated_duration_minutes ?? 0);

      const { data: exerciseRows } = await supabase
        .from("workout_exercises")
        .select(
          "id, exercise_name_snapshot, sets, rep_min, rep_max, exercise:exercises(primary_muscle)"
        )
        .eq("workout_day_id", dayId)
        .order("order_index");

      setItems((exerciseRows ?? []) as unknown as Item[]);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: session } = await supabase
          .from("workout_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("workout_day_id", dayId)
          .eq("status", "in_progress")
          .maybeSingle();

        setResume(Boolean(session));
      }

      setLoading(false);
    }

    void loadWorkout();
  }, [dayId]);

  const muscles = [
    ...new Set(
      items
        .map((item) => item.exercise?.[0]?.primary_muscle)
        .filter(Boolean)
    ),
  ];

  if (loading) {
    return (
      <AppShell>
        <main className="pb-12">
          <div className="animate-pulse">
            <div className="h-4 w-28 rounded bg-[#DDE9E6]" />
            <div className="mt-4 h-10 w-64 rounded-lg bg-[#DDE9E6]" />

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="h-24 rounded-2xl bg-[#E8EEEC]" />
              <div className="h-24 rounded-2xl bg-[#E8EEEC]" />
              <div className="h-24 rounded-2xl bg-[#E8EEEC]" />
            </div>

            <div className="mt-7 h-20 rounded-2xl bg-[#E8EEEC]" />
            <div className="mt-3 h-20 rounded-2xl bg-[#E8EEEC]" />
            <div className="mt-3 h-20 rounded-2xl bg-[#E8EEEC]" />
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="pb-12">
        {/* Back */}

        <Link
          href="/workout"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#66727F] transition hover:text-[#08A6A6]"
        >
          <ArrowLeft size={17} />
          Back to workouts
        </Link>

        {/* Header */}

        <section className="mt-7">
          <p className="eyebrow">Workout overview</p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="page-title">{focus}</h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#66727F]">
                Your session is ready. Review the workout before you begin.
              </p>
            </div>

            {resume && (
              <span className="tag-safe w-fit">
                Workout in progress
              </span>
            )}
          </div>
        </section>

        {/* Workout stats */}

        <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#08A6A6]/10">
              <Clock3
                size={19}
                className="text-[#08A6A6]"
              />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
              Duration
            </p>

            <p className="mt-1 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
              {duration}
              <span className="ml-1 text-sm font-medium text-[#66727F]">
                min
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7657F6]/10">
              <Dumbbell
                size={19}
                className="text-[#7657F6]"
              />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
              Exercises
            </p>

            <p className="mt-1 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
              {items.length}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm sm:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF735C]/10">
              <Target
                size={19}
                className="text-[#FF735C]"
              />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
              Target
            </p>

            <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#17212B]">
              {muscles.length > 0
                ? muscles.join(", ")
                : "Full workout"}
            </p>
          </div>
        </section>

        {/* Target muscles */}

        {muscles.length > 0 && (
          <section className="mt-5 rounded-2xl border border-[#DCD5FF] bg-[#F8F6FF] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7657F6]/10">
                <Target
                  size={19}
                  className="text-[#7657F6]"
                />
              </div>

              <div>
                <p className="eyebrow text-[#7657F6]">
                  Focus areas
                </p>

                <p className="mt-1 text-sm font-semibold text-[#17212B]">
                  {muscles.join(" · ")}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Exercise list */}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Your session</p>

              <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
                Exercise list
              </h2>
            </div>

            <span className="text-xs font-semibold text-[#8A96A0]">
              {items.length} exercises
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-[#E1E8E5] bg-white p-4 shadow-sm transition hover:border-[#08A6A6]/30 hover:shadow-md sm:p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F6F5] font-[Space_Grotesk] text-sm font-bold text-[#08A6A6]">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-[Space_Grotesk] text-base font-bold text-[#17212B] sm:text-lg">
                      {item.exercise_name_snapshot}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#66727F]">
                      <span>
                        {item.sets}{" "}
                        {item.sets === 1 ? "set" : "sets"}
                      </span>

                      <span className="text-[#C5CDCA]">
                        •
                      </span>

                      <span>
                        {item.rep_min === item.rep_max
                          ? `${item.rep_min} reps`
                          : `${item.rep_min}–${item.rep_max} reps`}
                      </span>

                      {item.exercise?.[0]?.primary_muscle && (
                        <>
                          <span className="text-[#C5CDCA]">
                            •
                          </span>

                          <span>
                            {item.exercise[0].primary_muscle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <CheckCircle2
                    size={19}
                    className="hidden text-[#D5DEDB] sm:block"
                  />
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D5DEDB] bg-[#F9FBFA] p-8 text-center">
                <Dumbbell
                  size={24}
                  className="mx-auto text-[#9AA5AE]"
                />

                <p className="mt-3 text-sm font-semibold text-[#17212B]">
                  No exercises found
                </p>

                <p className="mt-1 text-xs text-[#66727F]">
                  This workout does not have exercises yet.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Start / Resume */}

        <section className="sticky bottom-4 z-10 mt-8">
          <div className="rounded-2xl border border-[#DDE8E5] bg-white/95 p-3 shadow-[0_12px_35px_rgba(24,33,43,0.12)] backdrop-blur">
            <Link
              href={`/workout/${dayId}`}
              className="btn-primary flex w-full items-center justify-center"
            >
              {resume ? "Resume Workout" : "Start Workout"}

              <ArrowRight
                size={18}
                className="ml-2"
              />
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}