-- Admins basados en Supabase Auth.
-- Crea una tabla mínima que marca qué usuarios (auth.users) son admins.
--
-- Uso:
-- 1) Crea el usuario en Supabase Auth (email/contraseña).
-- 2) Inserta su user_id aquí:
--    insert into public.admins(user_id) values ('<uuid>');

begin;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now(),
  activo boolean not null default true
);

alter table public.admins enable row level security;

-- El usuario puede leer su propio registro (para validar si es admin).
drop policy if exists admins_read_own on public.admins;
create policy admins_read_own
on public.admins
for select
to authenticated
using (auth.uid() = user_id);

commit;

