-- Phase 3 reward ledger and public-safe leaderboard. Reward writes happen in
-- submit_quiz_attempt so quiz completion and rewards share one transaction.
create table public.badge_definitions (
  badge_key text primary key check (badge_key in ('quiz_starter', 'high_scorer')),
  name text not null,
  description text not null
);

insert into public.badge_definitions (badge_key, name, description) values
  ('quiz_starter', 'Quiz Starter', 'Complete your first quiz.'),
  ('high_scorer', 'High Scorer', 'Score at least 80% on a quiz.');

create table public.xp_awards (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.quiz_attempts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  correct_answers integer not null check (correct_answers >= 0),
  xp_amount integer not null check (xp_amount >= 0),
  awarded_at timestamptz not null default now(),
  check (xp_amount = correct_answers * 10)
);

create index xp_awards_user_idx on public.xp_awards (user_id, awarded_at desc);

create table public.student_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_key text not null references public.badge_definitions (badge_key) on delete restrict,
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create index student_badges_user_idx on public.student_badges (user_id, awarded_at desc);

alter table public.badge_definitions enable row level security;
alter table public.xp_awards enable row level security;
alter table public.student_badges enable row level security;

revoke all on table public.badge_definitions, public.xp_awards, public.student_badges from public, anon, authenticated;
grant select on table public.badge_definitions, public.xp_awards, public.student_badges to authenticated;

create policy "Authenticated students can read badge definitions"
  on public.badge_definitions for select to authenticated using (true);

create policy "Students can read their own XP awards"
  on public.xp_awards for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can read their own badges"
  on public.student_badges for select to authenticated
  using ((select auth.uid()) = user_id);

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
      else jsonb_object_length(submitted.value) <> 2
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

create or replace function public.get_leaderboard(p_limit integer default 50)
returns table (
  rank bigint,
  display_name text,
  total_xp bigint,
  completed_quizzes bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  with totals as (
    select p.id,
      coalesce(nullif(btrim(p.full_name), ''), 'Student') as student_name,
      coalesce(x.total_xp, 0)::bigint as xp_total,
      coalesce(a.completed_count, 0)::bigint as completed_count
    from public.profiles p
    left join lateral (
      select sum(xp.xp_amount)::bigint as total_xp
      from public.xp_awards xp where xp.user_id = p.id
    ) x on true
    left join lateral (
      select count(*)::bigint as completed_count
      from public.quiz_attempts qa
      where qa.user_id = p.id and qa.status = 'completed'
    ) a on true
  ), ranked as (
    select row_number() over (order by t.xp_total desc, lower(t.student_name), t.id) as position,
      t.student_name, t.xp_total, t.completed_count
    from totals t
  )
  select r.position, r.student_name, r.xp_total, r.completed_count
  from ranked r
  order by r.position
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

revoke all on function public.get_leaderboard(integer) from public, anon;
grant execute on function public.get_leaderboard(integer) to authenticated;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
