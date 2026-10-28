# Informe de implementación — Práctica 7: Evaluación de calidad de software mediante pruebas de caja negra (Black Box Testing)

**Proyecto evaluado:** Labandera — sitio web de noticias (frontend SPA React + Vite) con API REST (backend Express + Prisma + PostgreSQL), alojado en servidor.
**Fecha:** 2026-10-23
**Documento de referencia:** [`docs/practica7-blackbox.md`](practica7-blackbox.md) (plan detallado con matriz completa de casos de prueba).

---

## 1. Objetivo del informe

Determinar si la Práctica 7 puede implementarse sobre el proyecto Labandera y describir **cómo** implementarla: qué funcionalidades se prueban, qué requisitos verificables se definen, qué evidencia se produce y cómo se emite el veredicto de aceptación/rechazo de la entrega.

## 2. Análisis de la práctica

La práctica exige evaluar el software **solo por su comportamiento observable** (entradas → salidas/estados), sin inspeccionar el código interno. El método de 8 pasos se aplica así:

1. **Inventario de funcionalidades** → se levantó a partir de las rutas del backend (`src/routes/`, `src/features/twofactor/`) y las páginas/guards del frontend (`src/app/pages/`, `src/app/components/*Guard.tsx`).
2. **Entradas de cada función** → cuerpos JSON de los endpoints, parámetros de ruta, archivos subidos, rutas del navegador y sesión en `localStorage`.
3. **Restricciones** → esquemas Zod (`src/schemas/*.ts`), límites de subida (`5 MB`, MIME por bytes mágicos), roles (`src/constants/roles.ts`), TTLs (`pendingToken` 5 min, JWT 7 días).
4. **Salidas esperadas** → códigos HTTP (200/201/400/401/403/404/409/413/415/429), mensajes JSON, redirecciones del SPA y cambios en la BD.
5. **Errores a manejar** → validaciones por campo, credenciales inválidas, tokens inválidos, rate limiting, JSON malformado, rutas inexistentes.
6. **Identificadores únicos** → `REQ-OP-01…04`, `REQ-VAL-01…03`, `REQ-PER-01…02`, `REQ-NAV-01…02`, `REQ-ERR-01`, `REQ-BIZ-01`.
7. **Criterio de aceptación medible** → cada requisito declara una condición verificable (código HTTP exacto, estado en BD, redirección observada, expiración de token).
8. **Requisitos no verificables** → se identificaron 4 (NV-01…NV-04), p. ej. la ausencia de búsqueda/filtrado de artículos por parámetros de consulta.

## 3. Factibilidad: ¿cumple el proyecto los criterios recomendados?

| Criterio de la práctica | Presente en Labandera | Evidencia en el proyecto |
|---|---|---|
| Autenticación / control de acceso | ✅ | Login/registro con JWT (7 días), 2FA TOTP con códigos de respaldo, rate limit por IP (15 intentos/15 min en auth; 5 en `verify-2fa`) |
| Formularios de registro | ✅ | `RegisterPage`, `LoginPage`, `UploadPage`, `SecurityPage` |
| Consulta / búsqueda / filtrado | ⚠️ parcial | `GET /api/articles` y `GET /api/articles/:id` (sin parámetros de filtro → NV-01) |
| Modificación y eliminación | ✅ | `PUT/DELETE /api/articles/:id`, CRUD de categorías |
| Reglas de negocio verificables | ✅ | RBAC por rol (Usuario/Editor/Administrador), 2FA pendiente de 5 min, códigos de respaldo de uso único |
| Diferentes pantallas, módulos o roles | ✅ | 3 roles, páginas públicas, `/upload`, `/estadisticas`, `/security` |
| Persistencia | ✅ | PostgreSQL vía Prisma; seed con 3 usuarios y artículos |
| Confirmaciones y manejo de errores | ✅ | Manejador global de errores, mensajes Zod por campo, redirecciones de guards |

**Conclusión de factibilidad:** el proyecto **sí** permite implementar la práctica completa, con la salvedad de que la búsqueda/filtrado no existe como funcionalidad (se documenta como requisito no verificable, no como defecto).

## 4. Inventario de funcionalidades a probar (resumen)

