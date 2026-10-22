# PUNCH NextGen — Final Release QA Report

**Date:** 22 October 2026 (WAT)  
**Starting commit:** `95dec30e4b41befe2cf40fede68921d1ccb90e4e`  
**Repository:** `theos-stack/punch-next-gen-quiz`  
**Supabase project:** `syoyadobmvrckqkmbnmq`  
**Status:** **No valid Preview deployment exists. Do not submit or deploy to Production.**

## Vercel access and project setup

- `npx vercel@latest whoami` succeeded in the authorized Windows environment. CLI version used: `65.1.0`; no global CLI was needed.
- No Vercel project was linked initially. I created and linked the dedicated project `theos-stacks-projects/punch-next-gen-quiz`.
- At project setup, I declined the option to connect Git for automatic deployments. No automatic deployment from `main` is enabled.
- The local `.env.local` Supabase URL was checked against `syoyadobmvrckqkmbnmq`; it matched. The exact application variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are now configured for the Vercel Preview environment. Their values were not included in this report or committed.
- The local `.env.local` and `.vercel/` remain ignored. No environment file or credential was staged.

## Preview deployment blocker

The current Vercel CLI/project behavior does not meet the Preview-only requirement:

1. `npx vercel@latest deploy --yes` omitted `--prod`, but Vercel returned deployment metadata with `target: production` and assigned the project's default alias. The CLI said its first deployment was assigned to Production.
2. Explicit `--target=preview` and `--environment=preview` attempts also returned `target: production`, including an attempt from a temporary non-main branch.
3. Each of the five returned Production-target deployment records was removed immediately. The Vercel CLI subsequently reported no active Production deployments; the alias listing showed no remaining project alias. No custom production domain was configured.
4. The separate supported prebuilt flow successfully pulled Preview settings and ran the Next.js production build and TypeScript checks. Vercel packaging then failed while creating a serverless-function symlink: `EPERM: operation not permitted, symlink 'login.func' -> '.vercel/output/functions/dashboard.func'`. Retrying in the authorized Windows context produced the same filesystem failure.

The CLI account is authenticated and the Preview variables are present. The blocker is therefore not missing Vercel credentials: this empty project's CLI deployment is being forced to Production, while the prebuilt alternative cannot finish packaging on this Windows filesystem.

**Actual Preview URL:** none.  
**Deployment status:** no active Preview deployment; no active Production deployment.  
**Preview build:** Next.js compile and TypeScript succeeded, but Vercel packaging failed before an upload.  
**Production:** no Production deployment is intentionally left active. The temporary Production-target records were removed.

## One required interactive action

To obtain a Preview without allowing automatic Production deploys from `main`, connect this Vercel project to `theos-stack/punch-next-gen-quiz` in Vercel **Project Settings → Git** and authorize the repository integration. Before saving, set the Production Branch to a deliberate protected release branch other than `main` (and keep `main` excluded from Production builds). Then tell me when Vercel shows the repository as connected. I can create and push a temporary `codex/` preview branch from commit `95dec30`, then verify that Vercel classifies its deployment as `preview` before opening it. Do not promote that preview.

This is the specific Vercel GitHub authorization/configuration still needed; CLI login itself already works.

## Authentication callback and Supabase redirects

The callback implementation at `app/auth/callback/route.ts` exchanges the Supabase PKCE `code`, accepts only a local relative `next` path that begins with one slash and rejects `//`, and sends failed exchanges to `/login?message=confirmation-failed`.

There is no Preview hostname to add to Supabase Auth's redirect allowlist. I did not change the Supabase allowlist or Site URL, so existing localhost entries remain untouched. Email confirmation, PKCE exchange, login/logout, session persistence, and protected-route behavior were not exercised against a deployed Preview in this pass. Do not reuse the previously exposed one-time sign-in URL documented in the earlier integration report.

## Browser workflow, screenshots, and security

No authenticated browser workflow or responsive screenshots were produced because no valid Preview deployment exists. Therefore the following are **not verified in a browser**: dashboard values, quiz navigation and answer review, results refresh, leaderboard, history, logout, browser console/runtime errors, and 375/390/768/1440-pixel layouts.

The previous live database report remains the available evidence for server-calculated scoring, persisted answers and rewards, duplicate/concurrent submission rejection, and the Student A to Student B RLS checks. The reciprocal student isolation check remains incomplete. These database-level checks are not a substitute for the requested authenticated Preview workflow.

No screenshot is attached or represented as browser evidence. Store real captures outside publicly served assets after the Preview is available.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run test` | Passed: 3 tests, 0 failures. |
| `npm run build` | Passed: optimized Next.js build. |
| Vercel `build --environment=preview` | Next.js compile, typecheck, and route generation passed; packaging failed on the Windows symlink operation above. |
| `npm run test:db` | Blocked: local PostgreSQL at `127.0.0.1:54322` refused the connection (`ECONNREFUSED`). pgTAP tests did not execute. |
| Browser/responsive tests | Not run; no valid Preview URL. |

The detailed previous live database submission evidence remains in [`PUNCH_FINAL_INTEGRATION_REPORT.md`](./PUNCH_FINAL_INTEGRATION_REPORT.md). The five-minute walkthrough draft is [`PUNCH_5_MINUTE_WALKTHROUGH.md`](./PUNCH_5_MINUTE_WALKTHROUGH.md).

## Repository and AI-use disclosure

No application source changes were required in this Vercel setup attempt. The README now points to this report, and the previous UI report is marked superseded. The existing AI-assistance disclosure in README remains intact. Vercel's generated `.gitignore` and dependency-lock changes were reverted; only the intended documentation updates will be committed.

The verified Git author is Samuel Ojo (`ojoadeoluwasam@gmail.com`). This report and the related README update were pushed to `main` as [`77f1b31`](https://github.com/theos-stack/punch-next-gen-quiz/commit/77f1b3175ef2486a474ba2a4ebaba592407f5b73).

## Readiness recommendation

**Not ready for assessment submission.** The core implementation and local automated checks pass, and prior live database submission/reward evidence remains available. A Vercel-authenticated Preview URL, Supabase Preview callback allowlist entry, authenticated browser journey, responsive screenshots, reciprocal RLS check, and pgTAP execution are still outstanding. Continue only after the Vercel GitHub integration is authorized and configured to keep `main` out of Production deployments.
