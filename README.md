# Labandera

Sitio web de noticias (frontend) con API REST (backend) para autenticación, gestión de artículos, categorías e imágenes.

## Estructura del repositorio

```
├── backend/    # API Express + Prisma (PostgreSQL)
│   ├── prisma/     # Schema, migraciones y seed
│   ├── src/
│   │   ├── controllers/   # Lógica de endpoints
│   │   ├── routes/        # Definición de rutas
│   │   ├── middlewares/   # Autenticación (JWT) y RBAC
│   │   ├── features/      # Módulos por funcionalidad (twofactor)
│   │   └── index.ts       # Punto de entrada
│   └── uploads/    # Imágenes subidas (no versionado)
├── frontend/   # SPA Vite + React + Tailwind
│   └── src/app/
│       ├── pages/       # Páginas (login, registro, secciones, seguridad)
│       ├── components/  # Componentes de UI
│       ├── hooks/       # Hooks personalizados
│       └── services/    # Cliente HTTP y llamadas a la API
├── docs/       # Documentación (pruebas manuales, RBAC, reportes)
└── README.md
```

## Requisitos

- Node.js 18+
- [pnpm](https://pnpm.io) (gestor de paquetes del proyecto)
- PostgreSQL (local o remoto)

## Puesta en marcha

### 1. Backend

```bash
cd backend
pnpm install

# Variables de entorno (crear backend/.env)
# DATABASE_URL=postgresql://usuario:password@host:5432/labandera
# JWT_SECRET=<cadena-secreta>

pnpm db:generate   # Generar cliente Prisma
pnpm db:migrate    # Aplicar migraciones
pnpm db:seed       # (Opcional) Cargar datos iniciales

pnpm dev           # Arrancar en http://localhost:3000 (nodemon + ts-node)
```

Build de producción: `pnpm build && pnpm start`

### 2. Frontend

```bash
cd frontend
pnpm install
pnpm dev           # Arrancar en http://localhost:5173
```

El proxy de Vite (`vite.config.ts`) reenvía `/api` y `/uploads` a `http://localhost:3000`, así que el backend debe estar corriendo.

Build de producción: `pnpm build`

### 3. 2FA (TOTP)

- En la página `/security` del frontend: **ACTIVAR 2FA** → escanea el QR con
  cualquier app TOTP (Aegis, Authy, Google Authenticator, o una app TOTP del
  smart watch) → confirma el código de 6 dígitos → guarda los 10 códigos de
  respaldo (se muestran una sola vez).
- Desde entonces, el login tiene dos pasos: contraseña y código TOTP (o código
  de respaldo). El token pendiente de 5 minutos no se guarda en el navegador.
- Detalle en [`docs/2fa.md`](docs/2fa.md).
- **App de smart watch (Wear OS)**: [`wear-app/`](wear-app/README.md) — escanea el
  mismo QR desde un reloj (emulador de Wear OS de Android Studio) y muestra
  el código TOTP de 6 dígitos con countdown de 30 s. Sin cambios en backend.

## Scripts de referencia

| App      | Script         | Descripción                          |
|----------|----------------|--------------------------------------|
| backend  | `pnpm dev`     | Servidor en modo desarrollo          |
| backend  | `pnpm build`   | Compila TypeScript a `dist/`         |
| backend  | `pnpm start`   | Ejecuta `dist/index.js`              |
| backend  | `pnpm db:migrate` | Aplica migraciones de Prisma        |
| backend  | `pnpm db:seed` | Carga datos iniciales                |
| frontend | `pnpm dev`     | Servidor Vite en modo desarrollo     |
| frontend | `pnpm build`   | Build de producción a `dist/`        |

## Documentación

- [`docs/pruebas-manuales.md`](docs/pruebas-manuales.md) — Pruebas manuales del sitio
- [`docs/pruebas-rbac.md`](docs/pruebas-rbac.md) — Pruebas de control de acceso por roles
- [`docs/2fa.md`](docs/2fa.md) — Autenticación de dos factores (TOTP): endpoints, flujo y decisiones de seguridad
- [`docs/mer-2fa.mmd`](docs/mer-2fa.mmd) — Diagrama del modelo de datos y secuencia del 2FA
- [`docs/mer-auth.mmd`](docs/mer-auth.mmd) — Diagrama del flujo de autenticación
- [`docs/evidencia-practicas-9-10.md`](docs/evidencia-practicas-9-10.md) — Evidencia de prácticas
