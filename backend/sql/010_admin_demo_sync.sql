-- Si el login web dice "credenciales incorrectas": fuerza la RPC md5 y el usuario demo.
-- Ejecuta TODO en Supabase → SQL Editor (una vez).

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
    and a.password_hash = md5(p_password)
  limit 1;

  return jsonb_build_object('ok', coalesce(v_ok, false));
end;
$$;

grant execute on function public.web_admin_login(text, text, text) to anon, authenticated;

-- Asegura fila demo (mismo criterio que 000): usuario Admin + correo + md5(Admin123)
update public.admins
set
  email = 'admin@rentals.com',
  password_hash = md5('Admin123'),
  activo = true
where lower(trim(username)) = 'admin';

insert into public.admins (username, email, password_hash, activo)
select 'Admin', 'admin@rentals.com', md5('Admin123'), true
where not exists (
  select 1 from public.admins a where lower(trim(a.username)) = 'admin'
);

commit;
