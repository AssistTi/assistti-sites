-- Execute no SQL Editor do Supabase. Substitua o e-mail do administrador
-- usando auth.users após criar a conta em Authentication > Users.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 role text not null default 'client' check (role in ('admin','client')),
 created_at timestamptz not null default now()
);
create table if not exists public.sites (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 repository text,
 created_at timestamptz not null default now()
);
create table if not exists public.site_access (
 user_id uuid not null references public.profiles(id) on delete cascade,
 site_id uuid not null references public.sites(id) on delete cascade,
 can_edit boolean not null default true,
 can_publish boolean not null default false,
 primary key (user_id,site_id)
);
alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.site_access enable row level security;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
create policy "Read own profile or admin" on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy "Admin manages profiles" on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "Read accessible sites" on public.sites for select to authenticated
 using(public.is_admin() or exists(select 1 from public.site_access a where a.site_id=sites.id and a.user_id=auth.uid()));
create policy "Admin manages sites" on public.sites for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "Read own access or admin" on public.site_access for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy "Admin manages access" on public.site_access for all to authenticated using(public.is_admin()) with check(public.is_admin());
-- Depois de criar o primeiro usuário no Auth, torne-o admin:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='SEU_EMAIL');
-- Cadastro inicial de profile, execute para usuários existentes:
-- insert into public.profiles(id,email) select id,email from auth.users on conflict(id) do nothing;
-- Novos usuários recebem profile automaticamente:
create or replace function public.create_profile() returns trigger
language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,email) values(new.id,new.email)
on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile();
