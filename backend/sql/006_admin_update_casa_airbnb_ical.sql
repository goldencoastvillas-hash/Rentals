-- Guardar airbnb_ical_url en Supabase desde el panel admin (catálogo remoto).
-- Opcional: solo si quieres que el enlace iCal de Airbnb se guarde al pulsar Guardar casa.
-- El literal v_expected DEBE ser el MISMO que en 005_admin_list_reservas.sql (misma línea que adminSyncSecret).
-- Ejecutar en el SQL Editor después de 004 y 005.

begin;

create or replace function public.web_admin_update_casa_airbnb_ical(
  p_api_key text,
  p_casa_id uuid,
  p_ical_url text
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

  update public.casas
  set airbnb_ical_url = nullif(trim(coalesce(p_ical_url, '')), '')
  where id = p_casa_id;

  if found then
    return jsonb_build_object('ok', true);
  end if;

  return jsonb_build_object('ok', false, 'error', 'not_found');
end;
$$;

grant execute on function public.web_admin_update_casa_airbnb_ical(text, uuid, text) to anon, authenticated;

commit;
