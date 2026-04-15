import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function reqEnv(name) {
  const v = (process.env[name] || "").trim();
  if (!v) throw new Error(`Falta ${name} en backend/.env`);
  return v;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[k] = v;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function normalizeList(s) {
  if (!s) return [];
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function safeExt(file) {
  const e = path.extname(file).toLowerCase();
  if (!e) return "";
  if (e.length > 8) return "";
  return e.replace(/[^a-z0-9.]/g, "");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const tipo = String(args.tipo || "").trim(); // casa | carro
  const id = String(args.id || "").trim(); // uuid
  const files = normalizeList(args.files || "");

  const bucket = String(args.bucket || "media").trim();
  const folder = String(args.folder || tipo).trim(); // casa/carro
  const makePublic = String(args.public || "true").trim().toLowerCase() !== "false";

  if (!tipo || (tipo !== "casa" && tipo !== "carro")) {
    throw new Error("Usa --tipo casa|carro");
  }
  if (!id) {
    throw new Error("Falta --id <uuid>");
  }
  if (!files.length) {
    throw new Error("Falta --files \"ruta1.jpg,ruta2.png\" (separado por comas)");
  }

  const supabaseUrl = reqEnv("SUPABASE_URL");
  const serviceKey = reqEnv("SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Asegura bucket
  const { data: buckets, error: bErr } = await sb.storage.listBuckets();
  if (bErr) throw bErr;
  const exists = (buckets || []).some((b) => b.name === bucket);
  if (!exists) {
    const { error: cErr } = await sb.storage.createBucket(bucket, {
      public: makePublic,
      fileSizeLimit: 15 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
    });
    if (cErr) throw cErr;
  }

  const urls = [];
  for (const f of files) {
    const abs = path.resolve(f);
    if (!fs.existsSync(abs)) throw new Error(`No existe: ${abs}`);
    const buf = fs.readFileSync(abs);
    const base = path.basename(abs, path.extname(abs));
    const ext = safeExt(abs) || ".jpg";
    const objectPath = `${folder}/${id}/${Date.now()}-${base}${ext}`;
    const { error: upErr } = await sb.storage.from(bucket).upload(objectPath, buf, {
      upsert: false,
      contentType: undefined,
      cacheControl: "3600",
    });
    if (upErr) throw upErr;

    if (makePublic) {
      const { data } = sb.storage.from(bucket).getPublicUrl(objectPath);
      urls.push(data.publicUrl);
    } else {
      // URL firmada 10 años (si necesitas privado, cambia aquí)
      const { data, error } = await sb.storage.from(bucket).createSignedUrl(objectPath, 60 * 60 * 24 * 365 * 10);
      if (error) throw error;
      urls.push(data.signedUrl);
    }
  }

  const table = tipo === "casa" ? "casas" : "carros";
  const { error: uErr } = await sb
    .from(table)
    .update({ fotos_urls: urls, foto_url: urls[0] || null })
    .eq("id", id);
  if (uErr) throw uErr;

  // Salida (para copiar/pegar)
  process.stdout.write(urls.join("\n") + "\n");
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

