# PUNCH NextGen Submission Repair Verification

**Verification date:** 22 October 2026 (WAT)  
**Supabase project:** `syoyadobmvrckqkmbnmq`  
**Status:** **Blocked before remote migration review and application.** The prepared local repair addresses the observed PostgreSQL error, but remote migration history and the dry-run plan could not be inspected because this environment has no authorized Supabase CLI token. The live function therefore remains unverified after repair.

## Root cause and prepared repair

The live `submit_quiz_attempt` RPC returned PostgreSQL error `42883`: `function jsonb_object_length(jsonb) does not exist`. The validation expected each answer to be a JSON object with exactly two keys: `question_id` and `selected_option`.

The local migration `supabase/migrations/20261022000000_fix_submission_json_validation.sql` replaces that unsupported call with a scalar count over PostgreSQL's supported `jsonb_object_keys` set-returning function. It replaces only `public.submit_quiz_attempt(uuid, jsonb)` and retains the existing checks for authenticated identity, attempt ownership and status, answer shape, duplicate/missing questions, quiz membership, option membership, and answer-key completeness. Scoring still uses the private answer-key table in the database; submitted answer rows, completion, XP, and badges remain in one transaction.

The function remains `SECURITY DEFINER` with an empty `search_path`. It locks the current `auth.users` row to serialize badge eligibility and locks only an attempt owned by `auth.uid()`. The migration revokes execute from `PUBLIC` and `anon` and grants it to `authenticated`, matching the existing function permissions. `CREATE OR REPLACE FUNCTION` preserves the existing function owner. No access policy was broadened. This is a source review only; the deployed function definition and owner could not be queried with the available credentials.

## CLI and remote migration status

- Supabase CLI `2.121.0` runs successfully with telemetry disabled and an isolated writable CLI home under the temporary directory.
- No `SUPABASE_ACCESS_TOKEN` is present in the process environment. No access-token file exists in the isolated CLI home or the usual user Supabase CLI home.
- Because authentication is unavailable, `supabase migration list` and `supabase db push --dry-run` were not repeated. The remote migration history, linked project status, pending migration plan, and live function definition remain unknown. The local `supabase/config.toml` project ID is a local project name, not proof of remote linkage.
- No remote migration was applied, no migration history was repaired, and no database was reset or dropped.
- `npm run test:db` could not connect to local PostgreSQL at `127.0.0.1:54322` (`ECONNREFUSED`). pgTAP did not run.

**Exact participation needed:** in PowerShell, set a temporary CLI home and authenticate interactively without sharing the generated token:

```powershell
$env:SUPABASE_HOME = Join-Path $env:TEMP "punch-supabase-cli"
$env:SUPABASE_TELEMETRY_DISABLED = "1"
$env:DO_NOT_TRACK = "1"
New-Item -ItemType Directory -Force $env:SUPABASE_HOME | Out-Null
npx supabase login
```

After completing the browser/device authorization, ask to continue. The next step is to link explicitly to `syoyadobmvrckqkmbnmq`, inspect `supabase migration list`, and review `supabase db push --dry-run`. Apply the additive migration only if history confirms it is the sole intended pending change and the plan is non-destructive.

## Live checks before the repair

The live checks below were performed against the assessment project before this repair could be applied:

| Check | Observed result |
| --- | --- |
| Two fictitious authenticated students | Both could log in; database trigger created a profile for each |
| Own-profile access | Passed for each student |
| Cross-student profile access | Student A received no rows for Student B; attempted update did not change B's profile |
| Cross-student attempts | Other student's attempt was not readable; direct update returned HTTP 403; submission returned `P0002` / “Attempt not found” |
| Quiz questions and answer key | Both students loaded 10 questions; public response omitted answer keys; private schema was not exposed through PostgREST |
| Attempt creation | Both attempts persisted as `in_progress` |
| Valid 10-answer submission | Failed with HTTP 500 from the unsupported JSONB function; no score or completed result was saved |
| Repeat and simultaneous submission requests | Repeat returned HTTP 500; two simultaneous requests also both returned HTTP 500. This is **not** a successful duplicate/concurrency safety test because both requests hit the same database error before completion |
| Rewards and badges | No XP award or badge was created because neither attempt completed |
| Leaderboard | Endpoint returned display name, rank, XP, and completed quiz count without email; both test students showed 0 XP and 0 completed quizzes |
| Invalid answer list | A short answer list returned HTTP 400. A full list with a foreign question ID could not be verified while the database function was failing |
| Auth callback | Login, logout, and protected dashboard redirect were exercised earlier. The callback code exchange and redirect allowlist were not verified; a confirmation URL expired and is not evidence of a successful callback |

No successful server-calculated score, saved result/history, XP allocation, Quiz Starter award, High Scorer award, leaderboard update, refresh idempotency, or successful concurrent-submission protection has yet been observed after the repair.

## Automated checks in this workspace

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed — 3 tests, 0 failures |
| `npm run build` | Passed — optimized Next.js production build completed |
| `npm run test:db` | Blocked — local PostgreSQL connection refused at `127.0.0.1:54322`; no pgTAP assertions executed |
| Live database integration after repair | Blocked — repair not applied; no authenticated CLI session or remote dry-run available |
| Browser quiz completion after repair | Blocked — live function still fails; prior mobile browser run reached the submit error state |

## GitHub and release status

The prepared additive repair and related regression test are already in the repository history at commit [`51ee703436364aa9e2ed27873920d6f6880b0534`](https://github.com/theos-stack/punch-next-gen-quiz/commit/51ee703436364aa9e2ed27873920d6f6880b0534). The current reported repository head is [`3a6f13cd8fc444cb45af8543d03267c18b498f61`](https://github.com/theos-stack/punch-next-gen-quiz/commit/3a6f13cd8fc444cb45af8543d03267c18b498f61). The configured Git identity is Samuel Ojo (`ojoadeoluwasam@gmail.com`). The existing README AI-assistance disclosure remains intact. No credentials or environment files are included in this report.

There are no new source corrections in this verification pass. No new commit was created because the only new artifact records blocked verification, and the repair source is already committed. No frontend deployment or assessment submission was performed.

## Readiness

**Not verified and not release-ready.** The live quiz submission is still known to fail until the additive repair is reviewed and applied. Required blockers are authenticated access to inspect remote migration history and the dry-run, followed by the real two-student scoring, reward, duplicate, concurrent, invalid-request, ownership, results/history, and browser completion checks. Stop here for review; do not deploy or submit the assessment.
