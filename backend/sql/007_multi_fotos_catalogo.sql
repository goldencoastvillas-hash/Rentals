-- Múltiples fotos por carro/casa (compatible con foto_url actual).
-- Ejecuta en Supabase SQL Editor después de 003.

begin;

alter table public.carros add column if not exists fotos_urls jsonb not null default '[]'::jsonb;
alter table public.casas add column if not exists fotos_urls jsonb not null default '[]'::jsonb;

comment on column public.carros.fotos_urls is 'Array JSON de URLs de fotos (ordenadas). La UI usa la primera como principal.';
comment on column public.casas.fotos_urls is 'Array JSON de URLs de fotos (ordenadas). La UI usa la primera como principal.';

-- Backfill: si no hay array, usar la foto_url existente como 1a imagen.
update public.carros
set fotos_urls = jsonb_build_array(foto_url)
where (fotos_urls is null or jsonb_array_length(fotos_urls) = 0)
  and coalesce(trim(foto_url), '') <> '';

update public.casas
set fotos_urls = jsonb_build_array(foto_url)
where (fotos_urls is null or jsonb_array_length(fotos_urls) = 0)
  and coalesce(trim(foto_url), '') <> '';

commit;