| # | Funcionalidad | Entradas | Restricciones | Salidas | Errores |
|---|---|---|---|---|---|
| F1 | Registro de usuario | nombre, email, contraseña | nombre 2–100; email válido; contraseña 6–72; email único | `201` + JWT (7 días) + rol `Usuario` | `400` por campo (Zod); `400` email duplicado |
| F2 | Inicio de sesión | email, contraseña | credenciales válidas; 15 intentos/15 min por IP | `200` + token; con 2FA: `requires2fa`, `pendingToken` (5 min), `otpauthUri` | `401`; `429` |
| F3 | 2FA (setup/verify/deshabilitar) | contraseña, código TOTP, código de respaldo | contraseña correcta; código válido; respaldo de uso único | `201` + 10 códigos de respaldo; token definitivo; `200` al deshabilitar | `400`, `401`, `429` (6.º intento) |
| F4 | Crear artículo | título, slug, resumen, cuerpo, estado, categoría, imágenes | título ≥3; slug `^[a-z0-9-]+$`; categoryId UUID; imágenes JPEG/PNG/GIF/WebP ≤5 MB (bytes mágicos) | `201` + artículo visible | `401`, `403`, `400`, `413`, `415`, `409` slug duplicado |
| F5 | Modificar/eliminar artículo | id UUID, campos | id existente; PUT: Editor/Admin; DELETE: solo Admin | `200` con cambios / mensaje de eliminación | `401`, `403`, `404`, `409` |
| F6 | CRUD de categorías | nombre, id | nombre 2–100; solo Admin | `201`/`200` | `400`, `401`, `403`, `404` |
| F7 | Consulta de artículos/categorías | id opcional | — | `200` + lista/artículo con autor, categoría e imágenes | `404` |
| F8 | Navegación y guards del SPA | ruta, sesión en localStorage | rol según ruta | redirecciones: `/upload`→`/login` o `/`; `/estadisticas` solo Admin; `/login`→`/` si autenticado | redirección silenciosa |
| F9 | Manejo global de errores | peticiones malformadas | — | `404` genérico; `400` sin stack trace; `401`; `429`; `500` genérico | — |

## 5. Requisitos verificables (13, superan el mínimo de 12)

Distribución exigida: **4 operaciones principales + 3 validaciones + 2 persistencia + 2 navegación/roles + 1 manejo de errores**, más 1 regla de negocio (2FA).

| ID | Tipo | Requisito (resumen) | Criterio de aceptación medible |
|---|---|---|---|
| REQ-OP-01 | Operación | Registro de usuario | `201` + token + rol `Usuario`; login posterior con esas credenciales → `200` |
| REQ-OP-02 | Operación | Inicio de sesión (con y sin 2FA) | Sin 2FA: `200` + JWT exp−iat = 604800 s. Con 2FA: `pendingToken` expira a los 5 min |
| REQ-OP-03 | Operación | Crear artículo (Editor/Admin) | `201`; persiste tras reiniciar backend; `GET /:id` devuelve autor, categoría e imágenes |
| REQ-OP-04 | Operación | Modificar y eliminar artículo | `PUT` → `200` con cambios; `DELETE` → `200` y `GET /:id` → `404`; BD sin registro |
| REQ-VAL-01 | Validación | Validación de registro | Cada campo inválido (nombre <2, email mal, contraseña <6) produce su mensaje específico; límites 2/100 y 6/72 aceptados |
| REQ-VAL-02 | Validación | Validación de login | Contraseña incorrecta y email inexistente devuelven el **mismo** `401` genérico |
| REQ-VAL-03 | Validación | Carga de artículo e imágenes | slug con espacios → `400`; categoryId no UUID → `400`; `PUT` vacío → `400`; `.exe` renombrado `.jpg` → `415`; PNG 6 MB → `413`; JPG 5 MB exacto → `201` |
| REQ-PER-01 | Persistencia | Consistencia CRUD | crear→leer→editar→leer→eliminar→leer consistente en cada paso (`psql` + frontend); datos persisten tras reinicio |
| REQ-PER-02 | Persistencia | Integridad | email duplicado → `400`; slug duplicado → `409`; `PUT` con categoryId inexistente → `409` sin estado parcial |
| REQ-NAV-01 | Roles/permisos | RBAC en API | Editor: `DELETE /articles/:id` → `403`; Usuario: `POST /articles` → `403`; Editor: `POST /categories` → `403`; sin token → `401`; Admin pasa todo |
| REQ-NAV-02 | Navegación | Guards del SPA | `/upload` sin sesión → `/login`; con Usuario → `/`; con Editor → formulario; `/estadisticas` con Editor → `/`; con Admin → página; `/login` autenticado → `/` |
| REQ-ERR-01 | Manejo de errores | Respuesta ante errores e interrupciones | Ruta inexistente → `404` genérico; token malformado → `401`; JSON malformado → `400` sin stack trace; 16.º login en 15 min → `429`; 6.º `verify-2fa` → `429` |
| REQ-BIZ-01 | Regla de negocio | Flujo 2FA completo | `setup` → `verify-setup` → `201` + 10 respaldos; reutilizar respaldo → `401`; `DELETE /totp` con contraseña incorrecta → `400` |

