-- Airbnb / calendario: URL iCal por casa + RPC de fechas bloqueadas por reservas propias
-- Ejecutar en Supabase SQL Editor después de 003.

begin;

alter table public.casas add column if not exists airbnb_ical_url text;

comment on column public.casas.airbnb_ical_url is
  'URL de exportación iCal de Airbnb (Anuncio → Disponibilidad → Conectar calendarios → Exportar). La Edge Function casa-airbnb-cal la lee en servidor.';

-- Reservas activas/pendientes sobre esta casa → intervalos [fecha_inicio, fecha_fin) en fechas calendario
create or replace function public.web_fechas_bloqueadas_casa(p_casa_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'start', r.fecha_inicio::text,
        'end', r.fecha_fin::text
      )
      order by r.fecha_inicio
    ),
    '[]'::jsonb
  )
  from public.reserva_casas rc
  join public.reservas r on r.id = rc.reserva_id
  where rc.casa_id = p_casa_id
    and r.estado <> 'cancelada';
$$;

grant execute on function public.web_fechas_bloqueadas_casa(uuid) to anon, authenticated;

commit;
