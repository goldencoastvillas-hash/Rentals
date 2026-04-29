-- Si ya ejecutaste 012 con políticas `authenticated` + is_admin(), el panel web (clave anon)
-- no podía insertar/actualizar/borrar casas, carros ni subir fotos. Este script alinea RLS
-- con el MVP de `000_supabase_reset_final.sql` (operaciones con rol anon permitidas).
-- Ejecuta una vez en Supabase → SQL Editor.

begin;

-- Casas
drop policy if exists casas_admin_write on public.casas;
create policy casas_admin_write on public.casas
for all
to anon, authenticated
using (true)
with check (true);

-- Carros
drop policy if exists carros_admin_write on public.carros;
create policy carros_admin_write on public.carros
for all
to anon, authenticated
using (true)
with check (true);

-- Reservas (panel admin + ocupación en calendario)
drop policy if exists reservas_admin_read on public.reservas;
create policy reservas_admin_read on public.reservas
for select
to anon, authenticated
using (true);

drop policy if exists reservas_admin_write on public.reservas;
create policy reservas_admin_write on public.reservas
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists reservas_admin_delete on public.reservas;
create policy reservas_admin_delete on public.reservas
for delete
to anon, authenticated
using (true);

-- Storage catálogo
drop policy if exists "catalog_media_admin_insert" on storage.objects;
create policy "catalog_media_admin_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'catalog-media');

drop policy if exists "catalog_media_admin_update" on storage.objects;
create policy "catalog_media_admin_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'catalog-media')
with check (bucket_id = 'catalog-media');

drop policy if exists "catalog_media_admin_delete" on storage.objects;
create policy "catalog_media_admin_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'catalog-media');

commit;
