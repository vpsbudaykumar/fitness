"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Flame,
  Trophy,
  TrendingUp,
  Dumbbell,
} from "lucide-react";
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

  return Math.round(
    (completedDays.size / 30) * 100
  );
}

export default function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats>({
    workouts: 0,
    streak: 0,
    consistency: 0,
    minutes: 0,
  });

  const [recent, setRecent] = useState<
    RecentWorkout[]
  >([]);

  const [weeklyActivity, setWeeklyActivity] =
    useState<boolean[]>([]);

  const [loading, setLoading] = useState(true);

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

      const totalMinutes =
        completedSessions.reduce(
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
      });

      setRecent(recentWorkouts);
      setWeeklyActivity(activity);
    } catch {
      setRecent([]);
      setWeeklyActivity([]);
    } finally {
      setLoading(false);
    }
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

  const activeDays =
    weeklyActivity.filter(Boolean).length;

  return (
    <AppShell>
      <main className="pb-10">
        {/* =============================================
            HEADER
        ============================================= */}

        <section className="home-greeting">
          <p className="eyebrow">
            Your journey
          </p>

          <h1 className="page-title mt-2">
            Progress
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[#66727F]">
            See how consistently you are training and
            how much work you have completed.
          </p>
        </section>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
            <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
            <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
            <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
          </div>
        ) : (
          <>
            {/* =========================================
                STAT CARDS
            ========================================= */}

            <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Workouts */}

              <div className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                    <Dumbbell
                      size={19}
                      className="text-[#08A6A6]"
                    />
                  </span>

                  <TrendingUp
                    size={17}
                    className="text-[#9AA5AF]"
                  />
                </div>

                <p className="metric mt-5 text-3xl font-bold text-[#17212B]">
                  {stats.workouts}
                </p>

                <p className="mt-1 text-xs text-[#66727F]">
                  Completed workouts
                </p>
              </div>

              {/* Streak */}

              <div className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF735C]/10">
                    <Flame
                      size={19}
                      className="text-[#FF735C]"
                    />
                  </span>

                  <span className="text-xs font-semibold text-[#FF735C]">
                    {stats.streak > 0
                      ? "Active"
                      : "Start"}
                  </span>
                </div>

                <p className="metric mt-5 text-3xl font-bold text-[#17212B]">
                  {stats.streak}
                </p>

                <p className="mt-1 text-xs text-[#66727F]">
                  Day streak
                </p>
              </div>

              {/* Consistency */}

              <div className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7657F6]/10">
                    <Trophy
                      size={19}
                      className="text-[#7657F6]"
                    />
                  </span>

                  <span className="text-xs font-semibold text-[#7657F6]">
                    30 days
                  </span>
                </div>

                <p className="metric mt-5 text-3xl font-bold text-[#17212B]">
                  {stats.consistency}%
                </p>

                <p className="mt-1 text-xs text-[#66727F]">
                  Training consistency
                </p>
              </div>

              {/* Minutes */}

              <div className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1A74B]/10">
                    <Clock3
                      size={19}
                      className="text-[#F1A74B]"
                    />
                  </span>

                  <span className="text-xs font-semibold text-[#66727F]">
                    Total
                  </span>
                </div>

                <p className="metric mt-5 text-3xl font-bold text-[#17212B]">
                  {stats.minutes}
                </p>

                <p className="mt-1 text-xs text-[#66727F]">
                  Training minutes
                </p>
              </div>
            </section>

            {/* =========================================
                WEEKLY ACTIVITY
            ========================================= */}

            <section className="mt-5 rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">
                    Weekly activity
                  </p>

                  <h2 className="mt-2 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                    This week
                  </h2>
                </div>

                <div className="rounded-xl bg-[#F1F6F5] px-3 py-2">
                  <span className="metric text-sm font-bold text-[#08A6A6]">
                    {activeDays}/7
                  </span>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-7 gap-1 sm:gap-3">
                {weekLabels.map((label, index) => {
                  const completed =
                    weeklyActivity[index] ?? false;

                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center"
                    >
                      <span className="text-[10px] font-medium text-[#9AA5AF] sm:text-xs">
                        {label}
                      </span>

                      <div
                        className={`mt-2 grid h-10 w-10 place-items-center rounded-full border transition sm:h-12 sm:w-12 ${
                          completed
                            ? "border-[#08A6A6] bg-[#08A6A6] text-white shadow-sm"
                            : "border-[#E1E7E4] bg-[#F8FAF9] text-[#B8C1BC]"
                        }`}
                      >
                        {completed ? (
                          <Check
                            size={18}
                            strokeWidth={2.5}
                          />
                        ) : (
                          <span className="text-lg">
                            ·
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* =========================================
                TRAINING SUMMARY
            ========================================= */}

            <section className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="relative overflow-hidden rounded-2xl border border-[#E7ECEA] bg-white p-6 shadow-sm">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#08A6A6]/10"
                />

                <div className="relative">
                  <p className="eyebrow">
                    Training time
                  </p>

                  <div className="mt-5 flex items-end gap-2">
                    <span className="metric text-4xl font-bold text-[#17212B]">
                      {stats.minutes}
                    </span>

                    <span className="mb-1 text-sm text-[#66727F]">
                      minutes
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#66727F]">
                    Total time spent completing
                    workouts.
                  </p>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#EDF2F0]">
                    <div
                      className="h-full rounded-full bg-[#08A6A6]"
                      style={{
                        width: `${Math.min(
                          stats.minutes / 10,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E7ECEA] bg-[#F5F2FF] p-6">
                <p className="eyebrow text-[#7657F6]">
                  Keep going
                </p>

                <h2 className="mt-3 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
                  {stats.workouts === 0
                    ? "Start your first workout"
                    : "Build your next session"}
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#66727F]">
                  Consistency matters more than
                  perfection. Keep showing up and
                  your progress will continue to grow.
                </p>

                <Link
                  href="/workout"
                  className="btn-primary mt-6 w-full sm:w-auto"
                >
                  View workouts
                  <ArrowRight
                    size={17}
                    className="ml-2"
                  />
                </Link>
              </div>
            </section>

            {/* =========================================
                HISTORY
            ========================================= */}

            <section className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    History
                  </p>

                  <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
                    Recent workouts
                  </h2>
                </div>

                {recent.length > 0 && (
                  <span className="text-xs text-[#9AA5AF]">
                    Latest {recent.length}
                  </span>
                )}
              </div>

              {recent.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[#D7DFDC] bg-white p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                    <Dumbbell
                      size={20}
                      className="text-[#08A6A6]"
                    />
                  </div>

                  <h3 className="mt-4 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                    No completed workouts yet
                  </h3>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-[#66727F]">
                    Complete your first workout and
                    your training history will appear
                    here.
                  </p>

                  <Link
                    href="/workout"
                    className="btn-primary mt-5 w-full sm:w-auto"
                  >
                    Start a workout
                    <ArrowRight
                      size={17}
                      className="ml-2"
                    />
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {recent.map((workout) => (
                    <div
                      key={workout.id}
                      className="group rounded-2xl border border-[#E7ECEA] bg-white p-4 shadow-sm transition hover:border-[#08A6A6]/25 hover:shadow-md sm:p-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F6F5]">
                          <Dumbbell
                            size={19}
                            className="text-[#08A6A6]"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[#17212B]">
                            {workout.focus}
                          </p>

                          <p className="mt-1 text-xs text-[#9AA5AF]">
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

                        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <span className="metric text-xs font-semibold text-[#66727F]">
                            {workout.duration} min
                          </span>

                          <span className="rounded-full bg-[#08A6A6]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#078B8B]">
                            Complete
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}