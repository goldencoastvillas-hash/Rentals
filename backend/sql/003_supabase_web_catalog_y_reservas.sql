-- Rentals Miami — Catálogo extendido + RPC para reservas desde la web (Supabase)
-- Ejecuta en el SQL Editor después de 001 (y 002 si aplica).
-- Las funciones SECURITY DEFINER permiten insertar reservas sin exponer INSERT directo a anon.

begin;

-- ---------- Columnas extra (coinciden con la UI del frontend) ----------
alter table public.carros add column if not exists categoria varchar(40) not null default 'sedan';
alter table public.carros add column if not exists transmision varchar(20) not null default 'automatica';

alter table public.casas add column if not exists tipo_inmueble varchar(20) not null default 'casa';
alter table public.casas add column if not exists cuartos smallint not null default 3 check (cuartos >= 1 and cuartos <= 30);
alter table public.casas add column if not exists banos smallint not null default 2 check (banos >= 1 and banos <= 30);
alter table public.casas add column if not exists mascotas boolean not null default false;
alter table public.casas add column if not exists aire_acondicionado boolean not null default true;
alter table public.casas add column if not exists estacionamiento boolean not null default true;
alter table public.casas add column if not exists piscina boolean not null default false;
alter table public.casas add column if not exists lat double precision;
alter table public.casas add column if not exists lng double precision;

-- Estado ampliado para solicitudes desde la web
alter table public.reservas drop constraint if exists reservas_estado_check;
alter table public.reservas add constraint reservas_estado_check
  check (estado in ('activa', 'finalizada', 'cancelada', 'pendiente_contacto'));

-- ---------- RLS: lectura pública del catálogo ----------
alter table public.carros enable row level security;
alter table public.casas enable row level security;

drop policy if exists "Lectura publica carros" on public.carros;
create policy "Lectura publica carros"
  on public.carros for select
  to anon, authenticated
  using (disponible = true);

drop policy if exists "Lectura publica casas" on public.casas;
create policy "Lectura publica casas"
  on public.casas for select
  to anon, authenticated
  using (disponible = true);

-- ---------- RPC: reserva de vehículo ----------
create or replace function public.web_crear_reserva_carro(
  p_nombre text,
  p_telefono text,
  p_correo text,
  p_pasaporte text,
  p_carro_id uuid,
  p_fecha_inicio date,
  p_fecha_fin date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_carro record;
  v_dias integer;
  v_total numeric(12,2);
  v_reserva_id uuid;
  v_ref text;
begin
  if p_fecha_fin < p_fecha_inicio then
    raise exception 'fechas invalidas';
  end if;

  select * into v_carro from public.carros where id = p_carro_id and disponible = true;
  if not found then
    raise exception 'carro no disponible';
  end if;

  v_dias := greatest(1, (p_fecha_fin - p_fecha_inicio)::integer);
  v_total := round(v_carro.precio_por_dia * v_dias, 2);

  insert into public.clientes (nombre, telefono, correo, pasaporte_o_id)
  values (
    trim(p_nombre),
    trim(p_telefono),
    lower(trim(p_correo)),
    trim(p_pasaporte)
  )
  on conflict (correo) do update set
    nombre = excluded.nombre,
    telefono = excluded.telefono,
    pasaporte_o_id = excluded.pasaporte_o_id
  returning id into v_cliente_id;

  insert into public.reservas (cliente_id, fecha_inicio, fecha_fin, total, estado, notas)
  values (
    v_cliente_id,
    p_fecha_inicio,
    p_fecha_fin,
    v_total,
    'pendiente_contacto',
    'Solicitud web — vehículo'
  )
  returning id into v_reserva_id;

  insert into public.reserva_carros (reserva_id, carro_id, precio_por_dia, dias)
  values (v_reserva_id, p_carro_id, v_carro.precio_por_dia, v_dias);

  v_ref := 'RM-' || upper(substring(replace(v_reserva_id::text, '-', ''), 1, 8));

  update public.reservas
  set notas = coalesce(notas, '') || ' Ref: ' || v_ref
  where id = v_reserva_id;

  return jsonb_build_object(
    'ok', true,
    'reserva_id', v_reserva_id,
    'ref', v_ref,
    'total', v_total
  );
end;
$$;

-- ---------- RPC: reserva de casa ----------
create or replace function public.web_crear_reserva_casa(
  p_nombre text,
  p_telefono text,
  p_correo text,
  p_pasaporte text,
  p_casa_id uuid,
  p_fecha_inicio date,
  p_fecha_fin date,
  p_personas integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_casa record;
  v_noches integer;
  v_personas integer;
  v_total numeric(12,2);
  v_reserva_id uuid;
  v_ref text;
begin
  if p_fecha_fin < p_fecha_inicio then
    raise exception 'fechas invalidas';
  end if;

  v_personas := greatest(1, coalesce(p_personas, 1));

  select * into v_casa from public.casas where id = p_casa_id and disponible = true;
  if not found then
    raise exception 'casa no disponible';
  end if;

  v_noches := greatest(1, (p_fecha_fin - p_fecha_inicio)::integer);
  v_total := round(v_casa.precio_noche_persona * v_noches * v_personas, 2);

  insert into public.clientes (nombre, telefono, correo, pasaporte_o_id)
  values (
    trim(p_nombre),
    trim(p_telefono),
    lower(trim(p_correo)),
    trim(p_pasaporte)
  )
  on conflict (correo) do update set
    nombre = excluded.nombre,
    telefono = excluded.telefono,
    pasaporte_o_id = excluded.pasaporte_o_id
  returning id into v_cliente_id;

  insert into public.reservas (cliente_id, fecha_inicio, fecha_fin, total, estado, notas)
  values (
    v_cliente_id,
    p_fecha_inicio,
    p_fecha_fin,
    v_total,
    'pendiente_contacto',
    'Solicitud web — casa'
  )
  returning id into v_reserva_id;

  insert into public.reserva_casas (reserva_id, casa_id, precio_noche_persona, noches, personas)
  values (v_reserva_id, p_casa_id, v_casa.precio_noche_persona, v_noches, v_personas);

  v_ref := 'RM-' || upper(substring(replace(v_reserva_id::text, '-', ''), 1, 8));

  update public.reservas
  set notas = coalesce(notas, '') || ' Ref: ' || v_ref
  where id = v_reserva_id;

  return jsonb_build_object(
    'ok', true,
    'reserva_id', v_reserva_id,
    'ref', v_ref,
    'total', v_total
  );
end;
$$;

grant execute on function public.web_crear_reserva_carro(text, text, text, text, uuid, date, date) to anon, authenticated;
grant execute on function public.web_crear_reserva_casa(text, text, text, text, uuid, date, date, integer) to anon, authenticated;

commit;
