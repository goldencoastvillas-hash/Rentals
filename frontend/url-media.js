/**
 * Normaliza URLs de imágenes para uso en <img> (Imgur, páginas HTML, etc.).
 * Imgur suele funcionar mejor con i.imgur.com + extensión y referrerPolicy no-referrer en el tag.
 */
export function normalizePhotoUrl(raw) {
  let u = String(raw || "").trim();
  if (!u) return "";

  if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");

  try {
    const url = new URL(u);

    // imgur.com/XXXXX o www.imgur.com/XXXXX (id alfanumérico)
    const pageMatch = /^\/([a-z0-9]{5,10})$/i.exec(url.pathname);
    if ((url.hostname === "imgur.com" || url.hostname === "www.imgur.com") && pageMatch && !url.pathname.includes("/gallery/")) {
      return `https://i.imgur.com/${pageMatch[1]}.jpg`;
    }

    // /gallery/abc  -> intento directo (a veces funciona para un solo id)
    const gal = url.pathname.match(/\/gallery\/([a-z0-9]+)/i);
    if (gal && (url.hostname === "imgur.com" || url.hostname === "www.imgur.com")) {
      return `https://i.imgur.com/${gal[1]}.jpg`;
    }

    // i.imgur.com/xxx sin extensión
    if (url.hostname === "i.imgur.com") {
      const base = url.pathname.replace(/^\//, "");
      if (base && !/\.[a-z0-9]{2,4}$/i.test(base)) {
        url.pathname = "/" + base + ".jpg";
      }
      return url.toString();
    }
  } catch (_e) {
    return u;
  }

  return u;
}

export function normalizePhotoUrls(urls) {
  return (urls || []).map((x) => normalizePhotoUrl(x)).filter(Boolean);
}
