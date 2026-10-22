begin;

create extension if not exists pgtap with schema extensions;
select plan(26);

select has_table('public', 'xp_awards', 'XP ledger is installed');
select col_is_unique('public', 'xp_awards', 'attempt_id', 'each attempt can award XP at most once');
select has_table('public', 'badge_definitions', 'badge catalogue is installed');
select has_index('public', 'student_badges', 'student_badges_user_id_badge_key_key', 'a student can receive each badge only once');
select ok(not has_schema_privilege('authenticated', 'private', 'USAGE'), 'authenticated clients cannot use the private answer-key schema');
select ok(position('email' in pg_get_function_result('public.get_leaderboard(integer)'::regprocedure)) = 0, 'leaderboard return shape contains no email');

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('31000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'phase3-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P3 Test A"}', now(), now()),
  ('31000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'phase3-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"P3 Test B"}', now(), now());
select is((select count(*)::integer from public.profiles where id in (
  '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000002'
)), 2, 'auth user trigger creates both student profiles');

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000001', true);
select set_config('punch.test.attempt_a', public.start_quiz_attempt('10000000-0000-4000-8000-000000000001')::text, true);
select set_config('punch.test.answers', jsonb_build_array(
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000001','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000002','selected_option','C'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000003','selected_option','B'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000004','selected_option','B'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000005','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000006','selected_option','B'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000007','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000008','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000009','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000010','selected_option','C')
)::text, true);

select throws_ok(
  $$select public.submit_quiz_attempt(
    current_setting('punch.test.attempt_a')::uuid,
    jsonb_set(current_setting('punch.test.answers')::jsonb, '{0,question_id}', '"ffffffff-ffff-4fff-8fff-ffffffffffff"'::jsonb)
  )$$,
  '22023', 'Question or selected option is not part of this quiz',
  'submission rejects a question ID from outside the quiz'
);
select throws_ok(
  $$select public.submit_quiz_attempt(
    current_setting('punch.test.attempt_a')::uuid,
    jsonb_set(current_setting('punch.test.answers')::jsonb, '{0,extra}', '"unexpected"'::jsonb)
  )$$,
  '22023', 'Each answer must contain a valid question_id and selected_option',
  'submission rejects extra answer fields'
);
select is((select status from public.quiz_attempts where id = current_setting('punch.test.attempt_a')::uuid), 'in_progress', 'invalid submission leaves attempt uncompleted');
select set_config('punch.test.result', public.submit_quiz_attempt(current_setting('punch.test.attempt_a')::uuid, current_setting('punch.test.answers')::jsonb)::text, true);
select is((current_setting('punch.test.result')::jsonb ->> 'score'), '10', 'database calculates the score');
select is((current_setting('punch.test.result')::jsonb ->> 'xp_awarded'), '100', 'database awards ten XP per correct answer');
select is((select count(*)::integer from public.xp_awards where attempt_id = current_setting('punch.test.attempt_a')::uuid), 1, 'completed attempt creates one XP award');
select is((select xp_amount from public.xp_awards where attempt_id = current_setting('punch.test.attempt_a')::uuid), 100, 'XP ledger amount matches score');
select is((select count(*)::integer from public.student_badges where user_id = auth.uid()), 2, 'first perfect quiz awards starter and high scorer badges');
select throws_ok(
  $$select public.submit_quiz_attempt(current_setting('punch.test.attempt_a')::uuid, current_setting('punch.test.answers')::jsonb)$$,
  '55000', 'Attempt is already completed',
  'repeated submission is rejected'
);
select is((select count(*)::integer from public.xp_awards where attempt_id = current_setting('punch.test.attempt_a')::uuid), 1, 'repeat submission does not duplicate XP');

select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000002', true);
select set_config('punch.test.attempt_b', public.start_quiz_attempt('10000000-0000-4000-8000-000000000001')::text, true);
select is((select count(*)::integer from public.quiz_attempts where id = current_setting('punch.test.attempt_a')::uuid), 0, 'another student cannot read the first student attempt');
select is((select count(*)::integer from public.xp_awards where attempt_id = current_setting('punch.test.attempt_a')::uuid), 0, 'another student cannot read the first student XP award');
select throws_ok(
  $$select public.submit_quiz_attempt(current_setting('punch.test.attempt_a')::uuid, current_setting('punch.test.answers')::jsonb)$$,
  'P0002', 'Attempt not found',
  'another student cannot submit the first student attempt'
);
select throws_ok(
  $$update public.quiz_attempts set score = 10 where id = current_setting('punch.test.attempt_a')::uuid$$,
  '42501', 'permission denied for table quiz_attempts',
  'another student cannot modify the first student attempt'
);
select set_config('punch.test.answers_b', jsonb_build_array(
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000001','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000002','selected_option','C'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000003','selected_option','B'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000004','selected_option','B'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000005','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000006','selected_option','B'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000007','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000008','selected_option','A'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000009','selected_option','D'),
  jsonb_build_object('question_id','20000000-0000-4000-8000-000000000010','selected_option','D')
)::text, true);
select set_config('punch.test.result_b', public.submit_quiz_attempt(current_setting('punch.test.attempt_b')::uuid, current_setting('punch.test.answers_b')::jsonb)::text, true);
select is((current_setting('punch.test.result_b')::jsonb ->> 'score'), '8', 'database calculates a score at the 80 percent threshold');
select is((select xp_amount from public.xp_awards where attempt_id = current_setting('punch.test.attempt_b')::uuid), 80, 'eight correct answers award eighty XP');
select is((select count(*)::integer from public.student_badges where user_id = auth.uid() and badge_key = 'quiz_starter'), 1, 'first completion earns Quiz Starter');
select is((select count(*)::integer from public.student_badges where user_id = auth.uid() and badge_key = 'high_scorer'), 1, '80 percent earns High Scorer at the exact threshold');
select ok((
  select a.rank < b.rank
  from public.get_leaderboard(100) a
  cross join public.get_leaderboard(100) b
  where a.display_name = 'P3 Test A' and b.display_name = 'P3 Test B'
), 'higher XP ranks ahead of lower XP');

select * from finish();
rollback;
