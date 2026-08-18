"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Pause,
  Play,
  Plus,
  RefreshCw,
  SkipForward,
  TimerReset,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import { EXERCISE_CATALOG } from "@/lib/workouts/catalog";
import { filterExercises } from "@/lib/workouts/engine";
import type { WorkoutInput } from "@/lib/workouts/types";

type Item = {
  id: string;
  exercise_id: string;
  exercise_name_snapshot: string;
  instructions_snapshot: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  rest_seconds: number;
  order_index: number;
};

type Logged = {
  workout_exercise_id: string;
  set_number: number;
  status: string;
};

export default function ActiveWorkoutPage() {
  const { dayId } = useParams<{ dayId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<string>();
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);

  const [swaps, setSwaps] = useState<
    typeof EXERCISE_CATALOG
  >([]);

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");

  const [rest, setRest] = useState(0);
  const [paused, setPaused] = useState(false);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  /*
   * REST TIMER
   */

  useEffect(() => {
    if (!rest || paused) return;

    const timer = window.setInterval(() => {
      setRest((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rest, paused]);

  /*
   * LOAD / RESUME WORKOUT
   */

  useEffect(() => {
    async function loadWorkout() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: old } = await supabase
        .from("workout_sessions")
        .select("id, skipped_exercise_ids")
        .eq("user_id", user.id)
        .eq("workout_day_id", dayId)
        .eq("status", "in_progress")
        .maybeSingle();

      let id = old?.id;

      if (!id) {
        const { data: created } = await supabase
          .from("workout_sessions")
          .insert({
            user_id: user.id,
            workout_day_id: dayId,
          })
          .select("id")
          .single();

        id = created?.id;
      }

      if (!id) {
        setLoading(false);
        setError("Could not start this workout.");
        return;
      }

      setSession(id);

      const { data: rows } = await supabase
        .from("workout_exercises")
        .select(
          "id, exercise_id, exercise_name_snapshot, instructions_snapshot, sets, rep_min, rep_max, rest_seconds, order_index"
        )
        .eq("workout_day_id", dayId)
        .order("order_index");

      const workoutItems = rows ?? [];

      setItems(workoutItems);

      const { data: logged } = await supabase
        .from("exercise_sets")
        .select(
          "workout_exercise_id, set_number, status"
        )
        .eq("session_id", id);

      const skipped = new Set(
        old?.skipped_exercise_ids ?? []
      );

      let next = 0;
      let nextSet = 1;

      for (; next < workoutItems.length; next++) {
        const row = workoutItems[next];

        if (skipped.has(row.id)) continue;

        const completedSets = (logged ?? []).filter(
          (entry: Logged) =>
            entry.workout_exercise_id === row.id &&
            entry.status === "completed"
        ).length;

        if (completedSets < row.sets) {
          nextSet = completedSets + 1;
          break;
        }
      }

      if (next === workoutItems.length) {
        await supabase
          .from("workout_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", id);

        router.replace(`/workout/summary/${id}`);
        return;
      }

      setIndex(next);
      setSetNumber(nextSet);
      setLoading(false);
    }

    void loadWorkout();
  }, [dayId, router]);

  const item = items[index];

  /*
   * RESET SET INPUTS WHEN EXERCISE / SET CHANGES
   */

  useEffect(() => {
    if (!item) return;

    setWeight("");
    setReps(String(item.rep_max));
    setRpe("");
    setRest(0);
    setPaused(false);
    setError("");
  }, [item, setNumber]);

  /*
   * SWAP EXERCISE
   */

  async function showSwaps() {
    if (!item) return;

    const supabase = createClient();

    const [
      { data: profile },
      { data: preferences },
      { data: contraindications },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("experience_level")
        .single(),

      supabase
        .from("training_preferences")
        .select(
          "goal,equipment,workout_location,days_per_week,session_duration_minutes"
        )
        .single(),

      supabase
        .from("contraindications")
        .select("body_part,severity"),
    ]);

    const current = EXERCISE_CATALOG.find(
      (exercise) => exercise.id === item.exercise_id
    );

    if (!current || !profile || !preferences) return;

    const input: WorkoutInput = {
      goal: preferences.goal as WorkoutInput["goal"],
      experience:
        profile.experience_level as WorkoutInput["experience"],
      equipment: preferences.equipment,
      workout_location:
        preferences.workout_location as WorkoutInput["workout_location"],
      days_per_week: preferences.days_per_week,
      session_duration_minutes:
        preferences.session_duration_minutes,
      contraindications: contraindications ?? [],
    };

    const alternatives = filterExercises(
      EXERCISE_CATALOG,
      input
    )
      .filter(
        (exercise) =>
          exercise.id !== current.id &&
          exercise.movement_pattern ===
            current.movement_pattern
      )
      .slice(0, 3);

    setSwaps(alternatives);
  }

  async function swap(exerciseId: string) {
    const replacement = EXERCISE_CATALOG.find(
      (exercise) => exercise.id === exerciseId
    );

    if (!item || !replacement) return;

    const { error: updateError } =
      await createClient()
        .from("workout_exercises")
        .update({
          exercise_id: replacement.id,
          exercise_name_snapshot: replacement.name,
          instructions_snapshot:
            replacement.instructions,
        })
        .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setItems((rows) =>
      rows.map((row) =>
        row.id === item.id
          ? {
              ...row,
              exercise_id: replacement.id,
              exercise_name_snapshot:
                replacement.name,
              instructions_snapshot:
                replacement.instructions,
            }
          : row
      )
    );

    setSwaps([]);
  }

  /*
   * FINISH WORKOUT
   */

  async function finish() {
    if (!session) return;

    await createClient()
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", session);

    router.replace(`/workout/summary/${session}`);
  }

  /*
   * COMPLETE SET
   */

  async function complete() {
    if (!session || !item || busy) return;

    const actualReps = Number(reps);

    const actualWeight =
      weight === "" ? null : Number(weight);

    const actualRpe =
      rpe === "" ? null : Number(rpe);

    if (
      !Number.isInteger(actualReps) ||
      actualReps < 0 ||
      (actualWeight !== null &&
        (!Number.isFinite(actualWeight) ||
          actualWeight < 0)) ||
      (actualRpe !== null &&
        (!Number.isFinite(actualRpe) ||
          actualRpe < 0 ||
          actualRpe > 10))
    ) {
      setError(
        "Enter valid reps, weight, and RPE values."
      );
      return;
    }

    setBusy(true);
    setError("");

    const supabase = createClient();

    const { data: existing } = await supabase
      .from("exercise_sets")
      .select("id")
      .eq("session_id", session)
      .eq("workout_exercise_id", item.id)
      .eq("set_number", setNumber)
      .maybeSingle();

    const payload = {
      session_id: session,
      workout_exercise_id: item.id,
      set_number: setNumber,
      target_reps: item.rep_max,
      reps: actualReps,
      weight_kg: actualWeight,
      rpe: actualRpe,
      status: "completed",
    };

    const result = existing
      ? await supabase
          .from("exercise_sets")
          .update(payload)
          .eq("id", existing.id)
      : await supabase
          .from("exercise_sets")
          .insert(payload);

    if (result.error) {
      setError(result.error.message);
      setBusy(false);
      return;
    }

    if (setNumber < item.sets) {
      setSetNumber((value) => value + 1);
      setRest(item.rest_seconds);
    } else if (index + 1 < items.length) {
      setIndex((value) => value + 1);
      setSetNumber(1);
      setRest(item.rest_seconds);
    } else {
      await finish();
    }

    setBusy(false);
  }

  /*
   * SKIP EXERCISE
   */

  async function skipExercise() {
    if (!session || !item || busy) return;

    const confirmed = window.confirm(
      `Skip ${item.exercise_name_snapshot}?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    const supabase = createClient();

    const { data: current } = await supabase
      .from("workout_sessions")
      .select("skipped_exercise_ids")
      .eq("id", session)
      .single();

    const skipped = [
      ...(current?.skipped_exercise_ids ?? []),
    ];

    if (!skipped.includes(item.id)) {
      skipped.push(item.id);
    }

    const { error: updateError } =
      await supabase
        .from("workout_sessions")
        .update({
          skipped_exercise_ids: skipped,
        })
        .eq("id", session);

    if (updateError) {
      setError(updateError.message);
    } else if (index + 1 < items.length) {
      setIndex((value) => value + 1);
      setSetNumber(1);
    } else {
      await finish();
    }

    setBusy(false);
  }

  /*
   * LOADING
   */

  if (loading || !item) {
    return (
      <AppShell>
        <main className="pb-12">
          <div className="animate-pulse">
            <div className="h-4 w-36 rounded bg-[#DDE9E6]" />
            <div className="mt-4 h-10 w-64 rounded-lg bg-[#DDE9E6]" />
            <div className="mt-6 h-32 rounded-3xl bg-[#E8EEEC]" />
            <div className="mt-4 h-48 rounded-3xl bg-[#E8EEEC]" />
          </div>
        </main>
      </AppShell>
    );
  }

  const progress =
    items.length > 0
      ? ((index + 1) / items.length) * 100
      : 0;

  const restMinutes = String(
    Math.floor(rest / 60)
  ).padStart(2, "0");

  const restSeconds = String(rest % 60).padStart(
    2,
    "0"
  );

  return (
    <AppShell>
      <main className="pb-12">
        {/* TOP BAR */}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#66727F] transition hover:text-[#08A6A6]"
          >
            <ArrowLeft size={17} />
            Exit
          </button>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A96A0]">
              Exercise
            </p>

            <p className="mt-1 font-[Space_Grotesk] text-sm font-bold text-[#17212B]">
              {index + 1} / {items.length}
            </p>
          </div>
        </div>

        {/* PROGRESS */}

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E6ECEA]">
          <div
            className="h-full rounded-full bg-[#08A6A6] transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {/* EXERCISE HEADER */}

        <section className="mt-7">
          <span className="tag-safe">
            Cleared for your profile
          </span>

          <h1 className="mt-4 font-[Space_Grotesk] text-3xl font-bold tracking-tight text-[#17212B] sm:text-4xl">
            {item.exercise_name_snapshot}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66727F]">
            {item.instructions_snapshot}
          </p>
        </section>

        {/* SET CARD */}

        <section className="mt-7 overflow-hidden rounded-[28px] border border-[#DDE8E5] bg-white shadow-[0_14px_40px_rgba(24,33,43,0.06)]">
          <div className="border-b border-[#E7ECEA] bg-[#F8FAF9] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">
                  Current set
                </p>

                <h2 className="mt-1 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
                  Set {setNumber}{" "}
                  <span className="text-[#9AA5AE]">
                    / {item.sets}
                  </span>
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08A6A6]/10">
                <Dumbbell
                  size={21}
                  className="text-[#08A6A6]"
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#DDE8E5] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8A96A0]">
                Target
              </p>

              <p className="mt-1 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                {item.rep_min === item.rep_max
                  ? `${item.rep_min} reps`
                  : `${item.rep_min}–${item.rep_max} reps`}
              </p>
            </div>
          </div>

          {/* LOG SET */}

          <div className="p-5 sm:p-6">
            <p className="eyebrow">
              Log your set
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
                Weight
                <div className="relative mt-2">
                  <input
                    aria-label="Actual weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight}
                    onChange={(event) =>
                      setWeight(event.target.value)
                    }
                    className="input metric w-full pr-12 text-base"
                    placeholder="0"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9AA5AE]">
                    kg
                  </span>
                </div>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
                Reps
                <input
                  aria-label="Actual reps"
                  type="number"
                  min="0"
                  value={reps}
                  onChange={(event) =>
                    setReps(event.target.value)
                  }
                  className="input metric mt-2 w-full text-base"
                  placeholder={String(item.rep_max)}
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
                RPE
                <input
                  aria-label="RPE"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={rpe}
                  onChange={(event) =>
                    setRpe(event.target.value)
                  }
                  className="input metric mt-2 w-full text-base"
                  placeholder="1–10"
                />
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="tag-stop mt-4"
              >
                {error}
              </p>
            )}

            {/* REST */}

            {rest > 0 && (
              <div className="mt-5 rounded-2xl border border-[#DCD5FF] bg-[#F8F6FF] p-5 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7657F6]">
                  <Clock3 size={15} />
                  Rest
                </div>

                <div className="mt-2 font-[Space_Grotesk] text-5xl font-bold tracking-tight text-[#17212B]">
                  {restMinutes}:{restSeconds}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaused((value) => !value)
                    }
                    className="btn-secondary flex-1"
                  >
                    {paused ? (
                      <>
                        <Play size={16} />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause size={16} />
                        Pause
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRest(0)}
                    className="btn-secondary flex-1"
                  >
                    <SkipForward size={16} />
                    Skip
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRest((value) => value + 30)
                    }
                    className="btn-secondary flex-1"
                  >
                    <Plus size={16} />
                    30s
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={complete}
              disabled={busy || rest > 0}
              className="btn-primary mt-5 flex w-full items-center justify-center"
            >
              {busy ? (
                "Saving..."
              ) : (
                <>
                  <Check size={18} />
                  Complete Set
                </>
              )}
            </button>
          </div>
        </section>

        {/* SECONDARY ACTIONS */}

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={showSwaps}
            disabled={busy}
            className="btn-secondary flex w-full items-center justify-center"
          >
            <RefreshCw size={17} />
            Swap Exercise
          </button>

          <button
            type="button"
            onClick={skipExercise}
            disabled={busy}
            className="flex w-full items-center justify-center rounded-xl border border-[#F2D8D3] bg-[#FFF8F6] px-4 py-3 text-sm font-semibold text-[#C65B49] transition hover:bg-[#FFF1ED]"
          >
            <SkipForward
              size={17}
              className="mr-2"
            />
            Skip Exercise
          </button>
        </section>

        {/* SWAPS */}

        {swaps.length > 0 && (
          <section className="mt-5 rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">
                  Exercise alternatives
                </p>

                <h2 className="mt-1 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                  Choose a replacement
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSwaps([])}
                className="text-xs font-semibold text-[#8A96A0]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {swaps.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() =>
                    swap(exercise.id)
                  }
                  className="group flex w-full items-center justify-between rounded-xl border border-[#E4EAE8] bg-[#F9FBFA] p-4 text-left transition hover:border-[#08A6A6]/40 hover:bg-[#F3FAF8]"
                >
                  <div>
                    <p className="font-semibold text-[#17212B]">
                      {exercise.name}
                    </p>

                    <p className="mt-1 text-xs text-[#7A8792]">
                      {exercise.movement_pattern}{" "}
                      ·{" "}
                      {exercise.equipment.join(", ")}{" "}
                      · {exercise.difficulty}
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-[#9AA5AE] transition group-hover:translate-x-1 group-hover:text-[#08A6A6]"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* FINISH */}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={finish}
            disabled={busy}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#8A96A0] transition hover:text-[#C65B49]"
          >
            <TimerReset size={16} />
            Finish workout
          </button>
        </div>
      </main>
    </AppShell>
  );
}