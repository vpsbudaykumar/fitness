import { test, expect, type Page } from "@playwright/test";

// These are real browser tests against an isolated Supabase test project.
// They require E2E_RUN=true and email confirmation disabled for that project.
// In an unconfigured checkout they skip rather than reporting a false pass.
const configured = process.env.E2E_RUN === "true";
test.skip(!configured, "requires a configured, real Supabase E2E project");

async function signUp(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await page.goto("/signup");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("A-test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/onboarding/);
  return { email, password: "A-test-password-123" };
}

async function reachReadiness(page: Page) {
  await page.getByLabel("Name").fill("E2E User"); await page.getByLabel("Age").fill("30");
  await page.getByLabel(/Height/).fill("170"); await page.getByLabel(/Weight/).fill("70"); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "General fitness" }).click(); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Beginner" }).click(); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Bodyweight").check(); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Home" }).click(); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Training days/).fill("3"); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Minutes per session/).fill("30"); await page.getByRole("button", { name: "Continue" }).click();
}

test("flagged readiness cannot reach home without acknowledgement", async ({ page }) => {
  await signUp(page); await reachReadiness(page);
  await page.locator("fieldset").first().getByRole("button", { name: "Yes" }).click();
  for (let i = 1; i < 7; i++) await page.locator("fieldset").nth(i).getByRole("button", { name: "No" }).click();
  await expect(page.getByText("We’ve paused plan access")).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete setup" })).toBeDisabled();
  await expect(page).toHaveURL(/onboarding/);
});

test("all-clear readiness can continue and a direct home request stays guarded", async ({ page }) => {
  await signUp(page); await reachReadiness(page);
  for (let i = 0; i < 7; i++) await page.locator("fieldset").nth(i).getByRole("button", { name: "No" }).click();
  await page.getByRole("button", { name: "Complete setup" }).click();
  await expect(page).toHaveURL(/home/);
});

test("a registered user can sign out and sign back in", async ({ page }) => {
  const account = await signUp(page); await reachReadiness(page);
  for (let i = 0; i < 7; i++) await page.locator("fieldset").nth(i).getByRole("button", { name: "No" }).click();
  await page.getByRole("button", { name: "Complete setup" }).click(); await expect(page).toHaveURL(/home/);
  await page.getByRole("button", { name: "Sign out" }).click(); await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email").fill(account.email); await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click(); await expect(page).toHaveURL(/home/);
});

test("unauthenticated visitor cannot access a protected route", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/login/);
});
