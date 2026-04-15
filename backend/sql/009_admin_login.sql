-- Login real del admin (usuario + correo + contraseña).
-- Ejecuta en Supabase SQL Editor después de 001_schema_rentals.sql (tabla admins).
-- Esta RPC NO expone hashes; solo valida credenciales.

begin;

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

commit;

