"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Dumbbell,
  Flame,
  SkipForward,
  Target,
  Trophy,
  Weight,
} from "lucide-react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type Stats = {
  minutes: number;
  sets: number;
  skipped: number;
  volume: number;
  rpe: number;
  percent: number;
};

export default function Summary() {
  const { sessionId } =
    useParams<{ sessionId: string }>();

  const [stats, setStats] = useState<Stats>({
    minutes: 0,
    sets: 0,
    skipped: 0,
    volume: 0,
    rpe: 0,
    percent: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      const supabase = createClient();

      const [{ data: session }, { data: sets }] =
        await Promise.all([
          supabase
            .from("workout_sessions")
            .select(
              "started_at, completed_at, skipped_exercise_ids"
            )
            .eq("id", sessionId)
            .maybeSingle(),

          supabase
            .from("exercise_sets")
            .select(
              "status, weight_kg, reps, rpe"
            )
            .eq("session_id", sessionId),
        ]);

      const done =
        sets?.filter(
          (item) => item.status === "completed"
        ) ?? [];

      const skipped =
        session?.skipped_exercise_ids?.length ?? 0;

      const mins =
        session?.completed_at &&
        session?.started_at
          ? Math.max(
              0,
              Math.round(
                (+new Date(session.completed_at) -
                  +new Date(session.started_at)) /
                  60000
              )
            )
          : 0;

      const volume = done.reduce(
        (total, item) =>
          total +
          Number(item.weight_kg ?? 0) *
            Number(item.reps ?? 0),
        0
      );

      const averageRpe = done.length
        ? done.reduce(
            (total, item) =>
              total + Number(item.rpe ?? 0),
            0
          ) / done.length
        : 0;

      setStats({
        minutes: mins,
        sets: done.length,
        skipped,
        volume,
        rpe: averageRpe,
        percent: done.length ? 100 : 0,
      });

      setLoading(false);
    }

    void loadSummary();
  }, [sessionId]);

  if (loading) {
    return (
      <AppShell>
        <main className="pb-12">
          <div className="animate-pulse">
            <div className="h-72 rounded-[28px] bg-[#E8EEEC]" />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="h-28 rounded-2xl bg-[#E8EEEC]" />
              <div className="h-28 rounded-2xl bg-[#E8EEEC]" />
              <div className="h-28 rounded-2xl bg-[#E8EEEC]" />
              <div className="h-28 rounded-2xl bg-[#E8EEEC]" />
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  const metrics = [
    {
      label: "Duration",
      value: `${stats.minutes} min`,
      icon: <Clock3 size={19} />,
      className: "text-[#08A6A6] bg-[#08A6A6]/10",
    },
    {
      label: "Completed sets",
      value: String(stats.sets),
      icon: <Dumbbell size={19} />,
      className: "text-[#7657F6] bg-[#7657F6]/10",
    },
    {
      label: "Skipped exercises",
      value: String(stats.skipped),
      icon: <SkipForward size={19} />,
      className: "text-[#FF735C] bg-[#FF735C]/10",
    },
    {
      label: "Total volume",
      value: `${Math.round(stats.volume)} kg`,
      icon: <Weight size={19} />,
      className: "text-[#08A6A6] bg-[#08A6A6]/10",
    },
    {
      label: "Average RPE",
      value: stats.rpe.toFixed(1),
      icon: <Target size={19} />,
      className: "text-[#7657F6] bg-[#7657F6]/10",
    },
    {
      label: "Completion",
      value: `${stats.percent}%`,
      icon: <Check size={19} />,
      className: "text-[#FF735C] bg-[#FF735C]/10",
    },
  ];

  return (
    <AppShell>
      <main className="pb-12">
        {/* SUCCESS HERO */}

        <section className="relative overflow-hidden rounded-[30px] border border-[#CFE9E3] bg-[#F1FAF8] p-7 text-center shadow-[0_14px_40px_rgba(24,33,43,0.06)] sm:p-10">
          <div
            aria-hidden="true"
            className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-[#08A6A6]/10"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-20 -right-12 h-52 w-52 rounded-full bg-[#7657F6]/10"
          />

          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[5px] border-[#08A6A6]/20 bg-white shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#08A6A6] text-white">
                <Check
                  size={28}
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <p className="eyebrow mt-6">
              Session complete
            </p>

            <h1 className="mt-2 font-[Space_Grotesk] text-3xl font-bold tracking-tight text-[#17212B] sm:text-4xl">
              Workout Complete
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#66727F]">
              Your completed session has been logged.
              Another step forward in your training.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D7EAE6] bg-white px-4 py-2 text-xs font-semibold text-[#08A6A6]">
              <Flame size={15} />
              Consistency matters
            </div>
          </div>
        </section>

        {/* KEY RESULT */}

        <section className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <p className="eyebrow">
              Training time
            </p>

            <p className="mt-2 font-[Space_Grotesk] text-3xl font-bold text-[#17212B]">
              {stats.minutes}
              <span className="ml-1 text-sm font-medium text-[#66727F]">
                min
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-sm">
            <p className="eyebrow">
              Completion
            </p>

            <p className="mt-2 font-[Space_Grotesk] text-3xl font-bold text-[#17212B]">
              {stats.percent}%
            </p>
          </div>
        </section>

        {/* SESSION METRICS */}

        <section className="mt-8">
          <div>
            <p className="eyebrow">
              Session breakdown
            </p>

            <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
              Your workout
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[#DDE8E5] bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.className}`}
                >
                  {metric.icon}
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7A8792]">
                  {metric.label}
                </p>

                <p className="mt-1 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FORM JOURNEY */}

        <section className="mt-5 rounded-2xl border border-[#DCD5FF] bg-[#F8F6FF] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7657F6]/10">
              <Trophy
                size={20}
                className="text-[#7657F6]"
              />
            </div>

            <div>
              <p className="eyebrow text-[#7657F6]">
                FORM Journey
              </p>

              <h2 className="mt-1 font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
                Another session complete
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#66727F]">
                This workout can contribute to your
                future consistency journey once FORM
                Journey tracking is enabled.
              </p>
            </div>
          </div>
        </section>

        {/* ACTIONS */}

        <section className="mt-6 space-y-3">
          <Link
            href="/home"
            className="btn-primary flex w-full items-center justify-center"
          >
            Back to Home
            <ArrowRight
              size={18}
              className="ml-2"
            />
          </Link>

          <Link
            href="/progress"
            className="btn-secondary flex w-full items-center justify-center"
          >
            View Progress
            <ArrowRight
              size={18}
              className="ml-2"
            />
          </Link>
        </section>
      </main>
    </AppShell>
  );
}