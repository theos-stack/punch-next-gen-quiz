-- Phase 1 student profile. Supabase Auth owns the identity; this table stores
-- only the app-facing profile fields linked to auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 60),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

create policy "Students can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Students can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  profile_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  if profile_name is null then
    profile_name := coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Student');
  end if;
  profile_name := left(profile_name, 60);
  if char_length(profile_name) < 2 then
    profile_name := 'Student';
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, profile_name);

  return new;
end;
$$;

revoke all on function public.handle_new_student_profile() from public, anon, authenticated;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_student_profile();
