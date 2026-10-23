# PUNCH NextGen

PUNCH NextGen is a student quiz and rewards platform. Students can practise with short quizzes, review saved results, track their progress, earn XP and badges, and compare scores on a privacy-conscious leaderboard.

[Open PUNCH NextGen](https://punch-next-gen-quiz.vercel.app/)

## What’s included

- Email and Google sign-in, email confirmation, and protected student pages.
- A quiz catalogue with multiple-choice quizzes, answer review, and saved results.
- Server-side scoring and database-backed attempts; answer keys stay private.
- 10 XP per correct answer, awarded once per completed quiz.
- Quiz Starter and High Scorer badges, awarded by the database.
- A leaderboard showing public display names, rank, XP, and completed quiz counts.
- A student dashboard, achievements, account settings, and responsive navigation.

## Technology

- Next.js App Router, React, and TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Vercel

## Run locally

1. Install Node.js 20.9 or later.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a Supabase project and copy `.env.example` to `.env.local`. Set the project URL and publishable key. Keep service-role keys and other secrets out of client-side configuration and source control.
4. Start the app:

   ```bash
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000).

To apply the committed migrations to a linked Supabase project, authenticate and link the project first. Review the migration plan before applying it:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npm run db:status
npm run db:push:dry-run
npm run db:push
```

The database integration tests use a local Supabase database; start the local stack with `npx supabase start` before running `npm run test:db`.

Configure Supabase Auth’s local site URL as `http://localhost:3000` and allow the local callback URL `http://localhost:3000/auth/callback`. Add deployment callback URLs in the Supabase Auth redirect allowlist when configuring another environment.

## Environment variables

| Variable | Purpose | Public |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; database access is controlled by RLS | Yes |

Never commit `.env.local`, credentials, access tokens, or Supabase service-role keys.

## Data and security

Supabase Auth manages student identity. A database trigger creates each student’s profile. Row-level security scopes profiles, quiz attempts, answers, and rewards to the authenticated student. Quiz answer keys are stored in a private schema; a database function validates submissions, calculates scores, completes attempts, and allocates rewards transactionally. The leaderboard exposes only approved public fields and does not return email addresses.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run test:db` runs the database integration suite and requires a running local Supabase database (Docker is required by the local Supabase stack). Local tests do not replace verification against a remote Supabase project or a real email-confirmation flow.

## AI-use disclosure

Samuel Ojo is the project author and directed its product reasoning, application architecture, backend structure and logic, frontend and backend implementation, and API integration. OpenAI Codex designed the interface in collaboration with Samuel and generated or modified substantial portions of the application code, including frontend, backend, and API-consumption work. Codex also supported testing, debugging, documentation, and project summaries. Samuel reviewed the work and remains responsible for the application.
