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
