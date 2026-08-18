"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  Users,
  UserRoundCheck,
  Settings,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type Stats = {
  users: number;
  trainees: number;
  workouts: number;
  activeUsers: number;
};

export default function AdminDashboard() {
  const supabase = createClient();

  const [stats, setStats] = useState<Stats>({
    users: 0,
    trainees: 0,
    workouts: 0,
    activeUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (
        !profile ||
        !["admin", "owner"].includes(profile.role)
      ) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      const [
        usersResult,
        traineesResult,
        workoutsResult,
        activeResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "trainee"),

        supabase
          .from("workout_sessions")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("status", "completed"),

        supabase
          .from("workout_sessions")
          .select("user_id", {
            count: "exact",
            head: true,
          })
          .gte(
            "started_at",
            new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString()
          ),
      ]);

      setStats({
        users: usersResult.count ?? 0,
        trainees: traineesResult.count ?? 0,
        workouts: workoutsResult.count ?? 0,
        activeUsers: activeResult.count ?? 0,
      });

      setLoading(false);
    }

    void loadDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <AppShell>
        <main className="pb-12">
          <div className="mx-auto max-w-6xl">
            <div className="animate-pulse">
              <div className="h-4 w-32 rounded bg-[#E5ECE9]" />
              <div className="mt-4 h-10 w-72 rounded-lg bg-[#E5ECE9]" />

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-36 rounded-2xl bg-[#E8EEEC]"
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  if (!authorized) {
    return (
      <AppShell>
        <main className="grid min-h-[70vh] place-items-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF735C]/10">
              <ShieldCheck
                size={28}
                className="text-[#FF735C]"
              />
            </div>

            <h1 className="mt-5 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
              Access restricted
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#66727F]">
              This area is available only to Admin and
              Owner accounts.
            </p>

            <Link
              href="/home"
              className="btn-primary mt-6 inline-flex"
            >
              Back to app
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  const cards = [
    {
      label: "Total users",
      value: stats.users,
      icon: Users,
      iconClass:
        "bg-[#08A6A6]/10 text-[#08A6A6]",
    },
    {
      label: "Trainees",
      value: stats.trainees,
      icon: UserRoundCheck,
      iconClass:
        "bg-[#7657F6]/10 text-[#7657F6]",
    },
    {
      label: "Completed workouts",
      value: stats.workouts,
      icon: Dumbbell,
      iconClass:
        "bg-[#F1A74B]/10 text-[#F1A74B]",
    },
    {
      label: "Sessions this week",
      value: stats.activeUsers,
      icon: Activity,
      iconClass:
        "bg-[#FF735C]/10 text-[#FF735C]",
    },
  ];

  return (
    <AppShell>
      <main className="pb-12">
        <div className="mx-auto max-w-6xl">
          {/* HEADER */}

          <section className="home-greeting">
            <p className="eyebrow">
              Administration
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="page-title">
                  Admin Console
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#66727F]">
                  Manage the FORM//COACH platform,
                  users, training content, and Coach
                  experience.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#08A6A6]/15 bg-[#08A6A6]/10 px-3 py-2 text-xs font-bold text-[#078B8B]">
                <ShieldCheck size={14} />
                Admin access
              </div>
            </div>
          </section>

          {/* STATS */}

          <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}
                  >
                    <Icon size={19} />
                  </div>

                  <p className="metric mt-5 text-3xl font-bold text-[#17212B]">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs text-[#66727F]">
                    {card.label}
                  </p>
                </div>
              );
            })}
          </section>

          {/* MANAGEMENT */}

          <section className="mt-8">
            <p className="eyebrow">
              Platform management
            </p>

            <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#17212B]">
              Control center
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <AdminCard
                href="/admin/users"
                icon={<Users size={21} />}
                iconClass="bg-[#08A6A6]/10 text-[#08A6A6]"
                title="Users"
                description="View users, trainees, and account status."
              />

              <AdminCard
                href="/admin/workouts"
                icon={<Dumbbell size={21} />}
                iconClass="bg-[#F1A74B]/10 text-[#F1A74B]"
                title="Workout Management"
                description="Manage workout plans, days, and exercise content."
              />

              <AdminCard
                href="/admin/coach"
                icon={<Sparkles size={21} />}
                iconClass="bg-[#7657F6]/10 text-[#7657F6]"
                title="Coach Management"
                description="Manage Coach rules, alternatives, and guidance."
              />

              <AdminCard
                href="/admin/settings"
                icon={<Settings size={21} />}
                iconClass="bg-[#FF735C]/10 text-[#FF735C]"
                title="Settings"
                description="Manage platform-level configuration."
              />
            </div>
          </section>

          {/* OWNER NOTE */}

          <section className="mt-8 rounded-3xl border border-[#DCD5FF] bg-[#F8F6FF] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
                <ShieldCheck
                  size={22}
                  className="text-[#7657F6]"
                />
              </div>

              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7657F6]">
                  Owner controls
                </p>

                <h3 className="mt-2 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                  Role management
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#66727F]">
                  Owners will be able to assign User,
                  Trainee, and Admin roles. The role
                  management interface will be added to
                  Users.
                </p>
              </div>

              <Link
                href="/home"
                className="inline-flex items-center text-sm font-semibold text-[#7657F6]"
              >
                Back to app
                <ArrowRight
                  size={16}
                  className="ml-2"
                />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function AdminCard({
  href,
  icon,
  iconClass,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#08A6A6]/25 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#66727F]">
            {description}
          </p>

          <div className="mt-4 flex items-center text-xs font-bold text-[#08A6A6]">
            Open
            <ArrowRight
              size={14}
              className="ml-1 transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}