# Fitness Coach — Phase 1 foundation

This Phase 1 implementation provides Supabase email/password authentication,
profile provisioning, protected routes, an onboarding flow, contraindication
intake, and a database-enforced readiness gate. Workout generation, AI,
marketplace, nutrition, wearables, payments, and native app projects are not
part of this phase.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Copy `.env.local.example` to `.env.local`, then provide the project URL and
   anon key. Do not commit `.env.local`.
3. In Supabase Auth URL configuration, add both
   `http://localhost:3000/auth/callback` and the deployed equivalent.
4. Run `npm install`, then `npm run dev`.

Required browser-visible values are `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`; the anon key is protected by RLS. This phase
does not require a service-role or AI key. Never put server-only secrets in a
`NEXT_PUBLIC_` variable.

## Security model

Middleware sends unauthenticated visitors to `/login` and prevents users with
no cleared readiness record from accessing application routes. The browser has
no insert/update policy for `readiness_screening`; authenticated onboarding
uses the `complete_onboarding` database function, which validates all fields
and derives `cleared` from the answers and a self-attested acknowledgement.
That acknowledgement is not medical verification, diagnosis, or advice.

RLS scopes private records to `auth.uid()`, including workout child tables.
The workout tables exist as future data foundations only; there is no workout
product in this phase.

## Checks

```
npm run typecheck
npm run lint
npm test
```

Playwright browser tests are real integration tests. They require an isolated
Supabase project, its URL/anon key in `.env.local`, email confirmation disabled
for test-only signups, `E2E_RUN=true`, and `npx playwright install`. The tests
create their own users; never point them at a production project.