### Requisitos no verificables (instrucción 8)

| ID | Requisito | Motivo |
|---|---|---|
| NV-01 | Búsqueda/filtrado de artículos por categoría, estado o texto | `GET /api/articles` no acepta parámetros de consulta |
| NV-02 | Gestión de usuarios (permiso `gestionar_usuarios`) | El permiso existe en el seed pero no hay endpoint que lo implemente |
| NV-03 | Edición de artículos desde el frontend | Solo existe creación (`/upload`); la edición se prueba vía API |
| NV-04 | Guards frente a tokens manipulados en `localStorage` | No es requisito de negocio documentado; se registra como hallazgo de seguridad, no defecto bloqueante |

## 6. Casos de prueba

La matriz completa (55 casos: TC-01…TC-48 + TC-31b + los 6 casos frontend de REQ-NAV-02, que en conjunto producen 67 verificaciones) está en [`docs/practica7-blackbox.md`](practica7-blackbox.md) §4, construida con **clases de equivalencia** (valores válidos/inválidos por campo) y **valores límite** (2/100 caracteres, 6/72 de contraseña, 5 MB exacto, pendiente de 5 min, 15/16 intentos, 5/6 intentos de 2FA). Cada caso declara: ID, requisito, precondición, datos de entrada, resultado esperado y evidencia (curl, captura o consulta `psql`).

## 7. Plan de ejecución

### Fase 0 — Preparación (≈30 min)
1. Levantar PostgreSQL y crear `backend/.env` (`DATABASE_URL`, `JWT_SECRET`).
2. Backend: `pnpm install && pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm dev` (puerto 3000).
3. Frontend: `pnpm install && pnpm dev` (puerto 5173; el proxy de Vite reenvía `/api` y `/uploads` a 3000).
4. Verificar: `curl http://localhost:3000/api` → `{"message":"Labandera API funcionando 🚀"}` y el SPA carga.
5. Cuentas de prueba (seed): `admin@labandera.mx`, `editor@labandera.mx`, `usuario@labandera.mx` (password `password123`) + una cuenta extra para 2FA.
6. Herramientas: `curl`, navegador, `psql`, capturas de pantalla.

### Fase 1 — Ejecución de casos (≈4 h)
Orden recomendado:
1. TC-01…TC-14 (operaciones: registro, login, artículos y borrado).
2. TC-15…TC-25 (validaciones de registro, login, artículo y subida).
3. TC-26…TC-31b (persistencia/consistencia; incluir reinicio del backend en TC-27).
4. TC-32…TC-37 (RBAC API) y TC-33…TC-38 (guards del frontend, con capturas).
5. TC-44…TC-48 (2FA).
6. **Al final:** TC-42 y TC-43 (rate limit), porque consumen el contador en memoria de 15 min; si se agota antes, reiniciar el backend.

Por cada caso registrar: ID, precondición, pasos, datos, resultado esperado, resultado observado, estado (P/F) y evidencia.

### Fase 2 — Evidencia (≈2 h)
1. **Backend:** guardar cada respuesta `curl` con su estado HTTP (archivo de texto por fase).
2. **Frontend:** capturas de registro, login con 2FA (QR), `/upload` con y sin rol, redirecciones de guards, mensajes de error en formularios.
3. **BD:** `SELECT` a `users`, `articles`, `totp_backup_codes`, `auth_attempt` para corroborar persistencia y estado de códigos de respaldo.

### Fase 3 — Defectos y veredicto (≈1 h)
1. Completar la tabla de defectos (severidad bloqueante/mayor/menor, reproducibilidad, evidencia).
2. Emitir el **veredicto** de aceptación/rechazo por requisito y global, justificado con la evidencia.

**Tiempo total estimado: 1 día de trabajo.**

## 8. Riesgos y limitaciones

- **Rate limit en memoria:** los casos `429` dependen del contador del proceso; requieren reiniciar el backend o esperar 15 min.
- **Falta de filtrado/búsqueda:** se documenta como NV-01, no como defecto.
- **Tests existentes** (`backend/tests/*.test.ts`, vitest) son unitarios/caja blanca: **no cuentan** como evidencia de caja negra; se usan solo como referencia del comportamiento esperado.
- **Frontend sin edición de artículos:** la edición/eliminación se cubre vía API (TC-12/TC-14).

