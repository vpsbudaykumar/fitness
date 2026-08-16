import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = process.env.E2E_RUN === "true" && Boolean(url && anonKey);
test.skip(!configured, "requires a configured, real Supabase E2E project");

async function account() {
  const client = createClient(url!, anonKey!);
  const email = `rls-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const password = "A-test-password-123";
  const { data, error } = await client.auth.signUp({ email, password });
  if (error || !data.user || !data.session) throw new Error(error?.message ?? "Test project must disable email confirmation.");
  return { client, id: data.user.id };
}

test("RLS prevents one user from reading or changing another user's profile", async () => {
  const a = await account(); const b = await account();
  const { data: foreignProfile, error: readError } = await b.client.from("profiles").select("id").eq("id", a.id);
  expect(readError).toBeNull(); expect(foreignProfile).toEqual([]);
  const { error: updateError } = await b.client.from("profiles").update({ name: "Not allowed" }).eq("id", a.id);
  expect(updateError).not.toBeNull();
});
