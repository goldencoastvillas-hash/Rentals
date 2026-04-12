-- Actualiza columnas updated_at en carros y casas (ejecutar si ya aplicaste 001_schema_rentals.sql)

begin;

alter table public.carros add column if not exists updated_at timestamptz not null default now();
alter table public.casas add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_carros_updated_at on public.carros;
create trigger trg_carros_updated_at
  before update on public.carros
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_casas_updated_at on public.casas;
create trigger trg_casas_updated_at
  before update on public.casas
  for each row execute procedure public.set_updated_at();

commit;
