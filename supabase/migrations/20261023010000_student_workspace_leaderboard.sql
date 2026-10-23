-- One authenticated, public-safe leaderboard projection shared by the dashboard
-- preview and full leaderboard. It includes the signed-in student's exact rank
-- even when that position falls outside the requested top rows.
create or replace function public.get_student_workspace_leaderboard(p_limit integer default 50)
returns table (
  rank bigint,
  display_name text,
  total_xp bigint,
  completed_quizzes bigint,
  badge_keys text[],
  is_current_student boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
  v_student_id uuid := auth.uid();
begin
  if v_student_id is null then
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
      t.id, t.student_name, t.xp_total, t.completed_count
    from totals t
  ), visible as (
    select r.* from ranked r where r.position <= v_limit
    union all
    select r.* from ranked r where r.id = v_student_id and r.position > v_limit
  )
  select v.position,
    v.student_name,
    v.xp_total,
    v.completed_count,
    coalesce(b.badge_keys, array[]::text[]),
    v.id = v_student_id
  from visible v
  left join lateral (
    select array_agg(sb.badge_key order by sb.badge_key) as badge_keys
    from public.student_badges sb
    where sb.user_id = v.id
  ) b on true
  order by v.position;
end;
$$;

revoke all on function public.get_student_workspace_leaderboard(integer) from public, anon;
grant execute on function public.get_student_workspace_leaderboard(integer) to authenticated;
