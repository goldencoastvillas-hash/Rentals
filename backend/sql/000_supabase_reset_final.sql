-- Reset TOTAL + SQL final (1 solo query) para Supabase
-- Pégalo completo en Supabase SQL Editor y ejecútalo.
--
-- Esto:
-- 1) Elimina lo creado en `public` (tablas, funciones, policies) y en Storage (bucket + policies + objetos del bucket)
-- 2) Crea el esquema final: admins (Supabase Auth), casas, carros, reservas, RLS + bucket `catalog-media` público
--
-- IMPORTANTE:
-- - NO borra usuarios de Supabase Auth (auth.users). Solo borra nuestras tablas/policies.
-- - Si el bucket `catalog-media` tenía archivos, se borran sus filas en `storage.objects`.

begin;

-- Extensiones necesarias (gen_random_uuid, crypt)
create extension if not exists pgcrypto;

-- =========================
-- 1) BORRADO (RESET)
-- =========================

-- Storage: policies + objects + bucket (si existe)
drop policy if exists "catalog_media_public_read" on storage.objects;
drop policy if exists "catalog_media_admin_insert" on storage.objects;
drop policy if exists "catalog_media_admin_update" on storage.objects;
drop policy if exists "catalog_media_admin_delete" on storage.objects;

-- Supabase bloquea deletes directos (storage.protect_delete).
-- Usamos funciones oficiales si existen; si no, continuamos sin fallar.
do $$
begin
  begin
    perform storage.empty_bucket('catalog-media');
  exception
    when undefined_function then null;
    when others then null;
  end;

  begin
    perform storage.delete_bucket('catalog-media');
  exception
    when undefined_function then null;
    when others then null;
  end;
end $$;

-- Public: policies
-- OJO: `drop policy ... on <tabla>` falla si la tabla no existe.
do $$
begin
  if to_regclass('public.reservas') is not null then
    execute 'drop policy if exists reservas_public_insert on public.reservas';
    execute 'drop policy if exists reservas_admin_read on public.reservas';
    execute 'drop policy if exists reservas_admin_write on public.reservas';
    execute 'drop policy if exists reservas_admin_delete on public.reservas';
  end if;

  if to_regclass('public.casas') is not null then
    execute 'drop policy if exists casas_public_read on public.casas';
    execute 'drop policy if exists casas_admin_write on public.casas';
  end if;

  if to_regclass('public.carros') is not null then
    execute 'drop policy if exists carros_public_read on public.carros';
    execute 'drop policy if exists carros_admin_write on public.carros';
  end if;

  if to_regclass('public.admins') is not null then
    execute 'drop policy if exists admins_read_own on public.admins';
  end if;
end $$;

-- Public: funciones
drop function if exists public.web_admin_login(text, text, text);
drop function if exists public.is_admin();

-- Public: tablas (en orden por FK)
drop table if exists public.reservas cascade;
drop table if exists public.casas cascade;
drop table if exists public.carros cascade;
drop table if exists public.admins cascade;

-- =========================
-- 2) CREACIÓN (FINAL)
-- =========================

-- Admins (sin Supabase Auth): usuario + correo + password_hash (pgcrypto)
create table public.admins (
  id bigserial primary key,
  creado_en timestamptz not null default now(),
  activo boolean not null default true,
  username text not null,
  email text not null,
  password_hash text not null
);

create unique index admins_username_uq on public.admins (lower(username));
create unique index admins_email_uq on public.admins (lower(email));

-- Login por RPC (usuario + correo + contraseña)
create or replace function public.web_admin_login(
  p_username text,
  p_email text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean := false;
begin
  if coalesce(trim(p_username), '') = '' or coalesce(trim(p_email), '') = '' or coalesce(p_password, '') = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_fields');
  end if;

  select true into v_ok
  from public.admins a
  where a.activo = true
    and lower(a.username) = lower(trim(p_username))
    and lower(a.email) = lower(trim(p_email))
    and a.password_hash = crypt(p_password, a.password_hash)
  limit 1;

  return jsonb_build_object('ok', coalesce(v_ok, false));
end;
$$;

grant execute on function public.web_admin_login(text, text, text) to anon, authenticated;

-- Catálogo: Casas
create table public.casas (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  tipo_inmueble text not null,
  nombre text not null,
  direccion text,
  lat double precision,
  lng double precision,

  habitaciones int not null default 0,
  banos int not null default 0,
  max_huespedes int not null default 1,
  precio_noche numeric(12,2) not null default 0,

  piscina boolean not null default false,
  patio boolean not null default false,
  aire boolean not null default false,
  gym boolean not null default false,
  mascotas boolean not null default false,

  wifi boolean not null default false,
  parking boolean not null default false,
  checkin text,
  checkout text,

  descripcion text,
  amenidades jsonb not null default '{}'::jsonb,
  fotos_urls jsonb not null default '[]'::jsonb
);

alter table public.casas
  add constraint casas_tipo_inmueble_chk
  check (tipo_inmueble in ('casa', 'apartamento', 'cabaña'));

-- Catálogo: Carros
create table public.carros (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  marca text not null,
  cilindraje text,
  tipo text,
  puestos int not null default 4,
  precio_dia numeric(12,2) not null default 0,

  descripcion text,
  atributos jsonb not null default '{}'::jsonb,
  fotos_urls jsonb not null default '[]'::jsonb
);

-- Reservas
create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  estado text not null default 'pendiente', -- pendiente|aprobada|rechazada|cancelada
  tipo text not null, -- casa|carro

  casa_id uuid references public.casas(id) on delete set null,
  carro_id uuid references public.carros(id) on delete set null,

  nombre text not null,
  fecha_nacimiento date,
  pasaporte_id text not null,
  telefono text,

  desde date not null,
  hasta date not null,
  noches int not null default 1,

  personas int not null default 1,
  mascotas boolean not null default false,

  total numeric(12,2) not null default 0,
  notas text
);

