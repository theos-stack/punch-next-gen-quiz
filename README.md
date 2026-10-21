# PUNCH NextGen Quiz & Rewards

A student learning platform where students can take short quizzes, track progress, and earn recognition. This repository contains the Phase 1 foundation and the Phase 2 quiz engine. XP awards, badges, and leaderboards remain planned for Phase 3.

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
- A nullable `xp_awarded_at` attempt marker is reserved for Phase 3; rewards are not implemented

## Architecture

`app/` contains pages and route handlers. Supabase clients are split between browser and server contexts in `lib/supabase/`. `proxy.ts` refreshes cookie-backed sessions. The dashboard verifies the access token with `getClaims()` before rendering and reads the profile through the user's RLS-scoped Supabase client.

The database migrations create `public.profiles`, enable RLS, grant only profile select and full-name update, and create a trigger to make a profile row when Supabase Auth creates an account. The Phase 2 migration adds published quizzes, questions, private answer keys, attempts, and submitted answers. Its security-definer RPCs verify the signed-in user, validate submissions, and calculate scores inside the database transaction. Supabase Auth remains the source of identity and password storage.

## Local setup

1. Install Node.js 20.9 or later and npm.
2. Clone the repository and install packages:

   ```bash
   npm install
   ```

3. Create a Supabase project. Copy `.env.example` to `.env.local` and enter the project's URL and publishable key. Do not use a service-role key in the browser or this application's environment.
4. Link the Supabase CLI to the project (`npx supabase login`, then `npx supabase link --project-ref <project-ref>`). Preview and apply migrations with `npm run db:push:dry-run` and `npm run db:push`. The tracked migrations create the profile table/trigger/policies and the quiz engine schema/seed quiz.
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

Phase 2 adds `public.quizzes`, `public.questions`, `public.quiz_attempts`, and `public.submitted_answers`. Correct choices are stored in `private.quiz_answer_keys`, which is not granted to client roles and must remain outside Supabase's exposed API schemas. The `start_quiz_attempt` and `submit_quiz_attempt` RPCs are executable by authenticated users only. The submit RPC locks the attempt, requires one valid answer for every question, checks each option against the quiz, records correctness, and completes the attempt atomically. Only the owner can read their attempts and answer records through RLS.

## Validation and testing

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run test` covers malformed and duplicate submission payloads. Database/RLS integration checks require the linked Supabase database and test identities; do not treat the unit tests as proof of live policies or transaction behavior.

To manually verify authentication, try registration, email confirmation, login, dashboard access, logout, and opening `/dashboard` in a signed-out browser. A real Supabase project and applied migration are required for end-to-end auth and RLS verification.

## Security decisions

- Password handling is delegated to Supabase Auth; the application never stores passwords.
- Credentials are validated in the API Route Handlers as well as by browser form attributes.
- Authentication cookies are managed by `@supabase/ssr`; the dashboard verifies claims server-side.
- Student profile access is limited by PostgreSQL RLS and column-level update grants.
- Only a Supabase publishable key is used. No service-role secret is included.

## Current limitations

- The Phase 2 migration and live Supabase RLS/transaction behavior must be verified against the target project before release.
- XP, badges, and leaderboard are not implemented; the attempt table only reserves the future XP-award marker.
- Email delivery and authentication behavior depend on Supabase project settings.

## Deployment

Not deployed yet. Add the two environment variables above to the Vercel project, configure the production Supabase Site URL and `/auth/callback` redirect URL, apply the migration, then deploy.

## AI assistance disclosure

OpenAI Codex assisted with project setup, implementation, debugging, and documentation. The project owner is responsible for reviewing, understanding, and explaining the submitted work. This disclosure reflects the actual development process; it does not claim that all code was written manually.
