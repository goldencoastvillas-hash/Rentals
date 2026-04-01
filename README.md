# Rentals Miami — marketplace (casas y carros)

Monorepo: **Express + Prisma + PostgreSQL** (Supabase) y **React + Vite + Tailwind**. Patrones **Observer** y **Memento** en reservas; sync externo vía **iCal**.

## Requisitos

- Node.js 20+
- Proyecto [Supabase](https://supabase.com) con PostgreSQL

## Configuración de Supabase

1. **Database → Connection string (URI)**  
   Copia la URI y sustituye la contraseña de la base de datos en `backend/.env` como `DATABASE_URL`.  
   No uses las claves `anon` / `service_role` como contraseña de Postgres: son JWT de la API REST.

2. Copia `backend/.env.example` a `backend/.env` y completa:
   - `DATABASE_URL` (con `?sslmode=require` si aplica)
   - `JWT_SECRET` (mínimo ~32 caracteres en producción)
   - Opcional: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (reservadas para integraciones futuras; Prisma solo usa `DATABASE_URL`)

3. **Seguridad:** si alguna clave se compartió en un chat o issue, **rótala** en Supabase → Settings → API Keys.

## Primera ejecución

```bash
npm install
cd backend
npx prisma migrate deploy
npm run db:seed
```

El seed crea el admin por defecto (`ADMIN_EMAIL` / `ADMIN_PASSWORD` en `.env`) y servicios de ejemplo.

## Desarrollo

En la raíz del monorepo:

```bash
npm run dev
```

- API: `http://localhost:4000` (`GET /api/health`)
- Frontend: `http://localhost:5173` (proxy a `/api`)

Por separado: `npm run dev:backend` y `npm run dev:frontend`.

## API relevante

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/servicios` | No |
| GET | `/api/servicios/map` | No |
| GET | `/api/servicios/:id/disponibilidad?from=&to=` | No |
| GET | `/api/servicios/:id/calendar.ics` | No (export iCal) |
| POST | `/api/servicios/:id/ical-import` | Admin JWT |
| POST | `/api/reservas` | No (rate limit) |
| POST | `/api/auth/login` | No |

## Sincronización con Airbnb / Booking

- Las APIs oficiales de reservas suelen exigir ser **partner** (Airbnb) o **Connectivity** (Booking.com). Este proyecto no las implementa de forma nativa.
- **Enfoque soportado:** calendario **iCal**
  - **Importar:** en admin, guarda `icalImportUrl` en el servicio (casa) o envía `POST /api/servicios/:id/ical-import` con `{ "url": "https://..." }` para descargar y bloquear fechas en `BloqueoCalendario`.
  - **Exportar:** enlaza `GET /api/servicios/:id/calendar.ics` en Airbnb/Booking como calendario externo para que vean tus reservas confirmadas.
- Los imports iCal suelen tener **retraso** y **riesgo de doble reserva** si no se revisa la disponibilidad en esta app.

## Producción

```bash
npm run build
```

Arranca el backend con `node backend/dist/index.js` (o `npm run start --workspace=backend`) y sirve `frontend/dist` con tu CDN o servidor estático. Define `FRONTEND_URL` en el backend para CORS.
