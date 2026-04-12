-- Rentals Miami - PostgreSQL/Supabase schema
-- Ejecuta este script en el SQL Editor de Supabase.

begin;

create extension if not exists pgcrypto;

-- =========================
-- Tabla de administradores
-- =========================
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username varchar(50) not null unique,
  email varchar(255) not null unique,
  password_hash text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Tabla de clientes
-- Solo: nombre, telefono, correo, pasaporte o id
-- =========================
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(120) not null,
  telefono varchar(30) not null,
  correo varchar(255) not null unique,
  pasaporte_o_id varchar(50) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Tabla de carros
-- =========================
create table if not exists public.carros (
  id uuid primary key default gen_random_uuid(),
  marca varchar(80) not null,
  modelo varchar(80) not null,
  cilindraje varchar(40) not null,
  precio_por_dia numeric(10,2) not null check (precio_por_dia >= 0),
  foto_url text,
  disponible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Tabla de casas
-- =========================
create table if not exists public.casas (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(120) not null,
  ubicacion varchar(180) not null,
  precio_noche_persona numeric(10,2) not null check (precio_noche_persona >= 0),
  foto_url text,
  disponible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabla de reservas (cabecera)
-- Un cliente puede tener una reserva con multiples casas y/o multiples carros.
create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  fecha_inicio date not null,
  fecha_fin date not null,
  total numeric(12,2) not null default 0 check (total >= 0),
  estado varchar(20) not null default 'activa' check (estado in ('activa', 'finalizada', 'cancelada')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);

-- Relacion N:M reservas <-> carros
create table if not exists public.reserva_carros (
  reserva_id uuid not null references public.reservas(id) on delete cascade,
  carro_id uuid not null references public.carros(id) on delete restrict,
  precio_por_dia numeric(10,2) not null check (precio_por_dia >= 0),
  dias integer not null check (dias > 0),
  subtotal numeric(12,2) generated always as (precio_por_dia * dias) stored,
  created_at timestamptz not null default now(),
  primary key (reserva_id, carro_id)
);

-- Relacion N:M reservas <-> casas
create table if not exists public.reserva_casas (
  reserva_id uuid not null references public.reservas(id) on delete cascade,
  casa_id uuid not null references public.casas(id) on delete restrict,
  precio_noche_persona numeric(10,2) not null check (precio_noche_persona >= 0),
  noches integer not null check (noches > 0),
  personas integer not null check (personas > 0),
  subtotal numeric(12,2) generated always as (precio_noche_persona * noches * personas) stored,
  created_at timestamptz not null default now(),
  primary key (reserva_id, casa_id)
);

create index if not exists idx_reservas_cliente on public.reservas(cliente_id);
create index if not exists idx_reservas_estado on public.reservas(estado);
create index if not exists idx_reservas_fechas on public.reservas(fecha_inicio, fecha_fin);
create index if not exists idx_reserva_carros_carro on public.reserva_carros(carro_id);
create index if not exists idx_reserva_casas_casa on public.reserva_casas(casa_id);

-- =========================
-- Datos de prueba
-- =========================
insert into public.admins (username, email, password_hash)
values (
  'Admin',
  'admin@rentals.com',
  crypt('Admin123', gen_salt('bf'))
)
on conflict (email) do nothing;

insert into public.carros (marca, modelo, cilindraje, precio_por_dia, foto_url)
values
  ('Toyota', 'Camry', '2.5 L', 45.00, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80'),
  ('Honda', 'CR-V', '1.5 L turbo', 62.00, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58aa?w=800&q=80'),
  ('Tesla', 'Model 3', 'Electrico', 78.00, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80')
on conflict do nothing;

insert into public.casas (nombre, ubicacion, precio_noche_persona, foto_url)
values
  ('Villa Coral Gables', 'Coral Gables, FL', 85.00, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80'),
  ('Loft Brickell', 'Brickell, Miami', 72.00, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'),
  ('Casa South Beach', 'Miami Beach, FL', 98.00, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80')
on conflict do nothing;

insert into public.clientes (nombre, telefono, correo, pasaporte_o_id)
values
  ('Juan Perez', '+1-305-555-1000', 'juan.perez@email.com', 'P-8899123')
on conflict (correo) do nothing;

-- Reserva de ejemplo con 1 casa y 2 carros
with cliente as (
  select id from public.clientes where correo = 'juan.perez@email.com' limit 1
), nueva_reserva as (
  insert into public.reservas (cliente_id, fecha_inicio, fecha_fin, estado, notas)
  select id, current_date + 5, current_date + 10, 'activa', 'Reserva demo multi-servicio'
  from cliente
  returning id
), carros_demo as (
  select id, precio_por_dia from public.carros order by created_at asc limit 2
), casas_demo as (
  select id, precio_noche_persona from public.casas order by created_at asc limit 1
), ins_carros as (
  insert into public.reserva_carros (reserva_id, carro_id, precio_por_dia, dias)
  select nr.id, c.id, c.precio_por_dia, 5
  from nueva_reserva nr
  cross join carros_demo c
), ins_casas as (
  insert into public.reserva_casas (reserva_id, casa_id, precio_noche_persona, noches, personas)
  select nr.id, h.id, h.precio_noche_persona, 5, 2
  from nueva_reserva nr
  cross join casas_demo h
)
update public.reservas r
set total = coalesce((
  select sum(subtotal) from (
    select rc.subtotal from public.reserva_carros rc where rc.reserva_id = r.id
    union all
    select rh.subtotal from public.reserva_casas rh where rh.reserva_id = r.id
  ) x
), 0)
where r.id in (select id from nueva_reserva);

-- updated_at automatico en carros y casas
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_carros_updated_at on public.carros;
create trigger trg_carros_updated_at
  before update on public.carros
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_casas_updated_at on public.casas;
create trigger trg_casas_updated_at
  before update on public.casas
  for each row execute procedure public.set_updated_at();

commit;
