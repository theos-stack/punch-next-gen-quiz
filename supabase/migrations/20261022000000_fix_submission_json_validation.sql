-- Keep submission validation compatible with PostgreSQL JSONB functions.
-- Existing deployments have the original function; replace only this function body.
create or replace function public.submit_quiz_attempt(
  p_attempt_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.quiz_attempts%rowtype;
  v_answer_count integer;
  v_distinct_answer_count integer;
  v_answer_key_count integer;
  v_score integer;
  v_completed_at timestamptz;
  v_percentage numeric(5, 2);
  v_xp integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- Serialize this student's completions as well as this attempt. This keeps
  -- the first-completion badge eligibility correct across separate attempts.
  perform 1 from auth.users u where u.id = v_user_id for update;

  select a.* into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id and a.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'Attempt is already completed' using errcode = '55000';
  end if;
  v_completed_at := clock_timestamp();
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Answers must be a JSON array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_answers) <> v_attempt.total_questions then
    raise exception 'Answer every question exactly once' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as submitted(value)
    where case
      when jsonb_typeof(submitted.value) <> 'object' then true
      else (select count(*) from jsonb_object_keys(submitted.value)) <> 2
        or not (submitted.value ? 'question_id')
        or not (submitted.value ? 'selected_option')
        or jsonb_typeof(submitted.value -> 'question_id') <> 'string'
        or jsonb_typeof(submitted.value -> 'selected_option') <> 'string'
        or (submitted.value ->> 'question_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or char_length(btrim(submitted.value ->> 'selected_option')) = 0
    end
  ) then
    raise exception 'Each answer must contain a valid question_id and selected_option' using errcode = '22023';
  end if;

  select count(*)::integer, count(distinct (submitted.value ->> 'question_id')::uuid)::integer
    into v_answer_count, v_distinct_answer_count
  from jsonb_array_elements(p_answers) as submitted(value);
  if v_answer_count <> v_attempt.total_questions
    or v_distinct_answer_count <> v_attempt.total_questions then
    raise exception 'Answer every question exactly once' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as submitted(value)
    where not exists (
      select 1
      from public.questions q
      where q.id = (submitted.value ->> 'question_id')::uuid
        and q.quiz_id = v_attempt.quiz_id
        and exists (
          select 1
          from jsonb_array_elements(q.options) as option_item(value)
          where option_item.value ->> 'id' = submitted.value ->> 'selected_option'
        )
    )
  ) then
    raise exception 'Question or selected option is not part of this quiz' using errcode = '22023';
  end if;

  select count(*)::integer into v_answer_key_count
  from public.questions q
  join private.quiz_answer_keys k on k.question_id = q.id
  where q.quiz_id = v_attempt.quiz_id;
  if v_answer_key_count <> v_attempt.total_questions then
    raise exception 'Quiz answer key is incomplete' using errcode = '55000';
  end if;

  select (count(*) filter (where k.correct_option = submitted.value ->> 'selected_option'))::integer
    into v_score
  from jsonb_array_elements(p_answers) as submitted(value)
  join public.questions q
    on q.id = (submitted.value ->> 'question_id')::uuid
   and q.quiz_id = v_attempt.quiz_id
  join private.quiz_answer_keys k on k.question_id = q.id;

  v_percentage := round((v_score::numeric * 100) / v_attempt.total_questions, 2);
  v_xp := v_score * 10;

  insert into public.submitted_answers (
    attempt_id, quiz_id, question_id, selected_option, is_correct
  )
  select
    v_attempt.id,
    v_attempt.quiz_id,
    q.id,
    submitted.value ->> 'selected_option',
    k.correct_option = submitted.value ->> 'selected_option'
  from jsonb_array_elements(p_answers) as submitted(value)
  join public.questions q
    on q.id = (submitted.value ->> 'question_id')::uuid
   and q.quiz_id = v_attempt.quiz_id
  join private.quiz_answer_keys k on k.question_id = q.id;

  update public.quiz_attempts a
  set status = 'completed', score = v_score, percentage = v_percentage,
      completed_at = v_completed_at, xp_awarded_at = v_completed_at
  where a.id = v_attempt.id;

  insert into public.xp_awards (attempt_id, user_id, correct_answers, xp_amount)
  values (v_attempt.id, v_user_id, v_score, v_xp);

  if (select count(*) from public.quiz_attempts a
      where a.user_id = v_user_id and a.status = 'completed') = 1 then
    insert into public.student_badges (user_id, badge_key, attempt_id)
    values (v_user_id, 'quiz_starter', v_attempt.id)
    on conflict (user_id, badge_key) do nothing;
  end if;

  if v_percentage >= 80 then
    insert into public.student_badges (user_id, badge_key, attempt_id)
    values (v_user_id, 'high_scorer', v_attempt.id)
    on conflict (user_id, badge_key) do nothing;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'score', v_score,
    'total_questions', v_attempt.total_questions,
    'percentage', v_percentage,
    'xp_awarded', v_xp,
    'completed_at', v_completed_at
  );
end;
$$;

revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
