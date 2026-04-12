# Golden Coast Villas Rentals

Sitio estático para alquiler de **casas y carros** en Florida: una sola app en `frontend/index.html` (catálogo, reservas, WhatsApp al admin, mapa, calendario con bloqueos y opción Supabase).

## GitHub Pages

Pages sirve la **raíz del repositorio**. La web vive en **`frontend/`**, por eso en la raíz hay un `index.html` que **redirige** a `frontend/index.html`.

1. Repo → **Settings** → **Pages**
2. **Build and deployment**: Source **Deploy from a branch**
3. Branch **main**, carpeta **/ (root)**, Save

La URL será `https://<usuario>.github.io/Rentals/` y acabará en `.../Rentals/frontend/index.html`. Los enlaces del sitio son relativos, así que funcionan bajo esa ruta.

Archivo **`.nojekyll`** en la raíz evita que Jekyll procese el sitio y rompa rutas.

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
