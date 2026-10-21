-- Phase 2 quiz engine. Public quiz content is separate from the answer key,
-- which remains in a schema that is not exposed through PostgREST.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 100),
  summary text not null check (char_length(summary) between 10 and 240),
  instructions text not null check (char_length(instructions) between 10 and 1000),
  duration_minutes integer not null check (duration_minutes between 1 and 180),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  position integer not null check (position > 0),
  prompt text not null check (char_length(prompt) between 5 and 1000),
  options jsonb not null check (
    jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) between 2 and 6
  ),
  created_at timestamptz not null default now(),
  unique (quiz_id, position),
  unique (id, quiz_id)
);

create table private.quiz_answer_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_option text not null check (char_length(correct_option) between 1 and 32),
  created_at timestamptz not null default now()
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  score integer,
  total_questions integer not null check (total_questions > 0),
  percentage numeric(5, 2),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  xp_awarded_at timestamptz,
  unique (id, quiz_id),
  check (
    (status = 'in_progress' and score is null and percentage is null and completed_at is null)
    or
    (status = 'completed' and score between 0 and total_questions
      and percentage between 0 and 100 and completed_at is not null)
  )
);

create table public.submitted_answers (
  attempt_id uuid not null,
  quiz_id uuid not null,
  question_id uuid not null,
  selected_option text not null check (char_length(selected_option) between 1 and 32),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (attempt_id, question_id),
  foreign key (attempt_id, quiz_id)
    references public.quiz_attempts (id, quiz_id) on delete cascade,
  foreign key (question_id, quiz_id)
    references public.questions (id, quiz_id) on delete restrict
);

create index questions_quiz_position_idx on public.questions (quiz_id, position);
create index quiz_attempts_user_started_idx on public.quiz_attempts (user_id, started_at desc);
create index quiz_attempts_quiz_status_idx on public.quiz_attempts (quiz_id, status);
create index submitted_answers_attempt_idx on public.submitted_answers (attempt_id);

alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table private.quiz_answer_keys enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.submitted_answers enable row level security;

revoke all on table public.quizzes, public.questions, public.quiz_attempts,
  public.submitted_answers from anon, authenticated;
grant select on table public.quizzes, public.questions,
  public.quiz_attempts, public.submitted_answers to authenticated;
revoke all on table private.quiz_answer_keys from public, anon, authenticated;

create policy "Authenticated students can read published quizzes"
  on public.quizzes for select to authenticated
  using (is_published);

create policy "Authenticated students can read published quiz questions"
  on public.questions for select to authenticated
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.is_published
    )
  );

create policy "Students can read their own quiz attempts"
  on public.quiz_attempts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can read answers from their own attempts"
  on public.submitted_answers for select to authenticated
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = (select auth.uid())
    )
  );

create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_question_count integer;
  v_attempt_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.quizzes q
    where q.id = p_quiz_id and q.is_published
  ) then
    raise exception 'Quiz not found' using errcode = 'P0002';
  end if;

  select count(*)::integer into v_question_count
  from public.questions q where q.quiz_id = p_quiz_id;

  if v_question_count < 1 then
    raise exception 'Quiz has no questions' using errcode = '55000';
  end if;

  insert into public.quiz_attempts (quiz_id, user_id, total_questions)
  values (p_quiz_id, v_user_id, v_question_count)
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

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
  v_completed_at timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- Lock the owned attempt before checking status. A competing submission waits
  -- here and then sees the committed completed status instead of writing twice.
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
  set status = 'completed',
      score = v_score,
      percentage = round((v_score::numeric * 100) / v_attempt.total_questions, 2),
      completed_at = v_completed_at
  where a.id = v_attempt.id;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'score', v_score,
    'total_questions', v_attempt.total_questions,
    'percentage', round((v_score::numeric * 100) / v_attempt.total_questions, 2),
    'completed_at', v_completed_at
  );
end;
$$;

revoke all on function public.start_quiz_attempt(uuid) from public, anon;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

insert into public.quizzes (
  id, slug, title, summary, instructions, duration_minutes, is_published
) values (
  '10000000-0000-4000-8000-000000000001',
  'digital-safety-basics',
  'Digital Safety Basics',
  'Build good habits for learning, communicating, and staying safe online.',
  'Choose one answer for each question. You can move between questions before you submit. Your score is calculated after submission.',
  12,
  true
);

