# PUNCH NextGen — Final Release QA Report

**Date:** 22 October 2026 (WAT)  
**Starting commit:** `a364a2ee1b86b178462829bfd9b5a0bdc4ae0443`
**Repository:** `theos-stack/punch-next-gen-quiz`  
**Supabase project:** `syoyadobmvrckqkmbnmq`  
**Status:** **No valid Preview deployment exists. Do not submit or deploy to Production.**

## Vercel access and project setup

- `npx vercel@latest whoami` succeeded in the authorized Windows environment. CLI version used: `65.1.0`; no global CLI was needed.
- No Vercel project was linked initially. I created and linked the dedicated project `theos-stacks-projects/punch-next-gen-quiz`.
- At project setup, I declined the option to connect Git for automatic deployments. The GitHub repository remains unconnected to this Vercel project.
- Added and pushed [`vercel.json`](https://github.com/theos-stack/punch-next-gen-quiz/blob/main/vercel.json) with `git.deploymentEnabled` set to disable `main` and all other branches, while allowing only `qa-preview`. The exact branch rule is `"*": false`, `"main": false`, and `"qa-preview": true`. Vercel's Git configuration documentation states unspecified branches default to enabled, so the wildcard is required to keep unrelated branches disabled. The JSON parsed successfully and the rules were inspected locally.
- The safeguard commit is [`bf47128`](https://github.com/theos-stack/punch-next-gen-quiz/commit/bf4712801186381606d9a08d520b23939f7f518d). After confirming the safeguard was on remote `main`, created and pushed `qa-preview` from that exact commit. Remote `main` and `qa-preview` both point to `bf4712801186381606d9a08d520b23939f7f518d`; GitHub's default branch was not changed and history was not rewritten.
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

The Vercel CLI session remains available, but it cannot connect GitHub to the project from this session. In Vercel, open **theos-stacks-projects → punch-next-gen-quiz → Project Settings → Git**, choose **Connect Git Repository**, select **GitHub → theos-stack/punch-next-gen-quiz**, and authorize that repository for the Vercel app if prompted. The safe `vercel.json` is already on remote `main` and `qa-preview` before this connection. Keep the Production Branch set to `main`; its deployment is explicitly disabled by the committed rule. After connecting, inspect **Settings → Environments → Production → Branch Tracking** and confirm the branch is `main`. `qa-preview` should then be treated as a Preview branch. Stop if the dashboard reports a Production deployment for either push or changes the configured production branch unexpectedly.

Once Vercel displays the repository as connected and the Production Branch as `main`, tell me “connected”. I can then verify the first Git-triggered `qa-preview` deployment's target metadata and build before proceeding with callback configuration and browser QA. Do not promote the Preview.

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

No application source changes were required in this Vercel setup attempt. The README points to this report, and the previous UI report is marked superseded. The existing AI-assistance disclosure in README remains intact. Vercel's generated `.gitignore` and dependency-lock changes were reverted. The deployment safeguard is committed separately from this QA report.

The verified Git author is Samuel Ojo (`ojoadeoluwasam@gmail.com`). The prior report and README update were pushed as [`77f1b31`](https://github.com/theos-stack/punch-next-gen-quiz/commit/77f1b3175ef2486a474ba2a4ebaba592407f5b73). The deployment safeguard was pushed as [`bf47128`](https://github.com/theos-stack/punch-next-gen-quiz/commit/bf4712801186381606d9a08d520b23939f7f518d).

## Readiness recommendation

**Not ready for assessment submission.** The core implementation and local automated checks pass, and prior live database submission/reward evidence remains available. The source now blocks automatic deployment from every branch except `qa-preview`, and remote `main` and `qa-preview` are aligned. A GitHub-connected Vercel project, verified Preview URL, Supabase Preview callback allowlist entry, authenticated browser journey, responsive screenshots, reciprocal RLS check, and pgTAP execution are still outstanding. The next action is the one-time Vercel GitHub repository connection above. Do not deploy to Production or submit the assessment.
