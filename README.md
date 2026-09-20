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
│   │   └── index.ts       # Punto de entrada
│   └── uploads/    # Imágenes subidas (no versionado)
├── frontend/   # SPA Vite + React + Tailwind
│   └── src/app/
│       ├── pages/       # Páginas (login, registro, secciones)
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
- [`docs/mer-auth.mmd`](docs/mer-auth.mmd) — Diagrama del flujo de autenticación
- [`docs/evidencia-practicas-9-10.md`](docs/evidencia-practicas-9-10.md) — Evidencia de prácticas
