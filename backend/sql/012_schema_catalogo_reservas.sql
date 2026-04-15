-- Schema principal: catálogo (casas/carros), reservas y Storage para fotos.
-- Ejecutar en Supabase SQL Editor.

begin;

-- Helper: ¿el usuario autenticado es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.admins a
    where a.user_id = auth.uid()
      and a.activo = true
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Catálogo: Casas
create table if not exists public.casas (
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

-- tipo inmueble permitido
alter table public.casas
  drop constraint if exists casas_tipo_inmueble_chk;
alter table public.casas
  add constraint casas_tipo_inmueble_chk
  check (tipo_inmueble in ('casa', 'apartamento', 'cabaña'));

-- Catálogo: Carros
create table if not exists public.carros (
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
create table if not exists public.reservas (
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
  drop constraint if exists reservas_tipo_chk;
alter table public.reservas
  add constraint reservas_tipo_chk check (tipo in ('casa','carro'));

alter table public.reservas
  drop constraint if exists reservas_estado_chk;
alter table public.reservas
  add constraint reservas_estado_chk check (estado in ('pendiente','aprobada','rechazada','cancelada'));

alter table public.reservas
  drop constraint if exists reservas_item_chk;
alter table public.reservas
  add constraint reservas_item_chk
  check (
    (tipo = 'casa' and casa_id is not null and carro_id is null)
    or
    (tipo = 'carro' and carro_id is not null and casa_id is null)
  );

alter table public.reservas
  drop constraint if exists reservas_rango_fechas_chk;
alter table public.reservas
  add constraint reservas_rango_fechas_chk check (hasta > desde);

create index if not exists casas_nombre_idx on public.casas using btree (nombre);
create index if not exists casas_tipo_idx on public.casas using btree (tipo_inmueble);
create index if not exists carros_marca_idx on public.carros using btree (marca);
create index if not exists reservas_estado_idx on public.reservas using btree (estado);
create index if not exists reservas_desde_hasta_idx on public.reservas using btree (desde, hasta);
create index if not exists reservas_casa_idx on public.reservas using btree (casa_id);
create index if not exists reservas_carro_idx on public.reservas using btree (carro_id);

-- RLS
alter table public.casas enable row level security;
alter table public.carros enable row level security;
alter table public.reservas enable row level security;

-- Casas: lectura pública, escritura solo admin
drop policy if exists casas_public_read on public.casas;
create policy casas_public_read on public.casas for select to anon, authenticated using (true);

drop policy if exists casas_admin_write on public.casas;
create policy casas_admin_write on public.casas
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Carros: lectura pública, escritura solo admin
drop policy if exists carros_public_read on public.carros;
create policy carros_public_read on public.carros for select to anon, authenticated using (true);

drop policy if exists carros_admin_write on public.carros;
create policy carros_admin_write on public.carros
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Reservas:
-- - clientes pueden crear (insert) (sin Auth) y no pueden listar todas
-- - admin puede leer / actualizar / borrar
drop policy if exists reservas_public_insert on public.reservas;
create policy reservas_public_insert on public.reservas
for insert
to anon, authenticated
with check (true);

drop policy if exists reservas_admin_read on public.reservas;
create policy reservas_admin_read on public.reservas
for select
to authenticated
using (public.is_admin());

drop policy if exists reservas_admin_write on public.reservas;
create policy reservas_admin_write on public.reservas
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists reservas_admin_delete on public.reservas;
create policy reservas_admin_delete on public.reservas
for delete
to authenticated
using (public.is_admin());

-- Storage bucket + policies (Supabase Storage)
-- Nota: requiere que el proyecto tenga habilitado Storage.
insert into storage.buckets (id, name, public)
values ('catalog-media', 'catalog-media', true)
on conflict (id) do update set public = true;

-- Lectura pública de objetos del bucket
drop policy if exists "catalog_media_public_read" on storage.objects;
create policy "catalog_media_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'catalog-media');

-- Escritura solo admins autenticados
drop policy if exists "catalog_media_admin_insert" on storage.objects;
create policy "catalog_media_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'catalog-media' and public.is_admin());

drop policy if exists "catalog_media_admin_update" on storage.objects;
create policy "catalog_media_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'catalog-media' and public.is_admin())
with check (bucket_id = 'catalog-media' and public.is_admin());

drop policy if exists "catalog_media_admin_delete" on storage.objects;
create policy "catalog_media_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'catalog-media' and public.is_admin());

commit;

