export type SubmittedAnswer = { question_id: string; selected_option: string };
export function validateSubmissionAnswers(value: unknown):
  | { ok: true; answers: SubmittedAnswer[] }
  | { ok: false; message: string };