insert into public.questions (id, quiz_id, position, prompt, options) values
('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 1, 'Before sharing personal information on a website, what is the safest first step?', jsonb_build_array(jsonb_build_object('id','A','text','Check that the site is trusted and ask a trusted adult if unsure'), jsonb_build_object('id','B','text','Share it quickly so you can continue'), jsonb_build_object('id','C','text','Post it publicly for feedback'), jsonb_build_object('id','D','text','Use someone else’s information'))),
('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 2, 'Which password is the strongest choice for an important account?', jsonb_build_array(jsonb_build_object('id','A','text','A short word you use everywhere'), jsonb_build_object('id','B','text','Your birthday and first name'), jsonb_build_object('id','C','text','A long, unique passphrase that you do not reuse'), jsonb_build_object('id','D','text','The word password followed by 123'))),
('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 3, 'An unexpected email asks you to click a link and enter your password urgently. What should you do?', jsonb_build_array(jsonb_build_object('id','A','text','Reply with your password'), jsonb_build_object('id','B','text','Avoid the link and check with the organization through its official website'), jsonb_build_object('id','C','text','Forward it to all your classmates'), jsonb_build_object('id','D','text','Download every attachment'))),
('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 4, 'What is a good way to check whether an online fact is reliable?', jsonb_build_array(jsonb_build_object('id','A','text','Trust the first result without checking'), jsonb_build_object('id','B','text','Check the author, date, and more than one reputable source'), jsonb_build_object('id','C','text','Trust it if it has many emojis'), jsonb_build_object('id','D','text','Share it before reading it'))),
('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 5, 'Which is a common warning sign of a phishing message?', jsonb_build_array(jsonb_build_object('id','A','text','It pressures you to act immediately and reveal private details'), jsonb_build_object('id','B','text','It uses your school’s official contact details that you verified separately'), jsonb_build_object('id','C','text','It arrives after you requested a password reset'), jsonb_build_object('id','D','text','It contains a lesson schedule you expected'))),
('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 6, 'When using an idea from a book or website in your assignment, what should you do?', jsonb_build_array(jsonb_build_object('id','A','text','Copy it and remove the author’s name'), jsonb_build_object('id','B','text','Paraphrase in your own words and cite the source'), jsonb_build_object('id','C','text','Claim you discovered it yourself'), jsonb_build_object('id','D','text','Change a single word and call it original'))),
('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 7, 'You need to check a bank account while using public Wi-Fi. What is safest?', jsonb_build_array(jsonb_build_object('id','A','text','Wait for a trusted connection or use your mobile network'), jsonb_build_object('id','B','text','Use any pop-up link that appears'), jsonb_build_object('id','C','text','Ask a stranger to log in for you'), jsonb_build_object('id','D','text','Turn off your device’s screen lock'))),
('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 8, 'What does multi-factor authentication add to an account?', jsonb_build_array(jsonb_build_object('id','A','text','A second proof of identity, such as an authenticator code'), jsonb_build_object('id','B','text','A public list of your passwords'), jsonb_build_object('id','C','text','A way to remove all account security'), jsonb_build_object('id','D','text','A guarantee that every message is safe'))),
('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', 9, 'What is a digital footprint?', jsonb_build_array(jsonb_build_object('id','A','text','The record of activity and information associated with you online'), jsonb_build_object('id','B','text','A password stored only on paper'), jsonb_build_object('id','C','text','A computer’s power cable'), jsonb_build_object('id','D','text','A type of internet browser'))),
('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 10, 'What is a respectful response if someone shares an embarrassing photo of a classmate?', jsonb_build_array(jsonb_build_object('id','A','text','Forward it to more people'), jsonb_build_object('id','B','text','Add an insulting comment'), jsonb_build_object('id','C','text','Do not reshare it and tell a trusted adult if the person may be harmed'), jsonb_build_object('id','D','text','Save it to post later')));

insert into private.quiz_answer_keys (question_id, correct_option) values
('20000000-0000-4000-8000-000000000001', 'A'),
('20000000-0000-4000-8000-000000000002', 'C'),
('20000000-0000-4000-8000-000000000003', 'B'),
('20000000-0000-4000-8000-000000000004', 'B'),
('20000000-0000-4000-8000-000000000005', 'A'),
('20000000-0000-4000-8000-000000000006', 'B'),
('20000000-0000-4000-8000-000000000007', 'A'),
('20000000-0000-4000-8000-000000000008', 'A'),
('20000000-0000-4000-8000-000000000009', 'A'),
('20000000-0000-4000-8000-000000000010', 'C');
