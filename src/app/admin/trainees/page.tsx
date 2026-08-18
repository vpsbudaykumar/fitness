"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Dumbbell,
  MapPin,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type Trainee = {
  id: string;
  name: string | null;
  role: "trainee";
  created_at: string;
  experience_level: string | null;
  goal: string | null;
  equipment: string[];
  workout_location: string | null;
  days_per_week: number | null;
  session_duration_minutes: number | null;
};

function formatValue(value: string | null | undefined) {
  if (!value) return "Not set";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function AdminTraineesPage() {
  const supabase = createClient();

  const [trainees, setTrainees] = useState<Trainee[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadTrainees = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: currentProfile } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (
      !currentProfile ||
      !["admin", "owner"].includes(
        currentProfile.role
      )
    ) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

    const { data: profiles, error: profilesError } =
      await supabase
        .from("profiles")
        .select(
          "id, name, role, created_at, experience_level"
        )
        .eq("role", "trainee")
        .order("created_at", {
          ascending: false,
        });

    if (profilesError) {
      setError(profilesError.message);
      setLoading(false);
      return;
    }

    const traineeProfiles = profiles ?? [];

    if (traineeProfiles.length === 0) {
      setTrainees([]);
      setLoading(false);
      return;
    }

    const traineeIds = traineeProfiles.map(
      (profile) => profile.id
    );

    const {
      data: preferences,
      error: preferencesError,
    } = await supabase
      .from("training_preferences")
      .select(
        "user_id, goal, equipment, workout_location, days_per_week, session_duration_minutes"
      )
      .in("user_id", traineeIds);

    if (preferencesError) {
      setError(preferencesError.message);
      setLoading(false);
      return;
    }

    const preferenceMap = new Map(
      (preferences ?? []).map((preference) => [
        preference.user_id,
        preference,
      ])
    );

    const combined: Trainee[] =
      traineeProfiles.map((profile) => {
        const preference =
          preferenceMap.get(profile.id);

        return {
          id: profile.id,
          name: profile.name,
          role: "trainee",
          created_at: profile.created_at,
          experience_level:
            profile.experience_level,
          goal: preference?.goal ?? null,
          equipment: Array.isArray(
            preference?.equipment
          )
            ? preference.equipment.map(
                (item: unknown) => String(item)
              )
            : [],
          workout_location:
            preference?.workout_location ?? null,
          days_per_week:
            preference?.days_per_week ?? null,
          session_duration_minutes:
            preference?.session_duration_minutes ??
            null,
        };
      });

    setTrainees(combined);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadTrainees();
  }, [loadTrainees]);

  const filteredTrainees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return trainees;
    }

    return trainees.filter((trainee) => {
      const searchable = [
        trainee.name ?? "",
        trainee.goal ?? "",
        trainee.experience_level ?? "",
        trainee.workout_location ?? "",
        ...trainee.equipment,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [trainees, search]);

  if (loading) {
    return (
      <AppShell>
        <main className="pb-12">
          <div className="mx-auto max-w-6xl">
            <div className="animate-pulse">
              <div className="h-4 w-28 rounded bg-[#E5ECE9]" />

              <div className="mt-4 h-10 w-64 rounded-lg bg-[#E5ECE9]" />

              <div className="mt-8 h-24 rounded-2xl bg-[#E8EEEC]" />

              <div className="mt-4 h-64 rounded-2xl bg-[#E8EEEC]" />
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
              Trainee management is available only
              to Admin and Owner accounts.
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

  return (
    <AppShell>
      <main className="pb-12">
        <div className="mx-auto max-w-6xl">
          {/* HEADER */}

          <section className="home-greeting">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#66727F] transition hover:text-[#08A6A6]"
            >
              <ArrowLeft size={14} />
              Admin Console
            </Link>

            <p className="eyebrow mt-6">
              Administration
            </p>

            <h1 className="page-title mt-2">
              Trainees
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#66727F]">
              A focused view of users who are working
              with or have hired a trainer.
            </p>
          </section>

          {/* SUMMARY */}

          <section className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1A74B]/10">
                <UserRoundCheck
                  size={19}
                  className="text-[#F1A74B]"
                />
              </div>

              <p className="metric mt-5 text-3xl font-bold text-[#17212B]">
                {trainees.length}
              </p>

              <p className="mt-1 text-xs text-[#66727F]">
                Total trainees
              </p>
            </div>

            <div className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                <CalendarDays
                  size={19}
                  className="text-[#08A6A6]"
                />
              </div>

              <p className="metric mt-5 text-3xl font-bold text-[#17212B]">
                {
                  trainees.filter(
                    (trainee) =>
                      trainee.days_per_week &&
                      trainee.days_per_week > 0
                  ).length
                }
              </p>

              <p className="mt-1 text-xs text-[#66727F]">
                With training schedules
              </p>
            </div>

            <div className="rounded-2xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7657F6]/10">
                <Dumbbell
                  size={19}
                  className="text-[#7657F6]"
                />
              </div>

              <p className="metric mt-5 text-3xl font-bold text-[#17212B]">
                {
                  new Set(
                    trainees
                      .map(
                        (trainee) => trainee.goal
                      )
                      .filter(Boolean)
                  ).size
                }
              </p>

              <p className="mt-1 text-xs text-[#66727F]">
                Active goal types
              </p>
            </div>
          </section>

          {/* SEARCH */}

          <section className="mt-5 rounded-2xl border border-[#E7ECEA] bg-white p-4 shadow-sm">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA5AF]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search trainees..."
                className="input pl-11"
              />
            </div>
          </section>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-[#FF735C]/20 bg-[#FF735C]/10 px-4 py-3 text-sm font-medium text-[#D9513D]"
            >
              {error}
            </div>
          )}

          {/* TRAINEES */}

          <section className="mt-8">
            <div className="mb-4">
              <p className="eyebrow">
                Trainee directory
              </p>

              <h2 className="mt-1 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                {filteredTrainees.length}{" "}
                {filteredTrainees.length === 1
                  ? "trainee"
                  : "trainees"}
              </h2>
            </div>

            {filteredTrainees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D7DFDC] bg-white p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F6F5]">
                  <UserRoundCheck
                    size={25}
                    className="text-[#A4AEA9]"
                  />
                </div>

                <h3 className="mt-4 font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
                  No trainees found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#66727F]">
                  {trainees.length === 0
                    ? "There are currently no accounts with the Trainee role."
                    : "Try changing your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrainees.map(
                  (trainee) => (
                    <article
                      key={trainee.id}
                      className="rounded-3xl border border-[#E7ECEA] bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col gap-5">
                        {/* TOP */}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1A74B]/10">
                              <UserRoundCheck
                                size={22}
                                className="text-[#F1A74B]"
                              />
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                                {trainee.name ||
                                  "Unnamed trainee"}
                              </h3>

                              <p className="mt-1 font-mono text-[10px] text-[#A4AEA9]">
                                {trainee.id}
                              </p>
                            </div>
                          </div>

                          <span className="w-fit rounded-full border border-[#F1A74B]/20 bg-[#F1A74B]/10 px-3 py-1.5 text-xs font-bold text-[#B87416]">
                            Trainee
                          </span>
                        </div>

                        {/* DETAILS */}

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <Detail
                            label="Goal"
                            value={formatValue(
                              trainee.goal
                            )}
                          />

                          <Detail
                            label="Experience"
                            value={formatValue(
                              trainee.experience_level
                            )}
                          />

                          <Detail
                            label="Location"
                            value={formatValue(
                              trainee.workout_location
                            )}
                            icon={
                              <MapPin
                                size={14}
                              />
                            }
                          />

                          <Detail
                            label="Schedule"
                            value={
                              trainee.days_per_week
                                ? `${trainee.days_per_week} days / week`
                                : "Not set"
                            }
                            icon={
                              <CalendarDays
                                size={14}
                              />
                            }
                          />

                          <Detail
                            label="Session"
                            value={
                              trainee.session_duration_minutes
                                ? `${trainee.session_duration_minutes} min`
                                : "Not set"
                            }
                            icon={
                              <Clock3 size={14} />
                            }
                          />

                          <Detail
                            label="Equipment"
                            value={
                              trainee.equipment
                                .length > 0
                                ? trainee.equipment
                                    .map(
                                      formatValue
                                    )
                                    .join(", ")
                                : "Not set"
                            }
                            icon={
                              <Dumbbell
                                size={14}
                              />
                            }
                          />

                          <Detail
                            label="Joined"
                            value={new Date(
                              trainee.created_at
                            ).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                            icon={
                              <CalendarDays
                                size={14}
                              />
                            }
                          />

                          <Detail
                            label="Status"
                            value="Active"
                          />
                        </div>

                        {/* FUTURE TRAINER AREA */}

                        <div className="rounded-2xl border border-[#DCD5FF] bg-[#F8F6FF] p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                              <UserRoundCheck
                                size={17}
                                className="text-[#7657F6]"
                              />
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7657F6]">
                                Trainer relationship
                              </p>

                              <p className="mt-1 text-sm text-[#66727F]">
                                Trainer assignment and
                                live trainer support will
                                be added in a future
                                phase.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>

          {/* FOOTER */}

          <div className="mt-8 flex justify-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#66727F] transition hover:text-[#08A6A6]"
            >
              <ArrowLeft size={16} />
              Back to Admin Console
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#F8FAF9] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA5AF]">
        {label}
      </p>

      <div className="mt-2 flex items-start gap-2">
        {icon && (
          <span className="mt-0.5 text-[#08A6A6]">
            {icon}
          </span>
        )}

        <p className="text-sm font-semibold leading-5 text-[#34414D]">
          {value}
        </p>
      </div>
    </div>
  );
}