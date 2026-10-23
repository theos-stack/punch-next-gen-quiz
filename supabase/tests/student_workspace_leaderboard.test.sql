begin;
select plan(9);

select has_function('public', 'get_student_workspace_leaderboard', array['integer']::name[], 'student workspace leaderboard RPC exists');
select ok(not has_function_privilege('anon', 'public.get_student_workspace_leaderboard(integer)', 'EXECUTE'), 'anonymous clients cannot call the leaderboard RPC');
select ok(has_function_privilege('authenticated', 'public.get_student_workspace_leaderboard(integer)', 'EXECUTE'), 'authenticated students can call the leaderboard RPC');

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('41000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'workspace-charlie@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Workspace Charlie"}', now(), now()),
  ('41000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'workspace-alpha@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Workspace Alpha"}', now(), now()),
  ('41000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'workspace-bravo@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Workspace Bravo"}', now(), now());

insert into public.quiz_attempts (id, quiz_id, user_id, status, score, total_questions, percentage, completed_at) values
  ('42000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 'completed', 1, 10, 10, now()),
  ('42000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000002', 'completed', 2, 10, 20, now()),
  ('42000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000003', 'completed', 2, 10, 20, now());
insert into public.xp_awards (attempt_id, user_id, correct_answers, xp_amount) values
  ('42000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 1, 10),
  ('42000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000002', 2, 20),
  ('42000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000003', 2, 20);

set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000001', true);

select is((select rank from public.get_student_workspace_leaderboard(1) where is_current_student), 3::bigint, 'the current student exact rank is returned outside the visible top one');
select is((select count(*)::integer from public.get_student_workspace_leaderboard(1) where is_current_student), 1, 'the current student appears exactly once in the projection');
select is((select rank from public.get_student_workspace_leaderboard(3) where display_name = 'Workspace Alpha'), 1::bigint, 'XP ties use a stable display-name order');
select is((select rank from public.get_student_workspace_leaderboard(3) where display_name = 'Workspace Bravo'), 2::bigint, 'the second tied student receives the next deterministic rank');
select is((select cardinality(badge_keys)::integer from public.get_student_workspace_leaderboard(1) where is_current_student), 0, 'public badge projection is empty when the student has not earned badges');
select ok(position('email' in pg_get_function_result('public.get_student_workspace_leaderboard(integer)'::regprocedure)) = 0, 'the public projection contains no email field');

select * from finish();
rollback;
