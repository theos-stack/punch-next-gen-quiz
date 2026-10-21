export function validateSubmissionAnswers(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, message: "Answer every question before submitting." };
  }

  const seen = new Set();
  for (const answer of value) {
    if (
      !answer ||
      typeof answer !== "object" ||
      Array.isArray(answer) ||
      Object.keys(answer).length !== 2 ||
      typeof answer.question_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(answer.question_id) ||
      typeof answer.selected_option !== "string" ||
      !answer.selected_option.trim()
    ) {
      return { ok: false, message: "Each answer must include a question and selected option." };
    }
    const questionId = answer.question_id.toLowerCase();
    if (seen.has(questionId)) {
      return { ok: false, message: "Answer each question only once." };
    }
    seen.add(questionId);
  }

  return { ok: true, answers: value };
}
