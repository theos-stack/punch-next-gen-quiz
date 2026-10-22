# PUNCH NextGen Quiz & Rewards

A student learning platform where students can take short quizzes, track progress, and earn recognition. This repository contains the Phase 1 foundation, Phase 2 quiz engine, and Phase 3 rewards and leaderboard implementation.

## Technology

- Next.js App Router and TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Next.js Route Handlers for registration, login, and logout
- Vercel-ready deployment configuration

## Phase 1 features

- Responsive landing, registration, and login screens
- Supabase email/password registration and login
- Email confirmation callback support
- Protected, server-rendered student dashboard
- Student profile row created from the Supabase Auth user record
- Profile row-level security: a student can read or update only their own profile
- Logout and clear validation/error feedback

## Phase 2 features

- Authenticated catalog of published quizzes and a multiple-choice quiz runner
- Persistent quiz attempts, submitted answers, scores, and attempt history
- Server-side scoring in a PostgreSQL function; the browser never receives the answer key
- Private `quiz_answer_keys` table in a non-exposed schema
- Row-level security for attempts and submitted answers
- Atomic submission: answer rows and final score are written together, and repeated submissions cannot score an attempt twice
- XP awards are recorded once per completed attempt at 10 XP per correct answer
- Quiz Starter and High Scorer badges are awarded by the database with per-student uniqueness
- Authenticated leaderboard ranks students by XP without returning email addresses
- Dashboard totals, badges, recent attempts, and leaderboard use database results
- Authenticated student pages include compact mobile navigation and a dashboard XP summary
- Quiz takers can review their answers and unanswered questions before the final submission

## Architecture

`app/` contains pages and route handlers. Supabase clients are split between browser and server contexts in `lib/supabase/`. `proxy.ts` refreshes cookie-backed sessions. The dashboard verifies the access token with `getClaims()` before rendering and reads the profile through the user's RLS-scoped Supabase client.

The database migrations create `public.profiles`, enable RLS, grant only profile select and full-name update, and create a trigger to make a profile row when Supabase Auth creates an account. The Phase 2 migration adds published quizzes, questions, private answer keys, attempts, and submitted answers. The Phase 3 migration adds XP, badges, and an authenticated leaderboard. The security-definer RPCs validate submissions, calculate scores, and award rewards inside the database transaction. Supabase Auth remains the source of identity and password storage.

## Local setup

1. Install Node.js 20.9 or later and npm.
2. Clone the repository and install packages:

   ```bash
   npm install
   ```

3. Create a Supabase project. Copy `.env.example` to `.env.local` and enter the project's URL and publishable key. Do not use a service-role key in the browser or this application's environment.
4. Link the Supabase CLI to the project (`npx supabase login`, then `npx supabase link --project-ref <project-ref>`). Preview and apply migrations with `npm run db:push:dry-run` and `npm run db:push`. The tracked migrations create the profile table/trigger/policies, quiz engine, and Phase 3 rewards.
5. In Supabase Auth URL configuration, set the local Site URL to `http://localhost:3000` and allow `http://localhost:3000/**` so the confirmation callback with its `next` query parameter is accepted. Add the production origin and `/auth/callback` pattern when deploying.
6. Start the app:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:3000`, register with a fictitious student account, confirm the email if confirmation is enabled, then log in.

## Environment variables

| Name | Purpose | Browser-visible? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, protected by RLS | Yes |

Never commit `.env.local`, passwords, access tokens, or service-role keys. The `.gitignore` excludes local environment files and build output.

## Database schema

`public.profiles` has `id` (the matching `auth.users.id`), `full_name`, and `created_at`. RLS is enabled. Authenticated users receive select and `full_name` update privileges, with policies matching `auth.uid()` to the row id. A security-definer trigger function uses an empty `search_path` and qualified table names to create the profile row.

Phase 2 adds `public.quizzes`, `public.questions`, `public.quiz_attempts`, and `public.submitted_answers`. Phase 3 adds `public.xp_awards`, `public.badge_definitions`, and `public.student_badges`. Correct choices are stored in `private.quiz_answer_keys`, which is not granted to client roles and must remain outside Supabase's exposed API schemas. Authenticated-only database functions validate submissions, calculate scores, award XP and badges, and return a privacy-limited leaderboard. Attempt, answer, XP, and badge rows are scoped by RLS. Completion and reward writes share a database transaction.

## Validation and testing

```bash
npm run lint
npm run typecheck
npm run test
npm run test:db
npm run build
```

`npm run test` covers request validation. `npm run test:db` runs the pgTAP reward, badge, ownership, and leaderboard checks against the local Supabase database; Docker and a running local Supabase database are required. It does not prove the remote project is migrated or live account email flows work.

To manually verify authentication, try registration, email confirmation, login, dashboard access, logout, and opening `/dashboard` in a signed-out browser. A real Supabase project and applied migration are required for end-to-end auth and RLS verification.

## Security decisions

- Password handling is delegated to Supabase Auth; the application never stores passwords.
- Credentials are validated in the API Route Handlers as well as by browser form attributes.
- Authentication cookies are managed by `@supabase/ssr`; the dashboard verifies claims server-side.
- Student profile access is limited by PostgreSQL RLS and column-level update grants.
- Only a Supabase publishable key is used. No service-role secret is included.

## Current verification status

- The repair migration, server-side quiz scoring, XP/badge allocation, duplicate rejection, and a simultaneous duplicate-submission test were verified against the assessment Supabase project. See [`PUNCH_FINAL_INTEGRATION_REPORT.md`](./PUNCH_FINAL_INTEGRATION_REPORT.md).
- The mobile app navigation, dashboard summary, and pre-submit answer review have been implemented. They still require visual browser QA at the documented viewport widths.
- A dedicated Vercel project and its Preview Supabase variables are configured. Vercel CLI deployments were unexpectedly assigned to Production and removed; there is no active Preview deployment. See [`PUNCH_FINAL_RELEASE_QA_REPORT.md`](./PUNCH_FINAL_RELEASE_QA_REPORT.md) for the exact blocker and next step.
- The authenticated end-to-end browser journey, reciprocal student RLS check, exact callback redirect allowlist, and local pgTAP suite remain unverified. The previous UI checkpoint is [`PUNCH_RELEASE_CANDIDATE_REPORT.md`](./PUNCH_RELEASE_CANDIDATE_REPORT.md).
- Email delivery and callback behavior depend on the Supabase project settings.

## Deployment

The local checkout is linked to the dedicated Vercel project, with the two publishable Supabase environment variables set for Preview. A valid Preview URL is not available yet because the CLI keeps assigning the first deployment to Production. No Git repository integration or automatic deployment from `main` is enabled. Add the eventual Preview callback URL to Supabase Auth after Vercel produces one. Production deployment requires a separate review.

## AI assistance disclosure

OpenAI Codex assisted with project setup, implementation, debugging, and documentation. The project owner is responsible for reviewing, understanding, and explaining the submitted work. This disclosure reflects the actual development process; it does not claim that all code was written manually.
