const STORAGE_KEY = "rentals_lang";

const STRINGS = {
  es: {
    "nav.home": "Inicio",
    "nav.about": "Nosotros",
    "nav.services": "Servicios",
    "nav.airbnb": "Airbnb",
    "nav.admin": "Admin",
    "lang.es": "ES",
    "lang.en": "EN",
    "home.brand": "Golden Coast Villas Miami",
    "home.hero.title": "Villas exclusivas y carros de lujo en Miami",
    "home.hero.lead":
      "En Golden Coast Villas Miami el lujo es una experiencia: propiedades premium, movilidad de alto nivel y un equipo que cuida cada detalle antes de tu llegada.",
    "home.hero.cta.casas": "Ver casas",
    "home.hero.cta.carros": "Ver carros",
    "home.avail.title": "Disponible hoy",
    "home.avail.lead": "Explora nuestro catálogo. Reserva en línea y confirma por WhatsApp.",
    "home.avail.casas.title": "Casas",
    "home.avail.casas.sub": "Mapa + filtros tipo Airbnb",
    "home.avail.carros.title": "Carros",
    "home.avail.carros.sub": "Marca, cilindraje, tipo, asientos",
    "home.section.featured": "Destacados",
    "home.section.carousel": "Galería",
    "home.carousel.hint": "Desliza o usa las flechas · prioridad lujo",
    "featured.cars": "Carros",
    "featured.houses": "Casas",
    "featured.noCars": "Aún no hay carros publicados",
    "featured.noHouses": "Aún no hay casas publicadas",
    "featured.photos": "fotos",
    "featured.perNight": "/ noche",
    "featured.perDay": "/ día",
    "featured.viewCars": "Ver carros",
    "featured.viewHouses": "Ver casas",
    "featured.supabase": "Configura Supabase para cargar.",
    "featured.carouselEmpty": "Aún no hay fotos en el catálogo público.",
    "home.dev.title": "Estado del desarrollo",
    "home.dev.lead":
      "Catálogo (casas y carros), reservas y panel admin en construcción continua. Para soporte o información:",
    "home.dev.rights": "Nos reservamos todos los derechos ©",
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.services": "Services",
    "nav.airbnb": "Airbnb",
    "nav.admin": "Admin",
    "lang.es": "ES",
    "lang.en": "EN",
    "home.brand": "Golden Coast Villas Miami",
    "home.hero.title": "Exclusive villas and luxury cars in Miami",
    "home.hero.lead":
      "At Golden Coast Villas Miami, luxury is an experience: premium properties, high-end mobility, and a team that takes care of every detail before you arrive.",
    "home.hero.cta.casas": "View homes",
    "home.hero.cta.carros": "View cars",
    "home.avail.title": "Available today",
    "home.avail.lead": "Explore our catalog. Book online and confirm via WhatsApp.",
    "home.avail.casas.title": "Homes",
    "home.avail.casas.sub": "Map + Airbnb-style filters",
    "home.avail.carros.title": "Cars",
    "home.avail.carros.sub": "Brand, engine size, type, seats",
    "home.section.featured": "Highlights",
    "home.section.carousel": "Gallery",
    "home.carousel.hint": "Swipe or use arrows · luxury first",
    "featured.cars": "Cars",
    "featured.houses": "Homes",
    "featured.noCars": "No cars published yet",
    "featured.noHouses": "No homes published yet",
    "featured.photos": "photos",
    "featured.perNight": "/ night",
    "featured.perDay": "/ day",
    "featured.viewCars": "View cars",
    "featured.viewHouses": "View homes",
    "featured.supabase": "Configure Supabase to load data.",
    "featured.carouselEmpty": "No public catalog photos yet.",
    "home.dev.title": "Development status",
    "home.dev.lead":
      "Catalog (homes and cars), reservations, and admin panel under continuous development. For support or information:",
    "home.dev.rights": "All rights reserved ©",
  },
};

export function getLang() {
  const v = String(localStorage.getItem(STORAGE_KEY) || "es").toLowerCase();
  return v === "en" ? "en" : "es";
}

export function setLang(lang) {
  const next = lang === "en" ? "en" : "es";
  localStorage.setItem(STORAGE_KEY, next);
  applyI18nToDom();
  window.dispatchEvent(new CustomEvent("rentals-lang-change", { detail: { lang: next } }));
}

export function t(key) {
  const lang = getLang();
  return STRINGS[lang][key] ?? STRINGS.es[key] ?? key;
}

function applyEl(el) {
  const key = el.getAttribute("data-i18n");
  if (!key) return;
  const val = t(key);
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    if (el.hasAttribute("placeholder")) el.setAttribute("placeholder", val);
    else el.value = val;
  } else {
    el.textContent = val;
  }
}

export function applyI18nToDom() {
  document.querySelectorAll("[data-i18n]").forEach(applyEl);
}

export function bindLangControls() {
  document.querySelectorAll("[data-set-lang]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = btn.getAttribute("data-set-lang");
      setLang(lang);
    });
  });
}
