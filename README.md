# Golden Coast Villas Rentals

Sitio estático para alquiler de **casas y carros** en Florida: una sola app en `frontend/index.html` (catálogo, reservas, WhatsApp al admin, mapa, calendario con bloqueos y opción Supabase).

## GitHub Pages (recomendado: GitHub Actions)

Si en Pages eliges **“Deploy from branch”** con carpeta **`/docs`**, GitHub **solo sube lo que hay dentro de `docs/`**. La carpeta `frontend/` **no se publica** y a menudo solo ves el **README**.

### Opción A — GitHub Actions (recomendada)

1. **Settings** → **Pages** → **Build and deployment** → elige **GitHub Actions** (no “Deploy from branch”).
2. Haz **push** a `main` (o ejecuta el workflow **Deploy GitHub Pages** a mano en la pestaña **Actions**).
3. El workflow **`.github/workflows/deploy-pages.yml`** sube el contenido de **`frontend/`** como **raíz del sitio**: la app queda en `https://<usuario>.github.io/Rentals/` sin `/frontend/` en la URL.

La primera vez, GitHub puede pedir aprobar permisos del workflow; acéptalos si aparece el aviso.

### Secrets de Actions (Supabase en Pages)

Sin esto, en el sitio publicado falla `rentals-config.js` vacío: no hay catálogo remoto, calendario Airbnb ni reservas enlazadas a la base.

En el repo: **Settings → Secrets and variables → Actions → New repository secret**, crea:

| Secret | Contenido |
|--------|-------------|
| `SUPABASE_URL` | Project URL (Settings → API) |
| `SUPABASE_ANON_KEY` | Clave **anon / public** (JWT o publishable) |
| `ADMIN_WHATSAPP_DIGITS` | Solo dígitos con código de país (ej. `573026661995`) |
| `ADMIN_SYNC_SECRET` | Mismo texto que `v_expected` en `backend/sql/005_admin_list_reservas.sql` (tras cambiarlo en el SQL y ejecutarlo en Supabase) |

Luego **Actions → Deploy GitHub Pages → Run workflow** (o un push a `main`). El workflow **sobrescribe** `frontend/rentals-config.js` en el artefacto con esos valores.

**Reservas en el panel admin desde otros dispositivos:** el listado mezcla `localStorage` con la API solo si ejecutaste **`005_admin_list_reservas.sql`** en Supabase y la clave coincide con `ADMIN_SYNC_SECRET` / `adminSyncSecret`.

### Opción B — Solo rama, carpeta raíz `/`

1. **Settings** → **Pages** → Source **Deploy from a branch**.
2. Branch **`main`**, carpeta **`/ (root)`** — **no** uses `/docs` a menos que copies ahí todo el sitio.
3. En la raíz del repo hay un `index.html` que redirige a `frontend/index.html`.

Archivo **`.nojekyll`** en la raíz evita que Jekyll altere archivos estáticos.

## Desarrollo local

```bash
cd frontend
npm run dev
```

Abre `http://localhost:5173` (sirve la carpeta `frontend`).

## Supabase

Scripts SQL en `backend/sql/` (orden sugerido: `000` … `004`). Función Edge opcional: `supabase/functions/casa-airbnb-cal` para importar iCal de Airbnb en servidor.

## Configuración sensible

En el repo hay un **`frontend/rentals-config.js`** plantilla (sin secretos reales) para que no falle la carga en GitHub Pages. Para **desarrollo local**, edita ese archivo con tu URL y clave **anon** de Supabase (nunca la *service role*). Opcional: `adminSyncSecret` igual que en `005_admin_list_reservas.sql`.

No hagas commit de claves personales: si rellenas `rentals-config.js` en local, revisa el diff antes de `git push` o usa un secreto distinto solo en tu máquina.
