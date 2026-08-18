"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Dumbbell,
  CalendarDays,
  Users,
  Clock3,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type Plan = {
  id: string;
  user_id: string;
  created_at: string;
};

type WorkoutDay = {
  id: string;
  plan_id: string;
  day_number: number;
  focus: string;
  estimated_duration_minutes: number;
};

type WorkoutExercise = {
  id: string;
  workout_day_id: string;
  exercise_name_snapshot: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  order_index: number;
};

type Exercise = {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string[];
  difficulty: string;
  movement_pattern: string;
  is_compound: boolean;
  estimated_minutes: number;
};

export default function AdminWorkoutsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<
    WorkoutExercise[]
  >([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const [
          plansResult,
          daysResult,
          workoutExercisesResult,
          exercisesResult,
        ] = await Promise.all([
          supabase
            .from("workout_plans")
            .select("id,user_id,created_at")
            .order("created_at", { ascending: false }),

          supabase
            .from("workout_days")
            .select(
              "id,plan_id,day_number,focus,estimated_duration_minutes"
            )
            .order("day_number"),

          supabase
            .from("workout_exercises")
            .select(
              "id,workout_day_id,exercise_name_snapshot,sets,rep_min,rep_max,order_index"
            )
            .order("order_index"),

          supabase
            .from("exercises")
            .select(
              "id,name,primary_muscle,equipment,difficulty,movement_pattern,is_compound,estimated_minutes"
            )
            .order("name"),
        ]);

        if (plansResult.error) {
          throw plansResult.error;
        }

        if (daysResult.error) {
          throw daysResult.error;
        }

        if (workoutExercisesResult.error) {
          throw workoutExercisesResult.error;
        }

        if (exercisesResult.error) {
          throw exercisesResult.error;
        }

        setPlans(plansResult.data ?? []);
        setDays(daysResult.data ?? []);
        setWorkoutExercises(workoutExercisesResult.data ?? []);
        setExercises(exercisesResult.data ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load workout management data."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const totalDuration = days.reduce(
    (sum, day) => sum + Number(day.estimated_duration_minutes || 0),
    0
  );

  if (loading) {
    return (
      <AppShell>
        <main className="pb-12">
          <p className="eyebrow">Admin</p>

          <h1 className="page-title mt-2">
            Workout Management
          </h1>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-[#E8EEEC]"
              />
            ))}
          </div>

          <div className="mt-7 h-64 animate-pulse rounded-2xl bg-[#E8EEEC]" />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="pb-12">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#66727F] hover:text-[#08A6A6]"
        >
          <ArrowLeft size={17} />
          Back
        </Link>

        <section className="mt-7">
          <p className="eyebrow">Admin console</p>

          <h1 className="page-title mt-2">
            Workout Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66727F]">
            Review workout plans, training days, assigned exercises,
            and the exercise catalog used by the coach.
          </p>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-[#FF735C]/30 bg-[#FF735C]/10 p-4 text-sm text-[#B84B39]">
            {error}
          </div>
        )}

        {/* Summary */}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#08A6A6]/10">
              <Dumbbell size={19} className="text-[#08A6A6]" />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
              Workout plans
            </p>

            <p className="metric mt-1 text-2xl">
              {plans.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7657F6]/10">
              <CalendarDays
                size={19}
                className="text-[#7657F6]"
              />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
              Workout days
            </p>

            <p className="metric mt-1 text-2xl">
              {days.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF735C]/10">
              <Dumbbell
                size={19}
                className="text-[#FF735C]"
              />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
              Assigned exercises
            </p>

            <p className="metric mt-1 text-2xl">
              {workoutExercises.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#08A6A6]/10">
              <Clock3
                size={19}
                className="text-[#08A6A6]"
              />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
              Planned minutes
            </p>

            <p className="metric mt-1 text-2xl">
              {totalDuration}
            </p>
          </div>
        </section>

        {/* Plans */}

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Plans</p>

              <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
                Workout Plans
              </h2>
            </div>

            <span className="text-xs text-[#7A8792]">
              {plans.length} plans
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#DDE8E5] bg-white shadow-sm">
            {plans.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#66727F]">
                No workout plans found.
              </div>
            ) : (
              <div className="divide-y divide-[#E7ECEA]">
                {plans.map((plan, index) => {
                  const planDays = days.filter(
                    (day) => day.plan_id === plan.id
                  );

                  return (
                    <div
                      key={plan.id}
                      className="p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="eyebrow">
                            Plan {index + 1}
                          </p>

                          <p className="mt-1 font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
                            {plan.id}
                          </p>

                          <p className="mt-1 text-xs text-[#7A8792]">
                            User: {plan.user_id}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <span className="tag-safe">
                            {planDays.length} days
                          </span>

                          <span className="tag-ai">
                            {new Date(
                              plan.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Workout Days */}

        <section className="mt-8">
          <p className="eyebrow">Schedule</p>

          <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
            Workout Days
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {days.map((day) => {
              const count = workoutExercises.filter(
                (exercise) =>
                  exercise.workout_day_id === day.id
              ).length;

              return (
                <div
                  key={day.id}
                  className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="tag-safe">
                      Day {day.day_number}
                    </span>

                    <span className="metric text-xs text-[#66727F]">
                      {day.estimated_duration_minutes} min
                    </span>
                  </div>

                  <h3 className="mt-5 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                    {day.focus}
                  </h3>

                  <p className="mt-2 text-sm text-[#66727F]">
                    {count} exercises
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Exercise Catalog */}

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Catalog</p>

              <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
                Exercise Library
              </h2>
            </div>

            <span className="text-xs text-[#7A8792]">
              {exercises.length} exercises
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-[Space_Grotesk] font-bold text-[#17212B]">
                    {exercise.name}
                  </h3>

                  <span className="tag-ai">
                    {exercise.difficulty}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-[#F1F6F5] px-2 py-1 text-[#66727F]">
                    {exercise.primary_muscle}
                  </span>

                  <span className="rounded-lg bg-[#F5F2FF] px-2 py-1 text-[#7657F6]">
                    {exercise.movement_pattern}
                  </span>
                </div>

                <p className="mt-3 text-xs text-[#7A8792]">
                  {exercise.equipment.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
