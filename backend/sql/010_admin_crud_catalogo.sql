-- CRUD completo del catálogo (carros y casas) desde la web admin.
-- Protegido por clave compartida p_api_key (igual a adminSyncSecret / ADMIN_SYNC_SECRET).
-- Ejecutar en Supabase SQL Editor después de 003 y 007.
--
-- IMPORTANTE: cambia v_expected por tu secreto real y usa el mismo en GitHub/Pages.

begin;

-- =========================
-- Carros: upsert
-- =========================
create or replace function public.web_admin_upsert_carro(
  p_api_key text,
  p_id uuid,
  p_marca text,
  p_modelo text,
  p_cilindraje text,
  p_precio_por_dia numeric,
  p_foto_url text,
  p_fotos_urls jsonb,
  p_disponible boolean,
  p_categoria text,
  p_transmision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected constant text := 'GCV-ADMIN-SYNC-KEY-CHANGEME';
  v_id uuid;
  v_first text;
begin
  if coalesce(trim(p_api_key), '') is distinct from v_expected then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_first := nullif(trim(coalesce(p_fotos_urls->>0, p_foto_url, '')), '');
  if coalesce(trim(p_marca), '') = '' or coalesce(trim(p_modelo), '') = '' or coalesce(trim(p_cilindraje), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_fields');
  end if;
  if p_precio_por_dia is null or p_precio_por_dia < 0 then
    return jsonb_build_object('ok', false, 'error', 'precio_invalido');
  end if;

  if p_id is null then
    insert into public.carros (
      marca, modelo, cilindraje, precio_por_dia, foto_url, fotos_urls, disponible, categoria, transmision
    ) values (
      trim(p_marca),
      trim(p_modelo),
      trim(p_cilindraje),
      p_precio_por_dia,
      v_first,
      coalesce(p_fotos_urls, '[]'::jsonb),
      coalesce(p_disponible, true),
      coalesce(nullif(trim(p_categoria), ''), 'sedan'),
      coalesce(nullif(trim(p_transmision), ''), 'automatica')
    )
    returning id into v_id;
  else
    update public.carros
    set
      marca = trim(p_marca),
      modelo = trim(p_modelo),
      cilindraje = trim(p_cilindraje),
      precio_por_dia = p_precio_por_dia,
      foto_url = coalesce(v_first, foto_url),
      fotos_urls = coalesce(p_fotos_urls, fotos_urls, '[]'::jsonb),
      disponible = coalesce(p_disponible, disponible),
      categoria = coalesce(nullif(trim(p_categoria), ''), categoria),
      transmision = coalesce(nullif(trim(p_transmision), ''), transmision)
    where id = p_id
    returning id into v_id;
  end if;

  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  return jsonb_build_object('ok', true, 'id', v_id::text);
end;
$$;

-- =========================
-- Carros: delete
-- =========================
create or replace function public.web_admin_delete_carro(
  p_api_key text,
  p_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected constant text := 'GCV-ADMIN-SYNC-KEY-CHANGEME';
begin
  if coalesce(trim(p_api_key), '') is distinct from v_expected then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  delete from public.carros where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- =========================
-- Casas: upsert
-- =========================
create or replace function public.web_admin_upsert_casa(
  p_api_key text,
  p_id uuid,
  p_nombre text,
  p_ubicacion text,
  p_precio_noche_persona numeric,
  p_foto_url text,
  p_fotos_urls jsonb,
  p_disponible boolean,
  p_tipo_inmueble text,
  p_cuartos integer,
  p_banos integer,
  p_mascotas boolean,
  p_aire_acondicionado boolean,
  p_estacionamiento boolean,
  p_piscina boolean,
  p_lat double precision,
  p_lng double precision,
  p_airbnb_ical_url text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected constant text := 'GCV-ADMIN-SYNC-KEY-CHANGEME';
  v_id uuid;
  v_first text;
begin
  if coalesce(trim(p_api_key), '') is distinct from v_expected then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_first := nullif(trim(coalesce(p_fotos_urls->>0, p_foto_url, '')), '');
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_ubicacion), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_fields');
  end if;
  if p_precio_noche_persona is null or p_precio_noche_persona < 0 then
    return jsonb_build_object('ok', false, 'error', 'precio_invalido');
  end if;

  if p_id is null then
    insert into public.casas (
      nombre, ubicacion, precio_noche_persona, foto_url, fotos_urls, disponible,
      tipo_inmueble, cuartos, banos, mascotas, aire_acondicionado, estacionamiento, piscina,
      lat, lng, airbnb_ical_url
    ) values (
      trim(p_nombre),
      trim(p_ubicacion),
      p_precio_noche_persona,
      v_first,
      coalesce(p_fotos_urls, '[]'::jsonb),
      coalesce(p_disponible, true),
      coalesce(nullif(trim(p_tipo_inmueble), ''), 'casa'),
      greatest(1, coalesce(p_cuartos, 1)),
      greatest(1, coalesce(p_banos, 1)),
      coalesce(p_mascotas, false),
      coalesce(p_aire_acondicionado, true),
      coalesce(p_estacionamiento, true),
      coalesce(p_piscina, false),
      p_lat,
      p_lng,
      nullif(trim(coalesce(p_airbnb_ical_url, '')), '')
    )
    returning id into v_id;
  else
    update public.casas
    set
      nombre = trim(p_nombre),
      ubicacion = trim(p_ubicacion),
      precio_noche_persona = p_precio_noche_persona,
      foto_url = coalesce(v_first, foto_url),
      fotos_urls = coalesce(p_fotos_urls, fotos_urls, '[]'::jsonb),
      disponible = coalesce(p_disponible, disponible),
      tipo_inmueble = coalesce(nullif(trim(p_tipo_inmueble), ''), tipo_inmueble),
      cuartos = greatest(1, coalesce(p_cuartos, cuartos)),
      banos = greatest(1, coalesce(p_banos, banos)),
      mascotas = coalesce(p_mascotas, mascotas),
      aire_acondicionado = coalesce(p_aire_acondicionado, aire_acondicionado),
      estacionamiento = coalesce(p_estacionamiento, estacionamiento),
      piscina = coalesce(p_piscina, piscina),
      lat = coalesce(p_lat, lat),
      lng = coalesce(p_lng, lng),
      airbnb_ical_url = nullif(trim(coalesce(p_airbnb_ical_url, airbnb_ical_url, '')), '')
    where id = p_id
    returning id into v_id;
  end if;

  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  return jsonb_build_object('ok', true, 'id', v_id::text);
end;
$$;

-- =========================
-- Casas: delete
-- =========================
create or replace function public.web_admin_delete_casa(
  p_api_key text,
  p_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected constant text := 'GCV-ADMIN-SYNC-KEY-CHANGEME';
begin
  if coalesce(trim(p_api_key), '') is distinct from v_expected then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  delete from public.casas where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.web_admin_upsert_carro(text, uuid, text, text, text, numeric, text, jsonb, boolean, text, text) to anon, authenticated;
grant execute on function public.web_admin_delete_carro(text, uuid) to anon, authenticated;
grant execute on function public.web_admin_upsert_casa(text, uuid, text, text, numeric, text, jsonb, boolean, text, integer, integer, boolean, boolean, boolean, boolean, double precision, double precision, text) to anon, authenticated;
grant execute on function public.web_admin_delete_casa(text, uuid) to anon, authenticated;

commit;

