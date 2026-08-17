"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type Session = {
  id: string;
  workout_day_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
};

type WorkoutDay = {
  id: string;
  focus: string;
  estimated_duration_minutes: number;
};

type RecentWorkout = {
  id: string;
  focus: string;
  duration: number;
  completedAt: string;
};

type ProgressStats = {
  workouts: number;
  streak: number;
  consistency: number;
  minutes: number;
  volume: number;
};

function getTrainingStreak(sessions: Session[]) {
  const dates = [
    ...new Set(
      sessions
        .filter(
          (session) =>
            session.status === "completed" &&
            session.completed_at
        )
        .map((session) =>
          new Date(session.completed_at as string)
            .toISOString()
            .slice(0, 10)
        )
    ),
  ].sort((a, b) => (a < b ? 1 : -1));

  if (dates.length === 0) {
    return 0;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const todayString = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);

  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayString = yesterday
    .toISOString()
    .slice(0, 10);

  if (
    dates[0] !== todayString &&
    dates[0] !== yesterdayString
  ) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i - 1]);
    const previous = new Date(dates[i]);

    const difference =
      (current.getTime() - previous.getTime()) /
      (1000 * 60 * 60 * 24);

    if (Math.round(difference) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getConsistency(sessions: Session[]) {
  const now = new Date();

  const start = new Date(now);

  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const completedDays = new Set(
    sessions
      .filter(
        (session) =>
          session.status === "completed" &&
          session.completed_at &&
          new Date(session.completed_at) >= start
      )
      .map((session) =>
        new Date(session.completed_at as string)
          .toISOString()
          .slice(0, 10)
      )
  );

  return Math.round((completedDays.size / 30) * 100);
}

export default function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats>({
    workouts: 0,
    streak: 0,
    consistency: 0,
    minutes: 0,
    volume: 0,
  });

  const [recent, setRecent] = useState<RecentWorkout[]>(
    []
  );

  const [weeklyActivity, setWeeklyActivity] = useState<
    boolean[]
  >([]);

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

    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select(
        "id, workout_day_id, started_at, completed_at, status"
      )
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", {
        ascending: false,
      });

    const completedSessions = (sessions ??
      []) as Session[];

    const dayIds = [
      ...new Set(
        completedSessions.map(
          (session) => session.workout_day_id
        )
      ),
    ];

    let workoutDays: WorkoutDay[] = [];

    if (dayIds.length > 0) {
      const { data: days } = await supabase
        .from("workout_days")
        .select(
          "id, focus, estimated_duration_minutes"
        )
        .in("id", dayIds);

      workoutDays = (days ?? []) as WorkoutDay[];
    }

    const dayMap = new Map(
      workoutDays.map((day) => [day.id, day])
    );

    const recentWorkouts: RecentWorkout[] =
      completedSessions
        .slice(0, 5)
        .map((session) => {
          const day = dayMap.get(
            session.workout_day_id
          );

          const minutes =
            session.completed_at
              ? Math.max(
                  0,
                  Math.round(
                    (new Date(
                      session.completed_at
                    ).getTime() -
                      new Date(
                        session.started_at
                      ).getTime()) /
                      60000
                  )
                )
              : day?.estimated_duration_minutes ?? 0;

          return {
            id: session.id,
            focus: day?.focus ?? "Workout",
            duration: minutes,
            completedAt:
              session.completed_at ??
              session.started_at,
          };
        });

    const totalMinutes = completedSessions.reduce(
      (total, session) => {
        if (!session.completed_at) {
          return total;
        }

        const minutes = Math.max(
          0,
          Math.round(
            (new Date(
              session.completed_at
            ).getTime() -
              new Date(
                session.started_at
              ).getTime()) /
              60000
          )
        );

        return total + minutes;
      },
      0
    );

    const streak =
      getTrainingStreak(completedSessions);

    const consistency =
      getConsistency(completedSessions);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const activity = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(today);

        date.setDate(
          today.getDate() - (6 - index)
        );

        const dateString = date
          .toISOString()
          .slice(0, 10);

        return completedSessions.some(
          (session) =>
            session.completed_at &&
            new Date(session.completed_at)
              .toISOString()
              .slice(0, 10) === dateString
        );
      }
    );

    setStats({
      workouts: completedSessions.length,
      streak,
      consistency,
      minutes: totalMinutes,
      volume: 0,
    });

    setRecent(recentWorkouts);
    setWeeklyActivity(activity);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const weekLabels = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">Your journey</p>

        <h1 className="page-title mt-1">
          Progress
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
          See how consistently you are training and how
          much work you have completed.
        </p>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="card h-32 animate-pulse" />
            <div className="card h-32 animate-pulse" />
            <div className="card h-32 animate-pulse" />
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="card">
                <p className="eyebrow">
                  Workouts
                </p>

                <p className="metric mt-3 text-3xl font-semibold">
                  {stats.workouts}
                </p>

                <p className="mt-2 text-xs text-white/50">
                  Completed sessions
                </p>
              </div>

              <div className="card">
                <p className="eyebrow">
                  Streak
                </p>

                <p className="metric mt-3 text-3xl font-semibold">
                  {stats.streak}
                </p>

                <p className="mt-2 text-xs text-white/50">
                  Consecutive training days
                </p>
              </div>

              <div className="card">
                <p className="eyebrow">
                  Consistency
                </p>

                <p className="metric mt-3 text-3xl font-semibold">
                  {stats.consistency}%
                </p>

                <p className="mt-2 text-xs text-white/50">
                  Training days in the last 30 days
                </p>
              </div>
            </section>

            <section className="card mt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">
                    Weekly activity
                  </p>

                  <h2 className="mt-1 font-[Space_Grotesk] text-xl font-bold">
                    This week
                  </h2>
                </div>

                <div className="metric text-sm text-white/50">
                  {weeklyActivity.filter(Boolean).length}/7
                </div>
              </div>

              <div className="mt-7 grid grid-cols-7 gap-2">
                {weeklyActivity.map(
                  (completed, index) => (
                    <div
                      key={weekLabels[index]}
                      className="text-center"
                    >
                      <p className="text-[10px] text-white/40">
                        {weekLabels[index]}
                      </p>

                      <div
                        className={`mx-auto mt-2 grid h-9 w-9 place-items-center rounded-full border ${
                          completed
                            ? "border-[#34D399]/50 bg-[#34D399]/15 text-[#34D399]"
                            : "border-white/10 bg-white/[0.03] text-white/20"
                        }`}
                      >
                        {completed ? "✓" : "·"}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="card">
                <p className="eyebrow">
                  Training time
                </p>

                <p className="metric mt-3 text-3xl font-semibold">
                  {stats.minutes}
                </p>

                <p className="mt-2 text-xs text-white/50">
                  Total completed minutes
                </p>
              </div>

              <div className="card">
                <p className="eyebrow">
                  Keep going
                </p>

                <p className="mt-3 font-[Space_Grotesk] text-xl font-bold">
                  {stats.workouts === 0
                    ? "Start your first workout"
                    : "Build your next session"}
                </p>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  Consistency matters more than perfection.
                  Keep showing up and your progress will
                  continue to grow.
                </p>

                <Link
                  href="/workout"
                  className="btn-primary mt-5"
                >
                  View workouts
                </Link>
              </div>
            </section>

            <section className="mt-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="eyebrow">
                    History
                  </p>

                  <h2 className="mt-1 font-[Space_Grotesk] text-2xl font-bold">
                    Recent workouts
                  </h2>
                </div>

                {recent.length > 0 && (
                  <span className="text-xs text-white/40">
                    Latest {recent.length}
                  </span>
                )}
              </div>

              {recent.length === 0 ? (
                <div className="card mt-5">
                  <p className="font-[Space_Grotesk] text-xl font-bold">
                    No completed workouts yet
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    Complete your first workout and your
                    training history will appear here.
                  </p>

                  <Link
                    href="/workout"
                    className="btn-primary mt-5"
                  >
                    Start a workout
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {recent.map((workout) => (
                    <div
                      key={workout.id}
                      className="card flex items-center justify-between gap-4 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {workout.focus}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {new Date(
                            workout.completedAt
                          ).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="metric text-sm text-white/50">
                          {workout.duration} min
                        </span>

                        <span className="tag-safe">
                          Complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}