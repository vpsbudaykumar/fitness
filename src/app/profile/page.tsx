import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile },
    { data: preferences },
    { data: contraindications },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "name, age, height_cm, weight_kg, sex, experience_level, units"
      )
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("training_preferences")
      .select(
        "goal, equipment, workout_location, days_per_week, session_duration_minutes"
      )
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("contraindications")
      .select("body_part, severity")
      .eq("user_id", user.id),
  ]);

  const formatValue = (value: unknown) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    return String(value).replaceAll("_", " ");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">
          Account
        </p>

        <div className="mt-1 flex items-end justify-between gap-4">
          <div>
            <h1 className="page-title">
              Your profile
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
              Your personal information and training setup
              used to personalize FORM//COACH.
            </p>
          </div>

          <Link
            href="/home"
            className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white sm:block"
          >
            Back home
          </Link>
        </div>

        {/* PERSONAL */}

        <section className="mt-8">
          <p className="eyebrow">
            Personal
          </p>

          <div className="card mt-3">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-white/40">
                  Name
                </p>

                <p className="mt-1 font-semibold">
                  {formatValue(profile?.name)}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Experience
                </p>

                <p className="mt-1 font-semibold capitalize">
                  {formatValue(
                    profile?.experience_level
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Age
                </p>

                <p className="metric mt-1 text-sm">
                  {profile?.age
                    ? `${profile.age} years`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Sex
                </p>

                <p className="mt-1 font-semibold capitalize">
                  {formatValue(profile?.sex)}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Height
                </p>

                <p className="metric mt-1 text-sm">
                  {profile?.height_cm
                    ? `${profile.height_cm} cm`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Weight
                </p>

                <p className="metric mt-1 text-sm">
                  {profile?.weight_kg
                    ? `${profile.weight_kg} kg`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TRAINING */}

        <section className="mt-8">
          <p className="eyebrow">
            Training
          </p>

          <div className="card mt-3">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-white/40">
                  Goal
                </p>

                <p className="mt-1 font-semibold capitalize">
                  {formatValue(preferences?.goal)}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Workout location
                </p>

                <p className="mt-1 font-semibold capitalize">
                  {formatValue(
                    preferences?.workout_location
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Training schedule
                </p>

                <p className="metric mt-1 text-sm">
                  {preferences
                    ? `${preferences.days_per_week} days / week`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Session duration
                </p>

                <p className="metric mt-1 text-sm">
                  {preferences
                    ? `${preferences.session_duration_minutes} min`
                    : "—"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-white/40">
                  Equipment
                </p>

                {preferences?.equipment &&
                preferences.equipment.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {preferences.equipment.map(
                      (equipment: string) => (
                        <span
                          key={equipment}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium capitalize text-white/70"
                        >
                          {equipment.replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm">
                    —
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SAFETY */}

        <section className="mt-8">
          <p className="eyebrow">
            Safety
          </p>

          <div className="card mt-3">
            {contraindications &&
            contraindications.length > 0 ? (
              <div className="space-y-3">
                {contraindications.map(
                  (item, index) => (
                    <div
                      key={`${item.body_part}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold capitalize">
                          {item.body_part.replaceAll(
                            "_",
                            " "
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          Body-part restriction
                        </p>
                      </div>

                      <span
                        className={
                          item.severity ===
                          "severe"
                            ? "tag-stop"
                            : "tag-safe"
                        }
                      >
                        {formatValue(
                          item.severity
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div>
                <p className="font-semibold">
                  No restrictions recorded
                </p>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  Your current profile does not have any
                  recorded training restrictions.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ACCOUNT */}

        <section className="mt-8">
          <p className="eyebrow">
            Account
          </p>

          <div className="card mt-3">
            <p className="text-sm text-white/50">
              Signed in as
            </p>

            <p className="mt-1 break-all text-sm font-semibold">
              {user.email ?? "Account"}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/reset-password"
                className="btn-secondary"
              >
                Reset password
              </Link>

              <Link
                href="/home"
                className="btn-primary"
              >
                Back to training
              </Link>
            </div>
          </div>
        </section>

        <div className="pb-8 pt-8 text-center">
          <p className="text-xs text-white/30">
            FORM//COACH uses your profile to personalize
            your training experience.
          </p>
        </div>
      </div>
    </AppShell>
  );
}