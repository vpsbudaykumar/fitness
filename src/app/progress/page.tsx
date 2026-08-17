import { AppShell } from "@/components/app-shell";

export default function ProgressPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">Your journey</p>

        <h1 className="page-title mt-1">
          Progress
        </h1>

        <p className="mt-3 text-sm text-white/60">
          Track your training consistency and progress over time.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="eyebrow">Workouts</p>
            <p className="metric mt-3 text-3xl font-semibold">
              0
            </p>
            <p className="mt-2 text-xs text-white/50">
              Completed sessions
            </p>
          </div>

          <div className="card">
            <p className="eyebrow">Streak</p>
            <p className="metric mt-3 text-3xl font-semibold">
              0
            </p>
            <p className="mt-2 text-xs text-white/50">
              Days in a row
            </p>
          </div>

          <div className="card">
            <p className="eyebrow">Consistency</p>
            <p className="metric mt-3 text-3xl font-semibold">
              0%
            </p>
            <p className="mt-2 text-xs text-white/50">
              Training consistency
            </p>
          </div>
        </div>

        <section className="card mt-5">
          <p className="font-[Space_Grotesk] text-xl font-bold">
            Progress tracking
          </p>

          <p className="mt-2 text-sm text-white/60">
            Your progress metrics will appear here as you
            complete workouts.
          </p>
        </section>
      </div>
    </AppShell>
  );
}