## 9. Conclusiones

1. **El proyecto es apto** para la práctica: cumple 8 de los 8 criterios recomendados (con consulta parcial).
2. **13 requisitos verificables** se definieron con identificador único y criterio de aceptación medible, superando el mínimo de 12 y cubriendo las 5 categorías exigidas.
3. **55 casos de prueba** (67 verificaciones) cubren clases de equivalencia y valores límite de todas las funcionalidades, incluyendo RBAC, persistencia, 2FA y manejo de errores.
4. **4 requisitos no verificables** se identificaron por falta de funcionalidad o de requisito documentado, cumpliendo la instrucción 8.
5. La evidencia (respuestas HTTP, capturas, consultas a BD) es **suficiente para justificar el veredicto** de aceptación o rechazo de la entrega, siempre que se ejecute el plan de las fases 0–3 y se registre el resultado observado de cada caso. **Ejecución realizada (2026-10-25): 55 casos (67 verificaciones), 66 ACEPTADO y 1 RECHAZADO (TC-25); veredicto global ACEPTADO con un defecto menor (secciones 10-12).**

---

## 10. Resultados de la ejecución

**Ejecución:** 2026-10-25. Backend en `http://localhost:3000` (PostgreSQL `labandera`, usuarios seed `admin@`/`editor@`/`usuario@labandera.mx`), SPA en `http://localhost:5173` (Vite). Scripts: `test_blackbox/run_api_tests.sh` (API) y `/tmp/guards/run_frontend_guards.mjs` (Playwright + Chromium, guards del frontend).

**Registro consolidado:** [`docs/practica7-evidencia/resultados.csv`](practica7-evidencia/resultados.csv) — **67 verificaciones (55 casos de prueba): 66 ACEPTADO, 1 RECHAZADO (TC-25)**. Algunos casos contienen varias verificaciones (p. ej., TC-45: respuesta HTTP, códigos de respaldo y estado en BD), por eso la suma de verificaciones supera el número de casos.

| Requisito | Casos | Verificaciones | Resultado |
|---|---|---|
| REQ-OP-01 | TC-01…03 | 3 | 3/3 ACEPTADO |
| REQ-OP-02 | TC-05…08 | 4 | 4/4 ACEPTADO |
| REQ-OP-03 | TC-09…11 | 3 | 3/3 ACEPTADO |
| REQ-OP-04 | TC-12, TC-14 | 4 | 4/4 ACEPTADO |
| REQ-VAL-01 | TC-04, TC-15…17 | 4 | 4/4 ACEPTADO |
| REQ-VAL-02 | TC-18…19 | 3 | 3/3 ACEPTADO |
| REQ-VAL-03 | TC-20…25 | 6 | **5/6 — TC-25 RECHAZADO** |
| REQ-PER-01 | TC-26…29 | 4 | 4/4 ACEPTADO |
| REQ-PER-02 | TC-30, TC-31, TC-31b | 4 | 4/4 ACEPTADO |
| REQ-NAV-01 | TC-13, TC-32…37 | 7 | 7/7 ACEPTADO |
| REQ-NAV-02 | TC-33…38 (frontend) | 6 | 6/6 ACEPTADO |
| REQ-ERR-01 | TC-39…43 | 8 | 8/8 ACEPTADO |
| REQ-BIZ-01 | TC-44…48 | 11 | 11/11 ACEPTADO |

**Evidencia por caso:**
- API: JSON en `docs/practica7-evidencia/TC-XX.json` (estado HTTP + cuerpo de respuesta + fecha).
- Frontend (REQ-NAV-02): JSON `TC-33-frontend.json`…`TC-38-frontend.json` + capturas `docs/practica7-evidencia/imgs/TC-33.png`…`TC-38.png` (Playwright contra el SPA real; sesión simulada escribiendo `localStorage.token`/`localStorage.user` antes de la carga).
- BD: consultas `psql` registradas en los JSON de TC-26…29, TC-31, TC-45, TC-46 y TC-48.

**Notas de ejecución:**
- Los `429` (TC-42/TC-43) se ejecutaron al final, tras reiniciar el backend para limpiar el contador en memoria del rate limit.
- Los casos de DELETE (TC-13/TC-14) se re-ejecutaron con artículos de slugs únicos (timestamp) para evitar colisiones con ejecuciones previas; el comportamiento observado (`403`/`200`/`404`) es el correcto.
- TC-10: la API devuelve el **nombre** del autor (`"Editor Test"`), no el email; el caso se evalúa contra el requisito (autor visible en la respuesta), no contra el email literal.

