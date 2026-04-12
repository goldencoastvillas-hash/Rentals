# Golden Coast Villas Rentals

Sitio estático para alquiler de **casas y carros** en Florida: una sola app en `frontend/index.html` (catálogo, reservas, WhatsApp al admin, mapa, calendario con bloqueos y opción Supabase).

## GitHub Pages (recomendado: GitHub Actions)

Si en Pages eliges **“Deploy from branch”** con carpeta **`/docs`**, GitHub **solo sube lo que hay dentro de `docs/`**. La carpeta `frontend/` **no se publica** y a menudo solo ves el **README**.

### Opción A — GitHub Actions (recomendada)

1. **Settings** → **Pages** → **Build and deployment** → elige **GitHub Actions** (no “Deploy from branch”).
2. Haz **push** a `main` (o ejecuta el workflow **Deploy GitHub Pages** a mano en la pestaña **Actions**).
3. El workflow **`.github/workflows/deploy-pages.yml`** sube el contenido de **`frontend/`** como **raíz del sitio**: la app queda en `https://<usuario>.github.io/Rentals/` sin `/frontend/` en la URL.

La primera vez, GitHub puede pedir aprobar permisos del workflow; acéptalos si aparece el aviso.

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

No subas claves al repo. Copia `frontend/rentals-config.example.js` a `frontend/rentals-config.js` (este archivo está en `.gitignore`) y rellena URL y anon key de Supabase y el WhatsApp del administrador.
