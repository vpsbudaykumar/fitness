"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Dumbbell,
  MapPin,
  Save,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
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

  const [profile, setProfile] =
    useState<ProfileData>({
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

  function startEditing() {
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError("");
    setSuccess("");
  }

  if (loading) {
    return (
      <AppShell>
        <main className="pb-10">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-[#E7ECEA] bg-white p-6 shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 w-20 rounded bg-[#E5ECE9]" />
                <div className="mt-4 h-9 w-48 rounded-lg bg-[#E5ECE9]" />
                <div className="mt-3 h-4 w-72 rounded bg-[#EDF2F0]" />
                <div className="mt-8 h-40 rounded-2xl bg-[#F1F6F5]" />
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="pb-10">
        <div className="mx-auto max-w-4xl">
          {/* =================================================
              HEADER
          ================================================= */}

          <section className="home-greeting">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">
                  Account
                </p>

                <h1 className="page-title mt-2">
                  Your profile
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-6 text-[#66727F]">
                  Manage the information FORM//COACH
                  uses to personalize your training.
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="hidden rounded-xl bg-[#08A6A6] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#078F8F] sm:inline-flex"
                >
                  Edit profile
                </button>
              )}
            </div>
          </section>

          {/* =================================================
              STATUS
          ================================================= */}

          {success && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#08A6A6]/20 bg-[#08A6A6]/8 px-4 py-3 text-sm font-medium text-[#078B8B]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#08A6A6]/15">
                <Check size={15} />
              </span>

              {success}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-[#FF735C]/20 bg-[#FF735C]/8 px-4 py-3 text-sm font-medium text-[#D9513D]"
            >
              {error}
            </div>
          )}

          {/* =================================================
              EDIT MODE
          ================================================= */}

          {editing ? (
            <>
              {/* PERSONAL */}

              <section className="mt-8">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                    <UserRound
                      size={17}
                      className="text-[#08A6A6]"
                    />
                  </span>

                  <div>
                    <p className="eyebrow">
                      Personal
                    </p>

                    <h2 className="font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                      About you
                    </h2>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#E7ECEA] bg-white p-5 shadow-sm sm:p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-[#34414D]">
                      Name

                      <input
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            name: e.target.value,
                          })
                        }
                        className="input mt-2"
                        maxLength={80}
                      />
                    </label>

                    <label className="text-sm font-semibold text-[#34414D]">
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
                        className="input mt-2"
                      />
                    </label>

                    <label className="text-sm font-semibold text-[#34414D]">
                      Height

                      <div className="relative">
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
                          className="input mt-2 pr-14"
                        />

                        <span className="pointer-events-none absolute right-4 top-[calc(50%+4px)] -translate-y-1/2 text-xs text-[#9AA5AF]">
                          cm
                        </span>
                      </div>
                    </label>

                    <label className="text-sm font-semibold text-[#34414D]">
                      Weight

                      <div className="relative">
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
                          className="input mt-2 pr-14"
                        />

                        <span className="pointer-events-none absolute right-4 top-[calc(50%+4px)] -translate-y-1/2 text-xs text-[#9AA5AF]">
                          kg
                        </span>
                      </div>
                    </label>

                    <label className="text-sm font-semibold text-[#34414D]">
                      Sex

                      <input
                        value={profile.sex}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            sex: e.target.value,
                          })
                        }
                        className="input mt-2"
                        maxLength={40}
                      />
                    </label>

                    <div>
                      <p className="text-sm font-semibold text-[#34414D]">
                        Experience
                      </p>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {experiences.map(
                          ([value, label]) => {
                            const active =
                              profile.experience_level ===
                              value;

                            return (
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
                                className={`rounded-xl border px-3 py-3 text-xs font-semibold transition sm:text-sm ${
                                  active
                                    ? "border-[#08A6A6] bg-[#08A6A6]/10 text-[#078B8B]"
                                    : "border-[#E2E8E5] bg-[#F8FAF9] text-[#66727F] hover:border-[#08A6A6]/30"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* TRAINING */}

              <section className="mt-8">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7657F6]/10">
                    <Dumbbell
                      size={17}
                      className="text-[#7657F6]"
                    />
                  </span>

                  <div>
                    <p className="eyebrow text-[#7657F6]">
                      Training
                    </p>

                    <h2 className="font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                      Your training setup
                    </h2>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#E7ECEA] bg-white p-5 shadow-sm sm:p-6">
                  <div className="space-y-7">
                    {/* GOAL */}

                    <div>
                      <p className="text-sm font-semibold text-[#34414D]">
                        Fitness goal
                      </p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {goals.map(
                          ([value, label]) => {
                            const active =
                              preferences.goal ===
                              value;

                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  setPreferences({
                                    ...preferences,
                                    goal: value,
                                  })
                                }
                                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                                  active
                                    ? "border-[#7657F6] bg-[#7657F6]/8 text-[#6446E8]"
                                    : "border-[#E2E8E5] bg-[#F8FAF9] text-[#66727F] hover:border-[#7657F6]/30"
                                }`}
                              >
                                <span>
                                  {label}
                                </span>

                                {active && (
                                  <Check
                                    size={16}
                                    className="text-[#7657F6]"
                                  />
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* EQUIPMENT */}

                    <div>
                      <p className="text-sm font-semibold text-[#34414D]">
                        Equipment
                      </p>

                      <p className="mt-1 text-xs text-[#9AA5AF]">
                        Select everything you can train
                        with.
                      </p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {equipmentOptions.map(
                          ([value, label]) => {
                            const active =
                              preferences.equipment.includes(
                                value
                              );

                            return (
                              <label
                                key={value}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                  active
                                    ? "border-[#08A6A6] bg-[#08A6A6]/8 text-[#078B8B]"
                                    : "border-[#E2E8E5] bg-[#F8FAF9] text-[#66727F] hover:border-[#08A6A6]/30"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() =>
                                    toggleEquipment(
                                      value
                                    )
                                  }
                                  className="h-4 w-4 accent-[#08A6A6]"
                                />

                                <span>
                                  {label}
                                </span>

                                {active && (
                                  <Check
                                    size={15}
                                    className="ml-auto text-[#08A6A6]"
                                  />
                                )}
                              </label>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* LOCATION */}

                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={16}
                          className="text-[#08A6A6]"
                        />

                        <p className="text-sm font-semibold text-[#34414D]">
                          Workout location
                        </p>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {locations.map(
                          ([value, label]) => {
                            const active =
                              preferences.workout_location ===
                              value;

                            return (
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
                                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                  active
                                    ? "border-[#08A6A6] bg-[#08A6A6]/10 text-[#078B8B]"
                                    : "border-[#E2E8E5] bg-[#F8FAF9] text-[#66727F] hover:border-[#08A6A6]/30"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* SCHEDULE */}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-[#34414D]">
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
                          className="input mt-2"
                        />
                      </label>

                      <label className="text-sm font-semibold text-[#34414D]">
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
                          className="input mt-2"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* ACTIONS */}

              <section className="mt-8">
                <div className="rounded-3xl border border-[#E7ECEA] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={saving}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#08A6A6] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#078F8F] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save
                        size={17}
                        className="mr-2"
                      />

                      {saving
                        ? "Saving changes..."
                        : "Save changes"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#E0E6E3] bg-[#F8FAF9] px-5 py-3.5 text-sm font-bold text-[#66727F] transition hover:border-[#CBD5D1] hover:text-[#17212B] disabled:opacity-60"
                    >
                      <X
                        size={17}
                        className="mr-2"
                      />

                      Cancel
                    </button>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* =================================================
                  PROFILE SUMMARY
              ================================================= */}

              <section className="mt-8">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                    <UserRound
                      size={17}
                      className="text-[#08A6A6]"
                    />
                  </span>

                  <div>
                    <p className="eyebrow">
                      Personal
                    </p>

                    <h2 className="font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                      About you
                    </h2>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#E7ECEA] bg-white p-5 shadow-sm sm:p-6">
                  <div className="grid gap-0 sm:grid-cols-2">
                    <div className="border-b border-[#EDF1EF] py-4 sm:pr-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Name
                      </p>

                      <p className="mt-1 font-semibold text-[#17212B]">
                        {profile.name || "—"}
                      </p>
                    </div>

                    <div className="border-b border-[#EDF1EF] py-4 sm:pl-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Experience
                      </p>

                      <p className="mt-1 font-semibold capitalize text-[#17212B]">
                        {profile.experience_level ||
                          "—"}
                      </p>
                    </div>

                    <div className="border-b border-[#EDF1EF] py-4 sm:pr-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Age
                      </p>

                      <p className="metric mt-1 text-sm font-semibold text-[#17212B]">
                        {profile.age
                          ? `${profile.age} years`
                          : "—"}
                      </p>
                    </div>

                    <div className="border-b border-[#EDF1EF] py-4 sm:pl-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Sex
                      </p>

                      <p className="mt-1 font-semibold capitalize text-[#17212B]">
                        {profile.sex || "—"}
                      </p>
                    </div>

                    <div className="py-4 sm:pr-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Height
                      </p>

                      <p className="metric mt-1 text-sm font-semibold text-[#17212B]">
                        {profile.height_cm
                          ? `${profile.height_cm} cm`
                          : "—"}
                      </p>
                    </div>

                    <div className="py-4 sm:pl-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Weight
                      </p>

                      <p className="metric mt-1 text-sm font-semibold text-[#17212B]">
                        {profile.weight_kg
                          ? `${profile.weight_kg} kg`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  TRAINING SUMMARY
              ================================================= */}

              <section className="mt-8">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7657F6]/10">
                    <Sparkles
                      size={17}
                      className="text-[#7657F6]"
                    />
                  </span>

                  <div>
                    <p className="eyebrow text-[#7657F6]">
                      Training
                    </p>

                    <h2 className="font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                      Your setup
                    </h2>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#E7ECEA] bg-white p-5 shadow-sm sm:p-6">
                  <div className="grid gap-0 sm:grid-cols-2">
                    <div className="border-b border-[#EDF1EF] py-4 sm:pr-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Goal
                      </p>

                      <p className="mt-1 font-semibold capitalize text-[#17212B]">
                        {preferences.goal.replaceAll(
                          "_",
                          " "
                        ) || "—"}
                      </p>
                    </div>

                    <div className="border-b border-[#EDF1EF] py-4 sm:pl-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Workout location
                      </p>

                      <p className="mt-1 font-semibold capitalize text-[#17212B]">
                        {preferences.workout_location ||
                          "—"}
                      </p>
                    </div>

                    <div className="border-b border-[#EDF1EF] py-4 sm:pr-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Training schedule
                      </p>

                      <p className="metric mt-1 text-sm font-semibold text-[#17212B]">
                        {preferences.days_per_week
                          ? `${preferences.days_per_week} days / week`
                          : "—"}
                      </p>
                    </div>

                    <div className="border-b border-[#EDF1EF] py-4 sm:pl-6">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Session duration
                      </p>

                      <p className="metric mt-1 text-sm font-semibold text-[#17212B]">
                        {preferences.session_duration_minutes
                          ? `${preferences.session_duration_minutes} min`
                          : "—"}
                      </p>
                    </div>

                    <div className="py-4 sm:col-span-2">
                      <p className="text-xs font-medium text-[#9AA5AF]">
                        Equipment
                      </p>

                      {preferences.equipment.length >
                      0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {preferences.equipment.map(
                            (equipment: string) => (
                              <span
                                key={equipment}
                                className="rounded-full border border-[#08A6A6]/15 bg-[#08A6A6]/8 px-3 py-1.5 text-xs font-semibold capitalize text-[#078B8B]"
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
                        <p className="mt-1 text-sm text-[#66727F]">
                          —
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  PROFILE INSIGHT
              ================================================= */}

              <section className="relative mt-8 overflow-hidden rounded-3xl border border-[#7657F6]/10 bg-[#F5F2FF] p-5 sm:p-6">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#7657F6]/10"
                />

                <div className="relative flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                    <Sparkles
                      size={19}
                      className="text-[#7657F6]"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7657F6]">
                      Personalization
                    </p>

                    <h3 className="mt-2 font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
                      Your training is built around you
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#66727F]">
                      FORM//COACH uses your goals,
                      equipment, schedule, and training
                      experience to shape your workouts.
                    </p>
                  </div>
                </div>
              </section>

              {/* =================================================
                  ACCOUNT
              ================================================= */}

              <section className="mt-8">
                <div className="mb-3">
                  <p className="eyebrow">
                    Account
                  </p>

                  <h2 className="mt-1 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                    Account settings
                  </h2>
                </div>

                <div className="rounded-3xl border border-[#E7ECEA] bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-medium text-[#9AA5AF]">
                    Signed in as
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold text-[#17212B]">
                    {email || "Account"}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={startEditing}
                      className="inline-flex items-center justify-center rounded-xl bg-[#08A6A6] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#078F8F] sm:hidden"
                    >
                      Edit profile
                    </button>

                    <Link
                      href="/reset-password"
                      className="inline-flex items-center justify-center rounded-xl border border-[#E0E6E3] bg-[#F8FAF9] px-5 py-3 text-sm font-bold text-[#66727F] transition hover:border-[#CBD5D1] hover:text-[#17212B]"
                    >
                      Reset password
                    </Link>

                    <Link
                      href="/home"
                      className="inline-flex items-center justify-center rounded-xl border border-[#E0E6E3] bg-[#F8FAF9] px-5 py-3 text-sm font-bold text-[#66727F] transition hover:border-[#CBD5D1] hover:text-[#17212B]"
                    >
                      Back to training
                    </Link>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* =================================================
              MOBILE BACK
          ================================================= */}

          <div className="mt-8 flex justify-center sm:hidden">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#66727F]"
            >
              <ArrowLeft size={16} />
              Back home
            </Link>
          </div>

          <div className="pb-10 pt-8 text-center">
            <p className="text-xs text-[#A4AEA9]">
              FORM//COACH uses your profile to personalize
              your training experience.
            </p>
          </div>
        </div>
      </main>
    </AppShell>
  );
}