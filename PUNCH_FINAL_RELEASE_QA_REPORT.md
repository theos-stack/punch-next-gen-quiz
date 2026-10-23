# PUNCH NextGen — Final Release QA Report

**Updated:** 23 October 2026 (WAT)
**Repository:** `theos-stack/punch-next-gen-quiz`
**Supabase project:** `syoyadobmvrckqkmbnmq`  
**Assessment readiness:** **Not ready for submission; Preview is live, but authenticated and database verification is blocked.**

## Preview deployment

- Vercel project: `theos-stacks-projects/punch-next-gen-quiz`, connected to GitHub repository `theos-stack/punch-next-gen-quiz`.
- Live Preview: [qa-preview deployment](https://punch-next-gen-quiz-git-qa-preview-theos-stacks-projects.vercel.app/)
- Unique deployment URL: [deployment](https://punch-next-gen-quiz-q8mvi9gbd-theos-stacks-projects.vercel.app/)
- Vercel marked deployment **Ready**, environment **Preview**, branch `qa-preview`, commit [`df41296`](https://github.com/theos-stack/punch-next-gen-quiz/commit/df41296651a979371819f5ac5c4ac5d6967856b3). Vercel showed a successful build.
- Deployment ID: `CsXjMLwwbUz54EYeSeXKBR4YFc4c`.
- The Preview was triggered through the connected Git integration using a branch-restricted deployment hook after the dashboard's manual form would not enable `qa-preview`. The hook was revoked immediately after use. No hook URL or credential is retained in this report.
- Project Settings showed GitHub connected, Production branch tracking set to `main`, and Preview tracking unassigned Git branches. The overview showed no Production deployment. No production domain or production deployment was created.
- `vercel.json` disables deployments for all branches except `qa-preview`; `main` is explicitly disabled. JSON was validated locally. Safeguard commit: [`bf47128`](https://github.com/theos-stack/punch-next-gen-quiz/commit/bf4712801186381606d9a08d520b23939f7f518d).
- The two required Supabase Preview variables were present and masked in Vercel settings: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Values were not viewed or recorded. `.env.local` and Vercel local configuration remain ignored; no environment file was committed.

## Browser checks actually completed

The stable Preview URL loaded in the browser. The landing page, `/login`, and `/register` rendered. The login form exposed email/password fields, and the registration form exposed name/email/password fields.

- Direct unauthenticated access to `/dashboard` redirected to `/login?next=/dashboard`.
- A single request using a deliberately fabricated invalid address and password returned the expected generic login error; Vercel request logs showed `POST /api/auth/login` with HTTP 401. This confirms the unauthenticated error path only; it does not verify a real student's credentials or a successful Supabase login.
- Landing, login, and registration pages returned successful page responses. No Preview runtime log entries appeared during the observed checks. Browser-console inspection was not available through the connected browser controls.
- An on-screen landing-page capture was viewed during QA, but no screenshot file was saved as release evidence. The requested 375px, 390px, 768px, and 1440px captures and complete authenticated flow were not performed.

## Supabase authentication and live data: blocked

The currently signed-in Supabase dashboard identity was denied access to project `syoyadobmvrckqkmbnmq` and redirected to the organization projects page with “You do not have access to this project.” The isolated Supabase CLI runs without a protected-profile telemetry write, but `supabase migration list` then stopped because no CLI access token is available. No token was found at the expected CLI token path. No credentials were printed.

The repository's callback at `app/auth/callback/route.ts` exchanges the PKCE `code`, restricts `next` to a local relative path, and sends failed exchanges to `/login?message=confirmation-failed`. Registration builds its email redirect as `/auth/callback?next=/dashboard`. These are source-code observations, not successful live callback tests.

The Preview callback URL that needs to be allowed in Supabase Auth is:

`https://punch-next-gen-quiz-git-qa-preview-theos-stacks-projects.vercel.app/auth/callback`

No redirect allowlist or Site URL changes were made, so the existing localhost configuration was not touched. Email confirmation, PKCE exchange, successful login/logout, session persistence, profile/quiz requests, cross-student RLS, rewards, leaderboard, and attempt history are **not verified on this Preview**. No test inboxes or authenticated student sessions were available. No reciprocal RLS check is claimed here.

**Action needed to unblock:** grant the Supabase dashboard identity currently in use access to project `syoyadobmvrckqkmbnmq` (or sign in to the project-owning Supabase account), then confirm when the project's Auth URL Configuration page is accessible. For student-flow testing, provide authorized test sessions/inboxes through the existing secure sign-in flow; do not send passwords or one-time links in chat.

## Automated checks

The application source used by the deployment is the same as commit `f606403`; `df41296` only records QA checks. On that source baseline:

| Check | Result |
| --- | --- |
| ESLint (`npm run lint`) | Passed |
| TypeScript (`npm run typecheck`) | Passed |
| Unit tests (`npm run test`) | Passed: 3 tests, 0 failures |
| Production build (`npm run build`) | Passed: optimized Next.js build and route generation |
| Vercel Preview build | Passed; deployment state Ready |
| Database tests (`npm run test:db`) | Blocked: local PostgreSQL at `127.0.0.1:54322` refused the connection (`ECONNREFUSED`); pgTAP did not execute |
| Browser integration and responsive screenshots | Incomplete; only public pages, unauthenticated redirect, and invalid-login path were checked |

The previously recorded live-database evidence remains in [`PUNCH_FINAL_INTEGRATION_REPORT.md`](./PUNCH_FINAL_INTEGRATION_REPORT.md); it is not a substitute for the requested authenticated browser verification on this Preview.

## Git and disclosure

- Remote `main` was verified at `f606403c7114e9d16a64728e7bc22f17512bcf28` before the latest QA update.
- Remote `qa-preview` is at [`df41296`](https://github.com/theos-stack/punch-next-gen-quiz/commit/df41296651a979371819f5ac5c4ac5d6967856b3).
- Deployment safeguard: [`bf47128`](https://github.com/theos-stack/punch-next-gen-quiz/commit/bf4712801186381606d9a08d520b23939f7f518d).
- Prior QA/report commit: [`77f1b31`](https://github.com/theos-stack/punch-next-gen-quiz/commit/77f1b3175ef2486a474ba2a4ebaba592407f5b73).
- Verified Git author: Samuel Ojo (`ojoadeoluwasam@gmail.com`). Existing AI-assistance disclosure in README remains intact. No application source fixes were needed during Preview setup.

## Readiness

The connected Vercel Preview is live and its deployment is explicitly classified as **Preview**. The `main` branch deployment safeguard is present. Local lint, typecheck, unit tests, and production build pass.

**Do not submit the assessment yet.** Live authentication and database-backed student workflows remain unverified because the active Supabase identity lacks access to the target project and no test student sessions/inboxes are available. Responsive viewport screenshots and browser-console verification also remain outstanding. No Production deployment was made.
