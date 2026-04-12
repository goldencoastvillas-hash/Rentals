/**
 * Lee airbnb_ical_url de la casa (service role) y devuelve rangos ocupados en formato [start,end) por día.
 * Despliega: supabase functions deploy casa-airbnb-cal --no-verify-jwt
 * Secrets: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (automáticos en Supabase Hosting)
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function unfoldIcal(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function ymdFromIcalValue(v: string): string | null {
  const t = v.trim();
  const m = t.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const m2 = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function mergeRanges(ranges: { start: string; end: string }[]): { start: string; end: string }[] {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  const out: { start: string; end: string }[] = [];
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.start <= cur.end) {
      if (r.end > cur.end) cur.end = r.end;
    } else {
      out.push(cur);
      cur = { ...r };
    }
  }
  out.push(cur);
  return out;
}

function parseIcalBusy(ical: string): { start: string; end: string }[] {
  const u = unfoldIcal(ical);
  const ranges: { start: string; end: string }[] = [];
  const re = /BEGIN:VEVENT[\s\S]*?END:VEVENT/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(u))) {
    const block = m[0];
    if (/STATUS:CANCELLED/i.test(block)) continue;
    const ds = block.match(/DTSTART(?:;[^:\n]*)?:([^\r\n]+)/i);
    const de = block.match(/DTEND(?:;[^:\n]*)?:([^\r\n]+)/i);
    if (!ds) continue;
    const rawS = ds[1].trim();
    const s = ymdFromIcalValue(rawS.split("T")[0] ?? rawS);
    if (!s) continue;
    let e: string;
    if (de) {
      const rawE = de[1].trim();
      const eParsed = ymdFromIcalValue(rawE.split("T")[0] ?? rawE);
      e = eParsed ?? addDaysYmd(s, 1);
    } else {
      e = addDaysYmd(s, 1);
    }
    if (e <= s) e = addDaysYmd(s, 1);
    ranges.push({ start: s, end: e });
  }
  return mergeRanges(ranges);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  try {
    const url = new URL(req.url);
    const casaId = url.searchParams.get("casa_id");
    if (!casaId) {
      return new Response(JSON.stringify({ error: "casa_id requerido" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Configuración servidor incompleta" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: row, error } = await sb.from("casas").select("airbnb_ical_url").eq("id", casaId).maybeSingle();
    if (error) throw error;
    const icalUrl = row?.airbnb_ical_url as string | null | undefined;
    if (!icalUrl || !String(icalUrl).startsWith("http")) {
      return new Response(JSON.stringify({ ranges: [], source: "none" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const r = await fetch(icalUrl, { redirect: "follow" });
    if (!r.ok) {
      return new Response(JSON.stringify({ ranges: [], source: "airbnb", fetchError: r.status }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const text = await r.text();
    const ranges = parseIcalBusy(text);
    return new Response(JSON.stringify({ ranges, source: "airbnb" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg, ranges: [] }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
