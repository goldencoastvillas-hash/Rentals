-- =============================================================================
-- Lista de reservas en el panel admin (obligatorio si quieres ver reservas de Supabase).
-- Sin ejecutar este script y sin el secreto, el panel solo muestra reservas del navegador.
--
-- Pasos (elige UN texto secreto y úsalo en los tres sitios):
--
--   A) Abre este archivo y en la línea de v_expected (más abajo) sustituye
--      GCV-ADMIN-SYNC-KEY-CHANGEME por tu secreto, por ejemplo:
--      v_expected constant text := 'mi-clave-larga-y-secreta-2026';
--
--   B) Copia TODO el contenido de este archivo y pégalo en Supabase:
--      Dashboard → SQL → New query → Run (debe decir success).
--
--   C) Mismo texto en la web:
--      • GitHub Pages: repo → Settings → Secrets and variables → Actions →
--        New repository secret → Name: ADMIN_SYNC_SECRET  Value: (el mismo texto)
--        Luego ejecuta de nuevo el workflow “Deploy GitHub Pages”.
--      • Pruebas en tu PC: en frontend/rentals-config.js pon
--        adminSyncSecret: "el mismo texto"
--
--   D) Si usas 006_admin_update_casa_airbnb_ical.sql, el v_expected de esa función
--      debe ser EXACTAMENTE el mismo texto que aquí.
-- =============================================================================

begin;

create or replace function public.web_list_reservas_admin(p_api_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected constant text := 'GCV-ADMIN-SYNC-KEY-CHANGEME';
  j jsonb;
begin
  if coalesce(trim(p_api_key), '') is distinct from v_expected then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  select jsonb_build_object(
    'ok', true,
    'items', coalesce((
      select jsonb_agg(to_jsonb(t))
      from (
        select
          r.id,
          r.fecha_inicio::text as fecha_inicio,
          r.fecha_fin::text as fecha_fin,
          r.total,
          r.estado,
          r.notas,
          r.created_at::text as created_at,
          c.nombre as cliente_nombre,
          c.telefono,
          c.correo,
          carr.carro_id::text as carro_id,
          carr.car_marca,
          carr.car_modelo,
          cas.casa_id::text as casa_id,
          cas.personas,
          cas.casa_nombre
        from public.reservas r
        join public.clientes c on c.id = r.cliente_id
        left join lateral (
          select
            rc2.carro_id,
            cr2.marca as car_marca,
            cr2.modelo as car_modelo
          from public.reserva_carros rc2
          inner join public.carros cr2 on cr2.id = rc2.carro_id
          where rc2.reserva_id = r.id
          order by rc2.created_at
          limit 1
        ) carr on true
        left join lateral (
          select
            rcs2.casa_id,
            rcs2.personas,
            ca2.nombre as casa_nombre
          from public.reserva_casas rcs2
          inner join public.casas ca2 on ca2.id = rcs2.casa_id
          where rcs2.reserva_id = r.id
          order by rcs2.created_at
          limit 1
        ) cas on true
        order by r.created_at desc
        limit 300
      ) t
    ), '[]'::jsonb)
  ) into j;

  return coalesce(j, jsonb_build_object('ok', true, 'items', '[]'::jsonb));
end;
$$;

grant execute on function public.web_list_reservas_admin(text) to anon, authenticated;

commit;
