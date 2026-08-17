"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type ProfileData = {
  name: string;
  age: string;
  height_cm: string;
  weight_kg: string;
  sex: string;
  experience_level: string;
  units: string;
};

type PreferencesData = {
  goal: string;
  equipment: string[];
  workout_location: string;
  days_per_week: string;
  session_duration_minutes: string;
};

const goals = [
  ["build_muscle", "Build muscle"],
  ["lose_fat", "Lose fat"],
  ["improve_strength", "Improve strength"],
  ["improve_endurance", "Improve endurance"],
  ["general_fitness", "General fitness"],
  ["mobility", "Mobility"],
];

const experiences = [
  ["beginner", "Beginner"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
];

const equipmentOptions = [
  ["full_gym", "Full gym"],
  ["dumbbells", "Dumbbells"],
  ["barbell", "Barbell"],
  ["resistance_bands", "Resistance bands"],
  ["bodyweight", "Bodyweight"],
  ["home_gym", "Home gym"],
];

const locations = [
  ["gym", "Gym"],
  ["home", "Home"],
  ["outdoor", "Outdoor"],
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    sex: "",
    experience_level: "",
    units: "metric",
  });

  const [preferences, setPreferences] =
    useState<PreferencesData>({
      goal: "",
      equipment: [],
      workout_location: "",
      days_per_week: "",
      session_duration_minutes: "",
    });

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");

      const [
        { data: profileData, error: profileError },
        { data: preferenceData, error: preferenceError },
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
      ]);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (preferenceError) {
        setError(preferenceError.message);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile({
          name: profileData.name ?? "",
          age:
            profileData.age !== null &&
            profileData.age !== undefined
              ? String(profileData.age)
              : "",
          height_cm:
            profileData.height_cm !== null &&
            profileData.height_cm !== undefined
              ? String(profileData.height_cm)
              : "",
          weight_kg:
            profileData.weight_kg !== null &&
            profileData.weight_kg !== undefined
              ? String(profileData.weight_kg)
              : "",
          sex: profileData.sex ?? "",
          experience_level:
            profileData.experience_level ?? "",
          units: profileData.units ?? "metric",
        });
      }

      if (preferenceData) {
        setPreferences({
          goal: preferenceData.goal ?? "",
          equipment: Array.isArray(
            preferenceData.equipment
          )
            ? preferenceData.equipment.map(
                (item: unknown) => String(item)
              )
            : [],
          workout_location:
            preferenceData.workout_location ?? "",
          days_per_week:
            preferenceData.days_per_week !== null &&
            preferenceData.days_per_week !== undefined
              ? String(preferenceData.days_per_week)
              : "",
          session_duration_minutes:
            preferenceData.session_duration_minutes !==
              null &&
            preferenceData.session_duration_minutes !==
              undefined
              ? String(
                  preferenceData.session_duration_minutes
                )
              : "",
        });
      }

      setLoading(false);
    }

    void loadProfile();
  }, [router, supabase]);

  function toggleEquipment(value: string) {
    setPreferences((current) => ({
      ...current,
      equipment: current.equipment.includes(value)
        ? current.equipment.filter(
            (item) => item !== value
          )
        : [...current.equipment, value],
    }));
  }

  function validate() {
    if (!profile.name.trim()) {
      return "Enter your name.";
    }

    const age = Number(profile.age);

    if (!age || age < 13 || age > 120) {
      return "Age must be between 13 and 120.";
    }

    const height = Number(profile.height_cm);

    if (!height || height < 50 || height > 300) {
      return "Enter a valid height in cm.";
    }

    const weight = Number(profile.weight_kg);

    if (!weight || weight < 20 || weight > 500) {
      return "Enter a valid weight in kg.";
    }

    if (!profile.experience_level) {
      return "Choose your experience level.";
    }

    if (!preferences.goal) {
      return "Choose your fitness goal.";
    }

    if (!preferences.equipment.length) {
      return "Choose at least one equipment option.";
    }

    if (!preferences.workout_location) {
      return "Choose your workout location.";
    }

    const days = Number(
      preferences.days_per_week
    );

    if (!days || days < 1 || days > 7) {
      return "Training days must be between 1 and 7.";
    }

    const duration = Number(
      preferences.session_duration_minutes
    );

    if (!duration || duration < 10 || duration > 180) {
      return "Session duration must be between 10 and 180 minutes.";
    }

    return "";
  }

  async function saveProfile() {
    setError("");
    setSuccess("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      const { error: profileError } =
        await supabase
          .from("profiles")
          .update({
            name: profile.name.trim(),
            age: Number(profile.age),
            height_cm: Number(profile.height_cm),
            weight_kg: Number(profile.weight_kg),
            sex: profile.sex.trim() || null,
            experience_level:
              profile.experience_level,
            units: profile.units,
          })
          .eq("id", user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      const { error: preferencesError } =
        await supabase
          .from("training_preferences")
          .update({
            goal: preferences.goal,
            equipment: preferences.equipment,
            workout_location:
              preferences.workout_location,
            days_per_week:
              Number(preferences.days_per_week),
            session_duration_minutes:
              Number(
                preferences.session_duration_minutes
              ),
          })
          .eq("user_id", user.id);

      if (preferencesError) {
        throw new Error(
          preferencesError.message
        );
      }

      setEditing(false);
      setSuccess("Profile updated successfully.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl">
          <div className="card animate-pulse text-white/40">
            Loading your profile...
          </div>
        </div>
      </AppShell>
    );
  }

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
              Manage your personal information and
              training preferences.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setEditing(true);
              }}
              className="btn-primary hidden sm:inline-flex"
            >
              Edit profile
            </button>
          )}
        </div>

        {success && (
          <div className="mt-5 rounded-xl border border-[#34D399]/20 bg-[#34D399]/10 px-4 py-3 text-sm text-[#34D399]">
            {success}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-[#F2545B]/20 bg-[#F2545B]/10 px-4 py-3 text-sm text-[#F2545B]"
          >
            {error}
          </div>
        )}

        {editing ? (
          <>
            {/* PERSONAL EDIT */}

            <section className="mt-8">
              <p className="eyebrow">
                Personal
              </p>

              <div className="card mt-3">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="text-sm">
                    Name
                    <input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          name: e.target.value,
                        })
                      }
                      className="input mt-1"
                      maxLength={80}
                    />
                  </label>

                  <label className="text-sm">
                    Age
                    <input
                      type="number"
                      min="13"
                      max="120"
                      value={profile.age}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          age: e.target.value,
                        })
                      }
                      className="input mt-1"
                    />
                  </label>

                  <label className="text-sm">
                    Height (cm)
                    <input
                      type="number"
                      min="50"
                      max="300"
                      value={profile.height_cm}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          height_cm:
                            e.target.value,
                        })
                      }
                      className="input mt-1"
                    />
                  </label>

                  <label className="text-sm">
                    Weight (kg)
                    <input
                      type="number"
                      min="20"
                      max="500"
                      value={profile.weight_kg}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          weight_kg:
                            e.target.value,
                        })
                      }
                      className="input mt-1"
                    />
                  </label>

                  <label className="text-sm">
                    Sex
                    <input
                      value={profile.sex}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          sex: e.target.value,
                        })
                      }
                      className="input mt-1"
                      maxLength={40}
                    />
                  </label>

                  <label className="text-sm">
                    Experience
                    <select
                      value={
                        profile.experience_level
                      }
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          experience_level:
                            e.target.value,
                        })
                      }
                      className="input mt-1"
                    >
                      <option value="">
                        Select experience
                      </option>

                      {experiences.map(
                        ([value, label]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>
              </div>
            </section>

            {/* TRAINING EDIT */}

            <section className="mt-8">
              <p className="eyebrow">
                Training
              </p>

              <div className="card mt-3">
                <div className="space-y-6">
                  <div>
                    <p className="mb-2 text-sm">
                      Goal
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {goals.map(
                        ([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setPreferences({
                                ...preferences,
                                goal: value,
                              })
                            }
                            className={`rounded-xl border p-3 text-left text-sm transition ${
                              preferences.goal ===
                              value
                                ? "border-[#3D5AFE] bg-[#3D5AFE]/15 text-white"
                                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                            }`}
                          >
                            {label}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm">
                      Experience
                    </p>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {experiences.map(
                        ([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setProfile({
                                ...profile,
                                experience_level:
                                  value,
                              })
                            }
                            className={`rounded-xl border p-3 text-sm transition ${
                              profile.experience_level ===
                              value
                                ? "border-[#3D5AFE] bg-[#3D5AFE]/15 text-white"
                                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                            }`}
                          >
                            {label}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm">
                      Equipment
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {equipmentOptions.map(
                        ([value, label]) => (
                          <label
                            key={value}
                            className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
                              preferences.equipment.includes(
                                value
                              )
                                ? "border-[#3D5AFE] bg-[#3D5AFE]/15"
                                : "border-white/10 bg-white/[0.03]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={preferences.equipment.includes(
                                value
                              )}
                              onChange={() =>
                                toggleEquipment(
                                  value
                                )
                              }
                              className="mr-2"
                            />

                            {label}
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm">
                      Workout location
                    </p>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {locations.map(
                        ([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setPreferences({
                                ...preferences,
                                workout_location:
                                  value,
                              })
                            }
                            className={`rounded-xl border p-3 text-sm transition ${
                              preferences.workout_location ===
                              value
                                ? "border-[#3D5AFE] bg-[#3D5AFE]/15 text-white"
                                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                            }`}
                          >
                            {label}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-sm">
                      Training days per week
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={
                          preferences.days_per_week
                        }
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            days_per_week:
                              e.target.value,
                          })
                        }
                        className="input mt-1"
                      />
                    </label>

                    <label className="text-sm">
                      Minutes per session
                      <input
                        type="number"
                        min="10"
                        max="180"
                        value={
                          preferences.session_duration_minutes
                        }
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            session_duration_minutes:
                              e.target.value,
                          })
                        }
                        className="input mt-1"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* ACTIONS */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving
                  ? "Saving changes..."
                  : "Save changes"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setSuccess("");
                }}
                disabled={saving}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
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
                      {profile.name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/40">
                      Experience
                    </p>

                    <p className="mt-1 font-semibold capitalize">
                      {profile.experience_level ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/40">
                      Age
                    </p>

                    <p className="metric mt-1 text-sm">
                      {profile.age
                        ? `${profile.age} years`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/40">
                      Sex
                    </p>

                    <p className="mt-1 font-semibold capitalize">
                      {profile.sex || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/40">
                      Height
                    </p>

                    <p className="metric mt-1 text-sm">
                      {profile.height_cm
                        ? `${profile.height_cm} cm`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/40">
                      Weight
                    </p>

                    <p className="metric mt-1 text-sm">
                      {profile.weight_kg
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
                      {preferences.goal.replaceAll(
                        "_",
                        " "
                      ) || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/40">
                      Workout location
                    </p>

                    <p className="mt-1 font-semibold capitalize">
                      {preferences.workout_location ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/40">
                      Training schedule
                    </p>

                    <p className="metric mt-1 text-sm">
                      {preferences.days_per_week
                        ? `${preferences.days_per_week} days / week`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/40">
                      Session duration
                    </p>

                    <p className="metric mt-1 text-sm">
                      {preferences.session_duration_minutes
                        ? `${preferences.session_duration_minutes} min`
                        : "—"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-white/40">
                      Equipment
                    </p>

                    {preferences.equipment.length >
                    0 ? (
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
                  {email || "Account"}
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setEditing(true);
                    }}
                    className="btn-primary sm:hidden"
                  >
                    Edit profile
                  </button>

                  <Link
                    href="/reset-password"
                    className="btn-secondary"
                  >
                    Reset password
                  </Link>

                  <Link
                    href="/home"
                    className="btn-secondary"
                  >
                    Back to training
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}

        <div className="pb-10 pt-8 text-center">
          <p className="text-xs text-white/30">
            FORM//COACH uses your profile to personalize
            your training experience.
          </p>
        </div>
      </div>
    </AppShell>
  );
}