/**
 * Admin: subir imágenes a Supabase Storage y guardar URLs en carros/casas.
 * Despliega: supabase functions deploy admin-media-upload --no-verify-jwt
 *
 * Requiere:
 * - Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SYNC_SECRET
 * - SQL: 007_multi_fotos_catalogo.sql (fotos_urls)
 *
 * Cliente envía:
 * - Header: x-admin-sync-secret: <adminSyncSecret>
 * - Query: tipo=carro|casa, id=<uuid>, mode=replace|append (opcional)
 * - Body: multipart/form-data con campo "files" (uno o varios)
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-sync-secret",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function uniqUrls(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of list) {
    const s = String(u ?? "").trim();
    if (!s) continue;
    if (!/^https?:\/\//i.test(s)) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  try {
    const url = new URL(req.url);
    const tipo = (url.searchParams.get("tipo") || "").trim();
    const id = (url.searchParams.get("id") || "").trim();
    const mode = (url.searchParams.get("mode") || "replace").trim(); // replace | append
    if (tipo !== "casa" && tipo !== "carro") return json(400, { ok: false, error: "tipo_invalido" });
    if (!id) return json(400, { ok: false, error: "id_requerido" });

    const expected = (Deno.env.get("ADMIN_SYNC_SECRET") ?? "").trim();
    const got = (req.headers.get("x-admin-sync-secret") ?? "").trim();
    if (!expected || got !== expected) return json(403, { ok: false, error: "forbidden" });

    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
    const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
    if (!supabaseUrl || !serviceKey) return json(500, { ok: false, error: "server_config" });

    const sb = createClient(supabaseUrl, serviceKey);

    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return json(400, { ok: false, error: "multipart_requerido" });
    }
    const fd = await req.formData();
    const files = fd.getAll("files").filter((x) => x instanceof File) as File[];
    if (!files.length) return json(400, { ok: false, error: "files_requerido" });
    if (files.length > 15) return json(400, { ok: false, error: "max_15_files" });

    const bucket = "media";

    // Asegurar bucket público (idempotente)
    const { data: buckets, error: bErr } = await sb.storage.listBuckets();
    if (bErr) throw bErr;
    const exists = (buckets || []).some((b) => b.name === bucket);
    if (!exists) {
      const { error: cErr } = await sb.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: "15MB",
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
      });
      if (cErr) throw cErr;
    }

    const urls: string[] = [];
    for (const f of files) {
      const size = f.size ?? 0;
      if (size <= 0) continue;
      if (size > 15 * 1024 * 1024) return json(400, { ok: false, error: "file_too_large" });

      const extGuess = (f.name || "").split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = extGuess.replace(/[^a-z0-9]/g, "").slice(0, 6) || "jpg";
      const objectPath = `${tipo}/${id}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
      const buf = new Uint8Array(await f.arrayBuffer());

      const { error: upErr } = await sb.storage.from(bucket).upload(objectPath, buf, {
        upsert: false,
        contentType: f.type || undefined,
        cacheControl: "3600",
      });
      if (upErr) throw upErr;

      const { data } = sb.storage.from(bucket).getPublicUrl(objectPath);
      urls.push(data.publicUrl);
    }

    const nextUrls = uniqUrls(urls);
    if (!nextUrls.length) return json(400, { ok: false, error: "no_uploads" });

    const table = tipo === "casa" ? "casas" : "carros";
    let finalUrls = nextUrls;
    if (mode === "append") {
      const { data: row, error } = await sb.from(table).select("fotos_urls, foto_url").eq("id", id).maybeSingle();
      if (error) throw error;
      const prev = Array.isArray(row?.fotos_urls) ? (row?.fotos_urls as string[]) : [];
      finalUrls = uniqUrls([...prev, ...nextUrls]);
    }

    const { error: uErr } = await sb
      .from(table)
      .update({ fotos_urls: finalUrls, foto_url: finalUrls[0] || null })
      .eq("id", id);
    if (uErr) throw uErr;

    return json(200, { ok: true, urls: finalUrls });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(500, { ok: false, error: msg });
  }
});

