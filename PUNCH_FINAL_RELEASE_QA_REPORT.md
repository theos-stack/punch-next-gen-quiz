# PUNCH NextGen — Final Release QA Report

**Date:** 23 October 2026 (WAT)
**Starting commit:** `f606403c7114e9d16a64728e7bc22f17512bcf28`
**Repository:** `theos-stack/punch-next-gen-quiz`  
**Supabase project:** `syoyadobmvrckqkmbnmq`  
**Status:** **GitHub is connected and the Production branch is protected, but no Preview deployment exists yet. Do not submit or deploy to Production.**

## Vercel access and project setup

- `npx vercel@latest whoami` succeeded in the authorized Windows environment. CLI version used: `65.1.0`; no global CLI was needed.
- No Vercel project was linked initially. I created and linked the dedicated project `theos-stacks-projects/punch-next-gen-quiz`.
- After the user completed Vercel two-factor sign-in, the project's **Settings → Git** page showed `theos-stack/punch-next-gen-quiz` as the connected GitHub repository.
- **Settings → Environments** showed Production branch tracking set to `main`; Preview tracks all unassigned Git branches. The project overview and deployment list showed **No Production Deployment**. The Preview deployment filter showed no deployment records.
- Added and pushed [`vercel.json`](https://github.com/theos-stack/punch-next-gen-quiz/blob/main/vercel.json) with `git.deploymentEnabled` set to disable `main` and all other branches, while allowing only `qa-preview`. The exact branch rule is `"*": false`, `"main": false`, and `"qa-preview": true`. Vercel's Git configuration documentation states unspecified branches default to enabled, so the wildcard is required to keep unrelated branches disabled. The JSON parsed successfully and the rules were inspected locally.
- The safeguard commit is [`bf47128`](https://github.com/theos-stack/punch-next-gen-quiz/commit/bf4712801186381606d9a08d520b23939f7f518d). The remote `main` and `qa-preview` branches were verified at `f606403c7114e9d16a64728e7bc22f17512bcf28` before this report update. GitHub's default branch was not changed and history was not rewritten.
- The local `.env.local` Supabase URL was checked against `syoyadobmvrckqkmbnmq`; it matched. The exact application variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are now configured for the Vercel Preview environment. Their values were not included in this report or committed.
- The local `.env.local` and `.vercel/` remain ignored. No environment file or credential was staged.

## Preview deployment status

The previous direct CLI behavior did not meet the Preview-only requirement:

1. `npx vercel@latest deploy --yes` omitted `--prod`, but Vercel returned deployment metadata with `target: production` and assigned the project's default alias. The CLI said its first deployment was assigned to Production.
2. Explicit `--target=preview` and `--environment=preview` attempts also returned `target: production`, including an attempt from a temporary non-main branch.
3. Each of the five returned Production-target deployment records was removed immediately. The Vercel CLI subsequently reported no active Production deployments; the alias listing showed no remaining project alias. No custom production domain was configured.
4. The separate supported prebuilt flow successfully pulled Preview settings and ran the Next.js production build and TypeScript checks. Vercel packaging then failed while creating a serverless-function symlink: `EPERM: operation not permitted, symlink 'login.func' -> '.vercel/output/functions/dashboard.func'`. Retrying in the authorized Windows context produced the same filesystem failure.

The CLI route is still unsuitable because it classified deployments as Production, and the prebuilt packaging flow still fails on the Windows symlink operation. I did not retry either route.

**Actual Preview URL:** none yet.
**Deployment status:** Vercel shows no Preview deployment and no Production deployment.
**Production Branch:** `main`; the repository rule disables its automatic deployment.
**Production:** no Production deployment is active.

## Git-based Preview creation

The Vercel dashboard's supported **Create Deployment** form confirmed the repository connection. Its available branch shortcuts were `main` and `codex/vercel-preview`; entering `qa-preview`, the verified remote branch name, or the full branch URL left **Create Preview Deployment** disabled. No deployment was created from that form. The manual form therefore did not resolve the `qa-preview` ref, even though GitHub reports the remote branch at `f606403c7114e9d16a64728e7bc22f17512bcf28`.

The next safe attempt is to push a substantive report update on `qa-preview`, which uses the connected Git integration and the committed branch safeguard. A Preview is not established until Vercel's deployment record explicitly identifies Environment **Preview**, branch `qa-preview`, and the expected commit. Stop if any record targets Production.

## Authentication callback and Supabase redirects

The callback implementation at `app/auth/callback/route.ts` exchanges the Supabase PKCE `code`, accepts only a local relative `next` path that begins with one slash and rejects `//`, and sends failed exchanges to `/login?message=confirmation-failed`.

There is no Preview hostname to add to Supabase Auth's redirect allowlist. I did not change the Supabase allowlist or Site URL, so existing localhost entries remain untouched. Email confirmation, PKCE exchange, login/logout, session persistence, and protected-route behavior were not exercised against a deployed Preview in this pass. Do not reuse the previously exposed one-time sign-in URL documented in the earlier integration report.

## Browser workflow, screenshots, and security

No authenticated student workflow or responsive screenshots were produced because no valid Preview deployment exists. Therefore the following are **not verified in a browser**: dashboard values, quiz navigation and answer review, results refresh, leaderboard, history, logout, browser console/runtime errors, and 375/390/768/1440-pixel layouts.

The previous live database report remains the available evidence for server-calculated scoring, persisted answers and rewards, duplicate/concurrent submission rejection, and the Student A to Student B RLS checks. The reciprocal student isolation check remains incomplete. These database-level checks are not a substitute for the requested authenticated Preview workflow.

No screenshot is attached or represented as browser evidence. Store real captures outside publicly served assets after the Preview is available.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed on commit `f606403`. |
| `npm run typecheck` | Passed on commit `f606403`. |
| `npm run test` | Passed on commit `f606403`: 3 tests, 0 failures. |
| `npm run build` | Passed on commit `f606403`: optimized Next.js build. |
| Vercel `build --environment=preview` | Next.js compile, typecheck, and route generation passed; packaging failed on the Windows symlink operation above. |
| `npm run test:db` | Blocked: local PostgreSQL at `127.0.0.1:54322` refused the connection (`ECONNREFUSED`). pgTAP tests did not execute. |
| Browser/responsive tests | Not run; no valid Preview URL. |

The detailed previous live database submission evidence remains in [`PUNCH_FINAL_INTEGRATION_REPORT.md`](./PUNCH_FINAL_INTEGRATION_REPORT.md). The five-minute walkthrough draft is [`PUNCH_5_MINUTE_WALKTHROUGH.md`](./PUNCH_5_MINUTE_WALKTHROUGH.md).

## Repository and AI-use disclosure

No application source changes were required in this Vercel setup attempt. The README points to this report, and the previous UI report is marked superseded. The existing AI-assistance disclosure in README remains intact. Vercel's generated `.gitignore` and dependency-lock changes were reverted. The deployment safeguard is committed separately from this QA report.

The verified Git author is Samuel Ojo (`ojoadeoluwasam@gmail.com`). The prior report and README update were pushed as [`77f1b31`](https://github.com/theos-stack/punch-next-gen-quiz/commit/77f1b3175ef2486a474ba2a4ebaba592407f5b73). The deployment safeguard was pushed as [`bf47128`](https://github.com/theos-stack/punch-next-gen-quiz/commit/bf4712801186381606d9a08d520b23939f7f518d).

## Readiness recommendation

**Not ready for assessment submission.** The GitHub connection and `main` branch tracking are verified; the `vercel.json` safeguard blocks every branch except `qa-preview`. Lint, typecheck, unit tests and build pass locally. A Preview URL, Supabase Preview callback allowlist entry, authenticated student journey, responsive screenshots, reciprocal RLS check, and pgTAP execution are outstanding. The Vercel dashboard did not resolve the `qa-preview` ref in its manual deployment form. Do not deploy to Production or submit the assessment.

## Leaderboard RPC repair and final QA follow-up — 23 October 2026

This follow-up supersedes earlier statements in this report that there was no Preview deployment. The new code commit is deployed to a ready Preview; the full authenticated QA remains incomplete.

### Supabase access, migration history, and RPC

- The CLI worked after setting `SUPABASE_HOME` to a writable temporary directory and disabling telemetry for the process. The earlier filesystem failure was a write to the protected profile path `C:\Users\ojoad\.supabase\telemetry.json`; no credentials were printed or stored in the repository.
- The remote migration list initially showed five matching local/remote migrations and one pending local migration: `20261023010000_student_workspace_leaderboard.sql`.
- `supabase db push --dry-run` identified only that additive migration. A read-only catalog check showed `get_student_workspace_leaderboard` absent while `get_leaderboard` and `submit_quiz_attempt` existed.
- The pending migration was applied. A later migration list showed all six migrations matched, and a dry run returned `upToDate: true` with no pending migrations.
- The root cause of `PGRST202` was the unapplied migration: the RPC was absent from the remote PostgreSQL catalog. After application, the RPC catalog reports argument `p_limit integer`, a table return with rank, public display name, XP, completed quiz count, badge keys and current-student flag, `SECURITY DEFINER`, and `search_path=""`. Execute is denied to `anon` and granted to `authenticated`.
- An unauthenticated REST call now returns HTTP 401 / `42501 permission denied for function`, not `PGRST202`. This confirms PostgREST sees the function and enforces its grant. An authenticated successful RPC call was not performed in this pass.
- `profiles`, `quiz_attempts`, and `student_badges` have RLS enabled. The inspected policies scope profile reads/updates to `auth.uid() = id`, and attempt and badge reads to `auth.uid() = user_id`. No RLS changes were made. The RPC uses `auth.uid()` for the current-student marker and returns no email field.
- The locally reviewed function ranks by XP descending with deterministic name and ID tie-breaks, includes the authenticated student's row beyond the top limit, and returns only the approved public leaderboard fields. Function behavior under two real student JWTs remains to be verified.

### Code correction and automated checks

- The old code used a limited legacy leaderboard when PostgREST returned `PGRST202`, but emitted no server-side diagnostic. It could conceal a missing migration.
- The fallback now logs only the RPC error code (sanitized to an uppercase code token), never the message, email, user ID, token, or database data. The UI continues to label the legacy results as limited; it does not invent an exact current rank.
- ESLint: passed.
- TypeScript: passed.
- Unit tests: passed, 11/11, including a focused check that the server diagnostic exposes only a safe code.
- Production build: passed.
- `npm run test:db`: blocked before tests ran because local PostgreSQL at `127.0.0.1:54322` refused the connection (`ECONNREFUSED`). pgTAP was not executed.
- The remote catalog/RLS inspection and anonymous permission-denial probe ran successfully. They do not replace authenticated integration tests.

### Preview and browser checks

- Vercel's Deployments page identifies commit `4b361644bb42857dcd86e9d768480a1ded295f2a` on branch `qa-preview` as **Ready / Preview**. No Production deployment was initiated by this follow-up. The committed `vercel.json` branch safeguards remain unchanged.
- Preview URL: https://punch-next-gen-quiz-git-qa-preview-theos-stacks-projects.vercel.app/
- The actual Preview landing page was measured at 320, 375, 390, 768, 1024 and 1440 CSS pixels. At all six requested widths, `documentElement.scrollWidth` did not exceed `clientWidth`. The public landing page was visually inspected at 375px and 1440px; no public-page horizontal overflow was observed.
- Direct unauthenticated navigation to `/dashboard` redirected to `/login?next=%2Fdashboard`, as expected. The login page displayed both the email form and Google sign-in option.
- The open app tabs did not contain an authenticated student session. Therefore no dashboard data, “You” row, earned/locked badge rendering, quiz attempt, history, achievements, logout, callback exchange, or session persistence was tested in the browser. No authenticated dashboard/badge screenshots are represented as captured.
- Browser screenshots of public pages were viewed during QA, but this session did not provide a supported export path to save them as report files. Authenticated screenshot evidence is outstanding.

### Remaining verification and manual checklist

Full authenticated release QA is **not complete**. The missing prerequisite is an authenticated session for an authorized fictitious student account in the Preview browser; no account password or inbox access was available in the current session. Do not send credentials here. To continue, sign in on the Preview as test student A and leave that tab open, then repeat with test student B after sign-out.

For each authorized test account, verify the dashboard XP/completion values, exact leaderboard row and public badges; open Achievements and History; inspect quiz question secrecy; and check one existing result. Then compare the other student's private profile/attempt URL under the second ordinary session and confirm access is denied. Use a disposable test attempt only if the test accounts are approved for persistent synthetic data. Capture screenshots from the signed-in pages for the final evidence set. The assessment remains **NO-GO for final submission** until those authenticated checks and saved screenshots pass.

### GitHub

- Code correction: [`4b36164`](https://github.com/theos-stack/punch-next-gen-quiz/commit/4b361644bb42857dcd86e9d768480a1ded295f2a), authored as Samuel Ojo (`ojoadeoluwasam@gmail.com`).
- Pushed only to `qa-preview`. At verification, remote `qa-preview` was `4b361644bb42857dcd86e9d768480a1ded295f2a`; remote `main` remained `10e0533732a0f573cdfe0dbde9293ac2d27799d3`.
- The AI-assistance disclosure in README was not changed.
