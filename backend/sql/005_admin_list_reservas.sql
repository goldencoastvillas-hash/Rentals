-- Lista de reservas para el panel admin (anon + clave compartida en RPC).
-- 1) Cambia el literal en v_expected por el mismo valor que pondrás en
--    GitHub Secret ADMIN_SYNC_SECRET y en adminSyncSecret de rentals-config.js
-- 2) Ejecuta en el SQL Editor de Supabase.

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