---

## 11. Registro de defectos

| # | REQ | Caso | Descripción | Severidad | Reproducible | Evidencia |
|---|---|---|---|---|---|---|
| 1 | REQ-VAL-03 | TC-25 | Un JPG de **5 MB exactos** (5 242 880 bytes) es rechazado con `413`, pero el requisito documentado indica "imágenes ≤ 5 MB" (esperado `201`). El límite efectivo es **5 MB − 1 byte**: multer/busboy rechaza cuando `size >= limits.fileSize` (comparación inclusiva). Un archivo de 5 242 879 bytes se acepta (`201`). | Menor (off-by-one en el límite; no afecta seguridad ni estabilidad) | Sí | `TC-25.json` (`413` "El archivo excede el tamaño máximo permitido"); `limite-1byte.jpg` → `201` |
| 2 | REQ-ERR-01 | TC-42 | Mensaje de rate limit con errata tipográfica: "Demasiadas **intentas**. Intenta de nuevo más tarde." (debería ser "Demasiados intentos"). Solo cosmético; el comportamiento (`429`) es correcto. | Menor (cosmético) | Sí | `TC-42.json`; origen: `backend/src/middlewares/rateLimit.ts:12` |

**Corrección sugerida para el defecto #1:** en `backend/src/middlewares/uploadValidation.ts`, el límite de multer debe ser `MAX_UPLOAD_SIZE - 1` (o documentar el límite como "5 MB − 1 byte"). Alternativa: validar el tamaño después de recibir el archivo y aceptar `size <= MAX_UPLOAD_SIZE`.

---

## 12. Veredicto

| REQ | Estado | Justificación (evidencia) |
|---|---|---|
| REQ-OP-01 | Aceptado | Registro `201` + token + rol `Usuario`; límites de nombre 2/100 aceptados (TC-01…03) |
| REQ-OP-02 | Aceptado | JWT exp−iat = 604800 s; flujo 2FA con `pendingToken` y expiración a los 5 min (TC-05…08) |
| REQ-OP-03 | Aceptado | Creación `201`; `GET /:id` con autor, categoría e imágenes; visible en listado (TC-09…11) |
| REQ-OP-04 | Aceptado | `PUT` → `200` con cambios reflejados; `DELETE` (Admin) → `200`, `GET` → `404` (TC-12, TC-14) |
| REQ-VAL-01 | Aceptado | Mensajes Zod específicos por campo; límites de contraseña 6/72 aceptados, 5/73 rechazados (TC-04, TC-15…17) |
| REQ-VAL-02 | Aceptado | Mismo `401` genérico para contraseña incorrecta y email inexistente (TC-18…19) |
| REQ-VAL-03 | **Rechazado** | 5/6 casos correctos, pero TC-25: 5 MB exactos → `413` (límite efectivo 5 MB − 1 byte). Defecto #1 |
| REQ-PER-01 | Aceptado | Ciclo CRUD consistente y datos persisten tras reinicio del backend (TC-26…29) |
| REQ-PER-02 | Aceptado | Email duplicado → `400`; slug duplicado → `409`; `PUT` con categoryId inexistente → `409` sin estado parcial (TC-30, TC-31, TC-31b) |
| REQ-NAV-01 | Aceptado | RBAC API: `403` a Editor/Usuario en acciones no permitidas, `401` sin token, Admin pasa todo (TC-13, TC-32…37) |
| REQ-NAV-02 | Aceptado | Guards del SPA: redirecciones correctas por rol y sesión; Admin ve estadísticas, Editor ve formulario (TC-33…38, con capturas) |
| REQ-ERR-01 | Aceptado | `404`/`401`/`400` genéricos sin stack trace; `429` en login (16.º) y verify-2fa (6.º) (TC-39…43) |
| REQ-BIZ-01 | Aceptado | Setup 2FA con 10 respaldos; respaldo reutilizado → `401`; `DELETE /totp` correcto y login posterior sin 2FA (TC-44…48) |

**Veredicto global: ACEPTADO con un defecto menor.** La entrega cumple 12 de 13 requisitos. El único rechazo (REQ-VAL-03 / TC-25) es un off-by-one en el límite de subida de imágenes (5 MB exactos → `413`), de severidad menor, reproducible y de corrección trivial. El defecto #2 (errata "intentas") es cosmético y no altera el veredicto.
