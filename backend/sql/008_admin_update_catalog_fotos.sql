-- Guardar fotos_urls (múltiples fotos) en Supabase desde el panel admin (catálogo remoto).
-- Requiere haber ejecutado 007_multi_fotos_catalogo.sql.
-- Usa el MISMO literal v_expected que en 005_admin_list_reservas.sql (adminSyncSecret).

begin;

create or replace function public.web_admin_update_carro_fotos(
  p_api_key text,
  p_carro_id uuid,
  p_fotos_urls jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected constant text := 'GCV-ADMIN-SYNC-KEY-CHANGEME';
  v_first text;
begin
  if coalesce(trim(p_api_key), '') is distinct from v_expected then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_first := nullif(trim(coalesce(p_fotos_urls->>0, '')), '');

  update public.carros
  set
    fotos_urls = coalesce(p_fotos_urls, '[]'::jsonb),
    foto_url = coalesce(v_first, foto_url)
  where id = p_carro_id;

  if found then
    return jsonb_build_object('ok', true);
  end if;
  return jsonb_build_object('ok', false, 'error', 'not_found');
end;
$$;

create or replace function public.web_admin_update_casa_fotos(
  p_api_key text,
  p_casa_id uuid,
  p_fotos_urls jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected constant text := 'GCV-ADMIN-SYNC-KEY-CHANGEME';
  v_first text;
begin
  if coalesce(trim(p_api_key), '') is distinct from v_expected then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_first := nullif(trim(coalesce(p_fotos_urls->>0, '')), '');

  update public.casas
  set
    fotos_urls = coalesce(p_fotos_urls, '[]'::jsonb),
    foto_url = coalesce(v_first, foto_url)
  where id = p_casa_id;

  if found then
    return jsonb_build_object('ok', true);
  end if;
  return jsonb_build_object('ok', false, 'error', 'not_found');
end;
$$;

grant execute on function public.web_admin_update_carro_fotos(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.web_admin_update_casa_fotos(text, uuid, jsonb) to anon, authenticated;

commit;