alter table public.reservas
  add constraint reservas_tipo_chk check (tipo in ('casa','carro'));

alter table public.reservas
  add constraint reservas_estado_chk check (estado in ('pendiente','aprobada','rechazada','cancelada'));

alter table public.reservas
  add constraint reservas_item_chk
  check (
    (tipo = 'casa' and casa_id is not null and carro_id is null)
    or
    (tipo = 'carro' and carro_id is not null and casa_id is null)
  );

alter table public.reservas
  add constraint reservas_rango_fechas_chk check (hasta > desde);

create index casas_nombre_idx on public.casas using btree (nombre);
create index casas_tipo_idx on public.casas using btree (tipo_inmueble);
create index carros_marca_idx on public.carros using btree (marca);
create index reservas_estado_idx on public.reservas using btree (estado);
create index reservas_desde_hasta_idx on public.reservas using btree (desde, hasta);
create index reservas_casa_idx on public.reservas using btree (casa_id);
create index reservas_carro_idx on public.reservas using btree (carro_id);

-- Permisos para PostgREST (anon key / publishable).
-- Sin esto, aunque existan datos, el frontend no puede hacer SELECT y parecerá “vacío”.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.casas to anon, authenticated;
grant select, insert, update, delete on table public.carros to anon, authenticated;
grant select, insert, update, delete on table public.reservas to anon, authenticated;
grant select on table public.admins to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Nota: sin Supabase Auth no podemos aplicar RLS por rol de usuario.
-- Dejamos RLS deshabilitado en tablas public.* para permitir CRUD desde la web.

-- Storage bucket + policies (Supabase Storage)
insert into storage.buckets (id, name, public)
values ('catalog-media', 'catalog-media', true)
on conflict (id) do update set public = true;

create policy "catalog_media_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'catalog-media');

create policy "catalog_media_admin_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'catalog-media');

create policy "catalog_media_admin_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'catalog-media')
with check (bucket_id = 'catalog-media');

create policy "catalog_media_admin_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'catalog-media');

-- Admin demo (como pediste)
insert into public.admins (username, email, password_hash, activo)
values ('Admin', 'admin@rentals.com', crypt('Admin123', gen_salt('bf')), true)
on conflict do nothing;

-- Datos de prueba (2 casas, 2 carros)
insert into public.casas (
  tipo_inmueble, nombre, direccion, lat, lng,
  habitaciones, banos, max_huespedes, precio_noche,
  piscina, patio, aire, gym, mascotas, wifi, parking,
  descripcion, fotos_urls
)
values
  (
    'casa',
    'Villa Sunrise (Demo)',
    'Miami Beach, FL',
    25.7907, -80.1300,
    4, 3, 8, 520,
    true, true, true, false, true, true, true,
    'Villa demo para pruebas (elimínala luego desde Admin).',
    '["https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1600&q=80"]'::jsonb
  ),
  (
    'apartamento',
    'Apartamento Ocean View (Demo)',
    'Brickell, Miami, FL',
    25.7617, -80.1918,
    2, 2, 4, 260,
    false, false, true, true, false, true, true,
    'Apartamento demo para pruebas (elimínala luego desde Admin).',
    '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=80"]'::jsonb
  );

insert into public.carros (
  marca, cilindraje, tipo, puestos, precio_dia, descripcion, fotos_urls
)
values
  (
    'BMW X5 (Demo)',
    '3.0',
    'SUV',
    5,
    180,
    'Carro demo para pruebas (elimínalo luego desde Admin).',
    '["https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1600&q=80"]'::jsonb
  ),
  (
    'Mercedes C300 (Demo)',
    '2.0',
    'Sedan',
    5,
    140,
    'Carro demo para pruebas (elimínalo luego desde Admin).',
    '["https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80"]'::jsonb
  );

commit;

