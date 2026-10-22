# PUNCH NextGen — Five-Minute Walkthrough

Use this script with a working, authorized assessment environment. The authenticated flow and current release preview are not yet browser-verified; do not describe those checks as passed until the release-candidate report is updated.

## 0:00–0:25 — Product

“PUNCH NextGen is a student quiz and rewards platform. Students can practice published quizzes, review saved results, and see XP and badges earned through their completed work.”

## 0:25–0:55 — Sign-in and dashboard

Show registration or sign-in using an authorized demonstration account. Point out the welcome header, database-backed XP total, completed quiz and badge counts, recent attempts, and the four-item mobile navigation. Do not show test inboxes, credentials, or account email addresses.

## 0:55–1:15 — Quiz catalog

Open the quiz catalog and choose a published quiz. Mention that question retrieval returns prompts and options without exposing the answer key.

## 1:15–2:50 — Quiz flow

Start the quiz. Answer each question, using the progress indicator and previous/next controls. Open the answer review, show how answered and unanswered questions are marked, and submit only after all questions have been answered.

## 2:50–3:30 — Results and rewards

Show the saved score and result review. Explain that PostgreSQL calculates the score from the protected answer key, awards 10 XP per correct answer once per attempt, and awards Quiz Starter and High Scorer badges when their database rules are met.

## 3:30–4:05 — Leaderboard and history

Open the leaderboard and attempt history. Explain that the leaderboard exposes student display names and learning totals, not email addresses, and that history links to persistent results.

## 4:05–4:35 — Security and integrity

Describe the authenticated Supabase session, row-level security, server-side scoring, attempt ownership checks, and the database's protection against repeat and simultaneous duplicate submissions. Use the committed live-integration report for exact evidence; do not imply unverified browser checks passed.

## 4:35–5:00 — Mobile and engineering choices

Show the same pages at a narrow viewport and point out the safe-area-aware bottom navigation, touch-sized answer cards, and review step. The current release candidate still needs actual browser QA and preview testing before this demo can be presented as verified.
