"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Search,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

type AppRole = "user" | "trainee" | "admin" | "owner";

type Profile = {
  id: string;
  name: string | null;
  role: AppRole;
  created_at: string;
};

const ROLE_LABELS: Record<AppRole, string> = {
  user: "User",
  trainee: "Trainee",
  admin: "Admin",
  owner: "Owner",
};

function roleBadge(role: AppRole) {
  if (role === "owner") {
    return "border-[#7657F6]/20 bg-[#7657F6]/10 text-[#6446E8]";
  }

  if (role === "admin") {
    return "border-[#08A6A6]/20 bg-[#08A6A6]/10 text-[#078B8B]";
  }

  if (role === "trainee") {
    return "border-[#F1A74B]/20 bg-[#F1A74B]/10 text-[#B87416]";
  }

  return "border-[#E0E6E3] bg-[#F8FAF9] text-[#66727F]";
}

function roleIcon(role: AppRole) {
  if (role === "owner") {
    return <ShieldCheck size={15} />;
  }

  if (role === "admin") {
    return <ShieldCheck size={15} />;
  }

  if (role === "trainee") {
    return <UserRoundCheck size={15} />;
  }

  return <UserRound size={15} />;
}

export default function AdminUsersPage() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [currentUserId, setCurrentUserId] =
    useState<string>("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<"all" | AppRole>("all");

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCurrentUserId(user.id);

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
    setIsOwner(currentProfile.role === "owner");

    const { data, error: profilesError } =
      await supabase
        .from("profiles")
        .select("id, name, role, created_at")
        .order("created_at", {
          ascending: false,
        });

    if (profilesError) {
      setError(profilesError.message);
      setLoading(false);
      return;
    }

    setProfiles(
      (data ?? []) as Profile[]
    );

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function changeRole(
    profile: Profile,
    newRole: AppRole
  ) {
    if (!isOwner) {
      return;
    }

    if (profile.id === currentUserId) {
      setError(
        "You cannot change your own Owner role."
      );
      return;
    }

    if (profile.role === newRole) {
      return;
    }

    setSavingId(profile.id);
    setError("");
    setMessage("");

    const { error: updateError } =
      await supabase
        .from("profiles")
        .update({
          role: newRole,
        })
        .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    setProfiles((current) =>
      current.map((item) =>
        item.id === profile.id
          ? {
              ...item,
              role: newRole,
            }
          : item
      )
    );

    setMessage(
      `${profile.name || "User"} is now ${ROLE_LABELS[newRole]}.`
    );

    setSavingId(null);
  }

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesSearch =
        !query ||
        (profile.name ?? "")
          .toLowerCase()
          .includes(query) ||
        profile.id
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "all" ||
        profile.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [profiles, search, roleFilter]);

  const counts = useMemo(() => {
    return {
      all: profiles.length,
      user: profiles.filter(
        (profile) => profile.role === "user"
      ).length,
      trainee: profiles.filter(
        (profile) => profile.role === "trainee"
      ).length,
      admin: profiles.filter(
        (profile) => profile.role === "admin"
      ).length,
      owner: profiles.filter(
        (profile) => profile.role === "owner"
      ).length,
    };
  }, [profiles]);

  if (loading) {
    return (
      <AppShell>
        <main className="pb-12">
          <div className="mx-auto max-w-6xl">
            <div className="animate-pulse">
              <div className="h-4 w-28 rounded bg-[#E5ECE9]" />

              <div className="mt-4 h-10 w-64 rounded-lg bg-[#E5ECE9]" />

              <div className="mt-8 h-20 rounded-2xl bg-[#E8EEEC]" />

              <div className="mt-4 h-80 rounded-2xl bg-[#E8EEEC]" />
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
              Users management is available only to
              Admin and Owner accounts.
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
              Users
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#66727F]">
              View users, manage trainee accounts, and
              control platform roles.
            </p>
          </section>

          {/* SUMMARY */}

          <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <RoleCount
              label="All"
              count={counts.all}
              active={roleFilter === "all"}
              onClick={() =>
                setRoleFilter("all")
              }
            />

            <RoleCount
              label="Users"
              count={counts.user}
              active={roleFilter === "user"}
              onClick={() =>
                setRoleFilter("user")
              }
            />

            <RoleCount
              label="Trainees"
              count={counts.trainee}
              active={roleFilter === "trainee"}
              onClick={() =>
                setRoleFilter("trainee")
              }
            />

            <RoleCount
              label="Admins"
              count={counts.admin}
              active={roleFilter === "admin"}
              onClick={() =>
                setRoleFilter("admin")
              }
            />

            <RoleCount
              label="Owners"
              count={counts.owner}
              active={roleFilter === "owner"}
              onClick={() =>
                setRoleFilter("owner")
              }
            />
          </section>

          {/* FEEDBACK */}

          {message && (
            <div className="mt-5 rounded-2xl border border-[#08A6A6]/20 bg-[#08A6A6]/10 px-4 py-3 text-sm font-medium text-[#078B8B]">
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-[#FF735C]/20 bg-[#FF735C]/10 px-4 py-3 text-sm font-medium text-[#D9513D]"
            >
              {error}
            </div>
          )}

          {/* SEARCH */}

          <section className="mt-5 rounded-2xl border border-[#E7ECEA] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA5AF]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search by name or user ID..."
                  className="input pl-11"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value as
                      | "all"
                      | AppRole
                  )
                }
                className="input sm:w-44"
              >
                <option value="all">
                  All roles
                </option>
                <option value="user">
                  Users
                </option>
                <option value="trainee">
                  Trainees
                </option>
                <option value="admin">
                  Admins
                </option>
                <option value="owner">
                  Owners
                </option>
              </select>
            </div>
          </section>

          {/* USER LIST */}

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow">
                  Directory
                </p>

                <h2 className="mt-1 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                  {filteredProfiles.length}{" "}
                  {filteredProfiles.length === 1
                    ? "account"
                    : "accounts"}
                </h2>
              </div>

              {isOwner && (
                <span className="hidden items-center gap-2 rounded-full bg-[#7657F6]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6446E8] sm:inline-flex">
                  <ShieldCheck size={13} />
                  Owner controls enabled
                </span>
              )}
            </div>

            {filteredProfiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D7DFDC] bg-white p-8 text-center">
                <Users
                  size={28}
                  className="mx-auto text-[#A4AEA9]"
                />

                <h3 className="mt-4 font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
                  No users found
                </h3>

                <p className="mt-2 text-sm text-[#66727F]">
                  Try changing your search or role
                  filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProfiles.map(
                  (profile) => {
                    const isCurrentUser =
                      profile.id === currentUserId;

                    const canChange =
                      isOwner &&
                      !isCurrentUser;

                    return (
                      <div
                        key={profile.id}
                        className="rounded-2xl border border-[#E7ECEA] bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          {/* USER */}

                          <div className="flex min-w-0 flex-1 items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F6F5]">
                              {roleIcon(
                                profile.role
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#17212B]">
                                {profile.name ||
                                  "Unnamed user"}
                              </p>

                              <p className="mt-1 truncate font-mono text-[10px] text-[#9AA5AF]">
                                {profile.id}
                              </p>
                            </div>
                          </div>

                          {/* ROLE */}

                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${roleBadge(
                                profile.role
                              )}`}
                            >
                              {roleIcon(
                                profile.role
                              )}

                              {
                                ROLE_LABELS[
                                  profile.role
                                ]
                              }
                            </span>

                            {isCurrentUser && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9AA5AF]">
                                You
                              </span>
                            )}
                          </div>

                          {/* ROLE CONTROL */}

                          {canChange ? (
                            <div className="relative lg:w-44">
                              <select
                                value={profile.role}
                                disabled={
                                  savingId ===
                                  profile.id
                                }
                                onChange={(event) =>
                                  void changeRole(
                                    profile,
                                    event.target
                                      .value as AppRole
                                  )
                                }
                                className="w-full appearance-none rounded-xl border border-[#E0E6E3] bg-[#F8FAF9] px-4 py-3 pr-10 text-sm font-semibold text-[#34414D] outline-none transition focus:border-[#08A6A6]"
                              >
                                <option value="user">
                                  User
                                </option>

                                <option value="trainee">
                                  Trainee
                                </option>

                                <option value="admin">
                                  Admin
                                </option>

                                <option value="owner">
                                  Owner
                                </option>
                              </select>

                              <ChevronDown
                                size={16}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA5AF]"
                              />

                              {savingId ===
                                profile.id && (
                                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-[#08A6A6]">
                                  Saving
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-[#A4AEA9] lg:w-44">
                              {isCurrentUser
                                ? "Your account"
                                : profile.role ===
                                    "owner"
                                  ? "Owner protected"
                                  : "View only"}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 border-t border-[#EDF1EF] pt-3 text-[10px] text-[#A4AEA9]">
                          Joined{" "}
                          {new Date(
                            profile.created_at
                          ).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* ROLE EXPLANATION */}

          <section className="mt-8 rounded-3xl border border-[#DCD5FF] bg-[#F8F6FF] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                <ShieldCheck
                  size={20}
                  className="text-[#7657F6]"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7657F6]">
                  Role model
                </p>

                <h3 className="mt-2 font-[Space_Grotesk] text-lg font-bold text-[#17212B]">
                  User → Trainee → Admin → Owner
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66727F]">
                  Trainee accounts are intended for
                  people who hire or work with a trainer.
                  Trainer relationships and live trainer
                  support will be added in a future
                  phase.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function RoleCount({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[#08A6A6]/30 bg-[#08A6A6]/10"
          : "border-[#E7ECEA] bg-white hover:border-[#08A6A6]/20"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          active
            ? "text-[#078B8B]"
            : "text-[#66727F]"
        }`}
      >
        {label}
      </p>

      <p className="metric mt-2 text-2xl font-bold text-[#17212B]">
        {count}
      </p>
    </button>
  );
}