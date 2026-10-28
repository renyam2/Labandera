# Práctica 7 — Pruebas de Caja Negra para la Evaluación de la Calidad del Software

**Proyecto:** Labandera (sitio de noticias — SPA React + API Express/Prisma/PostgreSQL)
**Fecha:** 2026-07-08
**Alcance:** Documentar ≥12 requisitos verificables (4 operaciones principales, 3 validaciones, 2 persistencia/consistencia, 2 navegación/roles/permisos, 1 manejo de errores) con identificador único y criterio de aceptación medible, y ejecutar pruebas de caja negra con evidencia.

> Nota: este documento es distinto de `reporte_practicas_7_8.txt` (eventos JavaScript de temporada/puntero); aquí se cubre la práctica de **pruebas de caja negra**.

---

## 1. Análisis de la práctica

La práctica exige probar el sistema **solo desde su comportamiento observable** (entradas → salidas), sin examinar el código interno. Los 8 pasos del método:

1. Inventario de funcionalidades (función, entradas, restricciones, salidas, errores).
2. Identificar entradas de cada funcionalidad.
3. Determinar restricciones de cada entrada.
4. Identificar salidas esperadas.
5. Definir errores posibles.
6. Asignar identificador único a cada requisito.
7. Establecer criterio de aceptación medible.
8. Identificar requisitos no verificables (falta de información o funcionalidad).

**Factibilidad:** el proyecto cumple los criterios recomendados (autenticación, formularios, CRUD, reglas de negocio, múltiples pantallas/roles, persistencia, manejo de errores), por lo que **sí es posible implementarla**.

---

## 2. Inventario de funcionalidades

| # | Funcionalidad | Entradas | Restricciones | Salidas | Errores |
|---|---|---|---|---|---|
| F1 | Registro de usuario | nombre, email, contraseña | nombre 2–100 car.; email válido; contraseña 6–72 car.; email único | `201` + token JWT (7 días) + usuario con rol `Usuario` | `400` errores por campo (Zod); `400` email duplicado |
| F2 | Inicio de sesión | email, contraseña | credenciales existentes; 15 intentos / 15 min por IP | Sin 2FA: `200` + token. Con 2FA: `200` + `requires2fa`, `pendingToken` (5 min), `otpauthUri`, `totpEnabled` | `401` credenciales inválidas; `429` rate limit |
| F3 | 2FA: configurar/verificar/deshabilitar | contraseña, código TOTP de 6 dígitos, código de respaldo | contraseña correcta; código válido; respaldo de uso único | `201` + 10 códigos de respaldo; token definitivo; `200` al deshabilitar | `400` contraseña incorrecta; `401` código inválido; `429` 6.º intento |
| F4 | Crear artículo | título, slug, resumen, cuerpo, estado, categoría, imágenes (≤5) | título ≥3 car.; slug regex `^[a-z0-9-]+$`; categoryId UUID válido; imágenes JPG/PNG ≤5 MB (validación por bytes mágicos) | `201` + artículo; visible en frontend | `401` sin token; `403` rol Usuario; `400` validación; `413` tamaño; `415` MIME; `409` slug duplicado |
| F5 | Modificar/eliminar artículo | id UUID, campos del artículo | id existente; rol Editor/Admin (eliminar: solo Admin) | `200` + artículo actualizado; `200` mensaje de eliminación | `401`, `403`, `404` id inexistente, `409` categoría inexistente |
| F6 | CRUD de categorías | nombre, id | nombre 2–100 car.; rol Admin (escritura) | `201`/`200` + categoría | `400`, `401`, `403`, `404` |
| F7 | Consulta de artículos/categorías | id (opcional) | — | `200` + lista ordenada por fecha desc / artículo con autor, categoría e imágenes | `404` id inexistente |
| F8 | Navegación y guards del SPA | ruta, sesión en localStorage | rol según ruta | redirecciones: `/login`→`/` si autenticado; `/upload`→`/login` o `/` según rol; `/estadisticas` solo Admin | redirección silenciosa a ruta segura |
| F9 | Manejo global de errores | cualquier petición malformada | — | `404` ruta inexistente; `400` JSON inválido; `401` token inválido; `429` límite; `500` genérico sin stack trace | — |

---

## 3. Tabla de requisitos (13 requisitos)

### 3.1 Operaciones principales (4)

| ID | Requisito | Entrada | Restricción | Salida esperada | Criterio de aceptación (medible) |
|---|---|---|---|---|---|
| **REQ-OP-01** | Registro de usuario | `POST /api/auth/register` `{name, email, password}` | nombre 2–100, email válido, contraseña 6–72 | `201` + `token` + `user.roles=["Usuario"]` | En BD existe el usuario con rol `Usuario`; login posterior con esas credenciales devuelve `200` |
| **REQ-OP-02** | Inicio de sesión | `POST /api/auth/login` `{email, password}` | credenciales existentes | Sin 2FA: `200` + JWT expira a los 7 días. Con 2FA: `requires2fa=true`, `pendingToken`, `otpauthUri` | El token definitivo solo se emite tras `verify-2fa` exitoso; el `pendingToken` expira a los 5 min (segundo login en la ventana no reutiliza el pendiente) |
| **REQ-OP-03** | Crear artículo (Editor/Admin) | `POST /api/articles` con body válido | título ≥3, slug regex, categoryId UUID | `201` + artículo; visible en `GET /api/articles` y en el frontend | El artículo persiste tras reiniciar el backend; `GET /api/articles/:id` devuelve autor, categoría e imágenes correctos |
| **REQ-OP-04** | Modificar y eliminar artículo | `PUT /api/articles/:id`, `DELETE /api/articles/:id` | id existente; rol adecuado | `200` con cambios; `DELETE` → `{"message":"Artículo eliminado"}` | `GET` posterior refleja los cambios; tras `DELETE`, `GET /:id` → `404`; BD sin registro |

### 3.2 Validaciones (3)

| ID | Requisito | Entrada inválida | Salida esperada | Criterio de aceptación |
|---|---|---|---|---|
| **REQ-VAL-01** | Validación de registro | nombre de 1 car.; email mal formado; contraseña de 5 car. | `400` con mensajes por campo (Zod) | Cada campo inválido produce su mensaje específico; sin inválidos → `201` |
| **REQ-VAL-02** | Validación de login | contraseña incorrecta; email inexistente | `401` `{"message":"Credenciales inválidas"}` | Ambos casos devuelven el **mismo** mensaje genérico (no revela cuál campo falló) |
| **REQ-VAL-03** | Validación de carga de artículo e imágenes | slug con espacios; categoryId no UUID; `PUT` sin cuerpo; `.exe` con extensión `.jpg`; PNG de 6 MB | `400` (slug/UUID/body); `415` (MIME); `413` (tamaño) | Un archivo con extensión `.jpg` pero bytes de texto es rechazado con `415` (validación por bytes mágicos) |

### 3.3 Persistencia / consistencia (2)

| ID | Requisito | Escenario | Criterio de aceptación |
|---|---|---|---|
| **REQ-PER-01** | Consistencia CRUD | Crear → consultar → modificar → eliminar un artículo; repetir tras reiniciar backend | `psql` confirma el mismo estado en cada paso; el frontend refleja los cambios; tras reinicio los datos persisten |
| **REQ-PER-02** | Restricciones de integridad | Email duplicado en registro; slug duplicado en artículo; `PUT` con `categoryId` inexistente | `400`/`409` con mensaje claro; BD sin estado parcial (transacción) |

### 3.4 Navegación / roles / permisos (2)

| ID | Requisito | Escenario | Criterio de aceptación |
|---|---|---|---|
| **REQ-NAV-01** | RBAC en API | `DELETE /articles/:id` con Editor → `403`; `POST /articles` con Usuario → `403`; `POST /categories` con Editor → `403`; sin token → `401` | Cada combinación rol/ruta produce exactamente el estado esperado; Admin pasa todas |
| **REQ-NAV-02** | Guards del frontend | `/upload` sin sesión → `/login`; con rol Usuario → `/`; `/estadisticas` con Editor → `/`; `/login` ya autenticado → `/` | La redirección ocurre sin mostrar la pantalla protegida; con rol correcto la pantalla sí se muestra |

### 3.5 Manejo de errores (1)

| ID | Requisito | Escenario | Criterio de aceptación |
|---|---|---|---|
| **REQ-ERR-01** | Respuesta ante errores e interrupciones | Ruta inexistente; token inválido/truncado; JSON malformado; 16.º login en 15 min; 6.º `verify-2fa` | `404` genérico; `401`; `400` sin stack trace; `429` con mensaje de espera; ninguna respuesta expone detalles internos |

### 3.6 Regla de negocio adicional (2FA)

| ID | Requisito | Escenario | Criterio de aceptación |
|---|---|---|---|
| **REQ-BIZ-01** | Flujo 2FA completo | `setup` → QR → `verify-setup` con código válido → `201` + 10 códigos de respaldo; reutilizar un respaldo → `401`; `DELETE /totp` con contraseña incorrecta → `400` | En BD el `codeHash` queda con `usedAt` distinto de null tras el primer uso; `auth_attempt` registra éxito y fallo |

---

## 4. Matriz de casos de prueba (clases de equivalencia y valores límite)

| Caso | REQ | Precondición | Datos de entrada | Resultado esperado | Evidencia |
|---|---|---|---|---|---|
| TC-01 | REQ-OP-01 | BD sembrada | `POST /auth/register` `name:"Nuevo Periodista"`, email único, `password:"password123"` | `201`, token, rol `Usuario` | curl + fila en BD |
| TC-02 | REQ-OP-01 | — | nombre de 2 car. (límite mín.) | `201` | curl |
| TC-03 | REQ-OP-01 | — | nombre de 100 car. (límite máx.) | `201` | curl |
| TC-04 | REQ-VAL-01 | — | `name` de 101 car. (límite máx. + 1) | `400` mensaje de longitud | curl |
| TC-05 | REQ-OP-02 | usuario seed sin 2FA | `POST /auth/login` `admin@labandera.mx` / `password123` | `200` + token exp 7 días | curl + decodificar JWT (exp−iat = 604800 s) |
| TC-06 | REQ-OP-02 | usuario con 2FA activo | email/contraseña válidos | `200` `requires2fa`, `pendingToken`, `otpauthUri` | curl |
| TC-07 | REQ-OP-02 | pendiente vigente | `POST /auth/login/verify-2fa` con código válido | `200` + token definitivo | curl |
| TC-08 | REQ-OP-02 | pendiente vencido (>5 min) | `verify-2fa` con `pendingToken` viejo | `401` | curl |
| TC-09 | REQ-OP-03 | token Editor | `POST /articles` body válido completo | `201`; visible en `GET /articles` y frontend | curl + BD |
| TC-10 | REQ-OP-03 | token Admin | `POST /articles` body válido | `201`; `GET /:id` devuelve autor | curl |
| TC-11 | REQ-OP-03 | artículo existente | `GET /articles/:id` | `200` con autor, categoría e imágenes | curl |
| TC-12 | REQ-OP-04 | token Admin | `PUT /articles/:id` cambiando título | `200` con cambios | curl + `GET` posterior + BD |
| TC-13 | REQ-NAV-01 | token Editor | `DELETE /articles/:id` | `403` "No tienes permiso" | curl |
| TC-14 | REQ-OP-04 | token Admin | `DELETE /articles/:id` existente | `200` mensaje; `GET /:id` → `404` | curl + BD |
| TC-15 | REQ-VAL-01 | — | `name:"A"`, email `x@`, `password:"12345"` | `400` mensajes por campo | curl |
| TC-16 | REQ-VAL-01 | — | contraseña de 6 car. (límite) y 72 car. (límite) | `201` en ambos | curl |
| TC-17 | REQ-VAL-01 | — | contraseña de 5 y 73 car. | `400` | curl |
| TC-18 | REQ-VAL-02 | — | email válido, contraseña incorrecta | `401` "Credenciales inválidas" | curl |
| TC-19 | REQ-VAL-02 | — | email inexistente, contraseña cualquiera | `401` mismo mensaje | curl |
| TC-20 | REQ-VAL-03 | token Editor | `POST /articles` slug `mi titulo` (espacios) | `400` | curl |
| TC-21 | REQ-VAL-03 | token Editor | `categoryId:"no-uuid"` | `400` | curl |
| TC-22 | REQ-VAL-03 | token Editor | `PUT /articles/:id` con body vacío `{}` | `400` | curl |
| TC-23 | REQ-VAL-03 | token Editor | archivo texto renombrado `img.jpg` | `415` MIME inválido | curl + archivo |
| TC-24 | REQ-VAL-03 | token Editor | PNG de 6 MB | `413` tamaño | curl |
| TC-25 | REQ-VAL-03 | token Editor | JPG de 5 MB exacto (5 242 880 bytes) | `201` (límite "≤ 5 MB") | curl + archivo (observado `413` → defecto #1) |
| TC-26 | REQ-PER-01 | token Editor | crear→leer→editar→leer→eliminar→leer | estados consistentes en cada paso | curl + `psql` |
| TC-27 | REQ-PER-01 | tras reiniciar backend | `GET /articles` | mismos artículos que antes del reinicio | curl |
| TC-28 | REQ-PER-01 | token Admin | `PUT /articles/:id` | `200`; BD refleja el cambio | curl + `psql` |
| TC-29 | REQ-PER-01 | token Admin | `DELETE /articles/:id` | `200`; BD sin registro | curl + `psql` |
| TC-30 | REQ-PER-02 | artículo con slug S ya existe | crear con slug S | `409` | curl + BD |
| TC-31 | REQ-PER-02 | token Editor | `PUT /articles/:id` con `categoryId` UUID inexistente | `409` sin estado parcial | curl + BD |
| TC-31b | REQ-PER-02 | — | registro con email ya existente | `400` "Email ya registrado" | curl + BD |
| TC-32 | REQ-NAV-01 | sin token | `POST /articles` | `401` "Token requerido" | curl |
| TC-33 | REQ-NAV-01 | token Usuario | `POST /articles` | `403` | curl |
| TC-34 | REQ-NAV-01 | sin token | `POST /categories` | `401` | curl |
| TC-35 | REQ-NAV-01 | token Admin | `POST /categories` | `201` + categoría | curl |
| TC-36 | REQ-NAV-01 | token Admin | `PUT /categories/:id` | `200` + nombre actualizado | curl |
| TC-37 | REQ-NAV-01 | token Editor | `PUT /categories/:id` | `403` | curl |
| TC-33 | REQ-NAV-02 | sin sesión en navegador | abrir `/upload` | redirige a `/login` | Playwright + captura |
| TC-34 | REQ-NAV-02 | sesión rol Usuario | abrir `/upload` | redirige a `/` | Playwright + captura |
| TC-35 | REQ-NAV-02 | sesión rol Editor | abrir `/upload` | muestra formulario | Playwright + captura |
| TC-36 | REQ-NAV-02 | sesión rol Editor | abrir `/estadisticas` | redirige a `/` | Playwright + captura |
| TC-37 | REQ-NAV-02 | sesión Admin | abrir `/estadisticas` | muestra estadísticas | Playwright + captura |
| TC-38 | REQ-NAV-02 | ya autenticado | abrir `/login` | redirige a `/` | Playwright + captura |
| TC-39 | REQ-ERR-01 | — | `GET /api/ruta-inexistente` | `404` `{"message":"Ruta no encontrada"}` | curl |
| TC-40 | REQ-ERR-01 | — | `Authorization: Bearer token-malformado` | `401` | curl |
| TC-41 | REQ-ERR-01 | — | body JSON malformado | `400` sin stack trace | curl |
| TC-42 | REQ-ERR-01 | 15 logins previos en 15 min | 16.º intento | `429` "Demasiados intentos" | curl (ejecutar al final) |
| TC-43 | REQ-ERR-01 | 5 `verify-2fa` fallidos previos | 6.º intento | `429` | curl (ejecutar al final) |
| TC-44 | REQ-BIZ-01 | usuario sin 2FA | `POST /auth/totp/setup` con contraseña correcta | `200` + `otpauthUri` | curl |
| TC-45 | REQ-BIZ-01 | setup vigente | `POST /auth/totp/verify-setup` con código válido | `201` + 10 códigos de respaldo | curl + BD |
| TC-46 | REQ-BIZ-01 | respaldo R ya usado | `verify-2fa` con R de nuevo | `401` | curl + BD (`usedAt` no nulo) |
| TC-47 | REQ-BIZ-01 | 2FA activo | `DELETE /auth/totp` con contraseña incorrecta | `400` | curl |
| TC-48 | REQ-BIZ-01 | 2FA activo | `DELETE /auth/totp` con contraseña correcta | `200`; login posterior sin 2FA | curl + BD |

> Nota: los identificadores TC-33…TC-37 aparecen dos veces en la matriz: una vez para la API (REQ-NAV-01) y otra para el frontend (REQ-NAV-02). Para evitar colisión de archivos, la evidencia del frontend se guarda como `TC-33-frontend.json`…`TC-38-frontend.json` y las capturas como `imgs/TC-33.png`…`imgs/TC-38.png`.

---

## 5. Requisitos no verificables (instrucción 8)

| ID | Requisito | Motivo |
|---|---|---|
| NV-01 | Búsqueda/filtrado de artículos por categoría, estado o texto | No existe: `GET /api/articles` devuelve todo sin parámetros de consulta |
| NV-02 | Gestión de usuarios (permiso `gestionar_usuarios`) | El permiso existe en el seed pero no hay endpoint que lo implemente |
| NV-03 | Edición de artículos desde el frontend | Solo existe creación (`/upload`); la edición se prueba únicamente vía API |
| NV-04 | Robustez de los guards del frontend frente a tokens manipulados en `localStorage` | Verificable como observación (un token válido de otro rol elude el guard), pero no es un requisito de negocio documentado; se registra como hallazgo de seguridad, no como defecto bloqueante |

---

## 6. Plan de ejecución

### Fase 0 — Preparación del equipo (≈30 min)
1. Levantar PostgreSQL local y crear `backend/.env` (`DATABASE_URL`, `JWT_SECRET`).
2. En `backend/`: `pnpm install && pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm dev` (puerto 3000).
3. En `frontend/`: `pnpm install && pnpm dev` (puerto 5173, proxy `/api` → 3000).
4. Verificar: `curl http://localhost:3000/api` → `{"message":"Labandera API funcionando 🚀"}` y el frontend carga en el navegador.
5. Cuentas de prueba (seed): `admin@labandera.mx`, `editor@labandera.mx`, `usuario@labandera.mx` (password `password123`). Crear una cuenta extra para el flujo 2FA.
6. Herramientas: `curl`, navegador, `psql`, capturas de pantalla.

### Fase 1 — Ejecución de casos (≈4 h)
- **Orden recomendado:**
  1. TC-01…TC-14 (operaciones: registro, login, artículos y borrado).
  2. TC-15…TC-25 (validaciones de registro, login, artículo y subida).
  3. TC-26…TC-31b (persistencia/consistencia; incluir reinicio del backend en TC-27).
  4. TC-32…TC-37 (RBAC API) y TC-33…TC-38 (guards frontend, con capturas).
  5. TC-44…TC-48 (2FA).
  6. **Al final:** TC-42 y TC-43 (rate limit), porque consumen el contador de 15 min; si se agota antes, reiniciar el backend.
- Por cada caso registrar: ID, precondición, pasos, datos, resultado esperado, resultado observado, estado (P/F) y evidencia (curl, captura o consulta `psql`).

### Fase 2 — Evidencia (≈2 h)
1. **Backend:** guardar cada respuesta `curl` con su estado HTTP (archivo de texto por fase).
2. **Frontend:** capturas de registro, login con 2FA (QR), `/upload` con y sin rol, redirecciones de guards, mensajes de error en formularios.
3. **BD:** consultas `SELECT` a `users`, `articles`, `totp_backup_codes`, `auth_attempt` para corroborar persistencia y estado de códigos de respaldo.

### Fase 3 — Registro de defectos y veredicto (≈1 h)
1. Completar la tabla de defectos (sección 7).
2. Emitir el **veredicto** de aceptación/rechazo por requisito y global, con justificación basada en la evidencia.

**Tiempo total estimado: 1 día de trabajo.**

---

## 7. Registro de defectos

| # | REQ | Caso | Descripción | Severidad (bloqueante/mayor/menor) | Reproducible | Evidencia |
|---|---|---|---|---|---|---|
| 1 | REQ-VAL-03 | TC-25 | Un JPG de **5 MB exactos** (5 242 880 bytes) es rechazado con `413`, pero el requisito documentado dice "imágenes ≤ 5 MB" (esperado `201`). El límite efectivo es 5 MB − 1 byte: multer/busboy rechaza cuando `size >= limits.fileSize` (comparación inclusiva). | Menor (off-by-one en el límite; no afecta seguridad ni estabilidad) | Sí | `docs/practica7-evidencia/TC-25.json`: `413` "El archivo excede el tamaño máximo permitido"; `limite-1byte.jpg` (5 242 879 bytes) → `201` |
| 2 | REQ-ERR-01 | TC-42 | Mensaje de rate limit con errata tipográfica: "Demasiadas **intentas**. Intenta de nuevo más tarde." (debería ser "Demasiados intentos"). Solo cosmético; el comportamiento (`429`) es correcto. | Menor (cosmético) | Sí | `docs/practica7-evidencia/TC-42.json`: cuerpo con el mensaje; origen: `backend/src/middlewares/rateLimit.ts:12` |

---

## 8. Veredicto

**Resumen de ejecución:** 67 verificaciones (55 casos de prueba) registradas en [`docs/practica7-evidencia/resultados.csv`](practica7-evidencia/resultados.csv) — **66 ACEPTADO, 1 RECHAZADO** (TC-25). Algunos casos contienen varias verificaciones (p. ej., TC-45: respuesta HTTP, códigos de respaldo y estado en BD). Evidencia por caso: JSON en `docs/practica7-evidencia/` + capturas `imgs/TC-33…38.png` (guards del frontend, ejecutados con Playwright/Chromium contra el SPA en `http://localhost:5173`).

| REQ | Estado (aceptado/rechazado) | Justificación (evidencia) |
|---|---|---|
| REQ-OP-01 | Aceptado | TC-01…03: registro `201` + token + rol `Usuario`; nombre de 2 y 100 caracteres (límites) aceptados (`TC-01.json`…`TC-03.json`) |
| REQ-OP-02 | Aceptado | TC-05…08: login `200` con JWT exp−iat = 604800 s; con 2FA `requires2fa` + `pendingToken`; `verify-2fa` válido → token definitivo; `pendingToken` vencido → `401` (`TC-05.json`…`TC-08.json`) |
| REQ-OP-03 | Aceptado | TC-09…11: creación `201`; `GET /:id` devuelve autor, categoría e imágenes; artículo visible en `GET /api/articles` (`TC-09.json`…`TC-11.json`) |
| REQ-OP-04 | Aceptado | TC-12, TC-14: `PUT` → `200` y `GET` posterior refleja cambios; `DELETE` (Admin) → `200` y `GET` → `404` (`TC-12.json`, `TC-14.json`) |
| REQ-VAL-01 | Aceptado | TC-04, TC-15…17: nombre de 101 caracteres rechazado; 3 campos inválidos → mensajes Zod específicos por campo; contraseñas de 6 y 72 caracteres (límites) aceptadas, 5 y 73 rechazadas (`TC-04.json`, `TC-15.json`…`TC-17.json`) |
| REQ-VAL-02 | Aceptado | TC-18…19: contraseña incorrecta y email inexistente devuelven el mismo `401` genérico (no revela cuál campo falló) (`TC-18.json`, `TC-19.json`) |
| REQ-VAL-03 | **Rechazado** | TC-20…24 pasan (slug con espacios, categoryId no UUID, `PUT` vacío, `fake.jpg` → `415`, PNG 6 MB → `413`), pero **TC-25 falla**: JPG de 5 MB exactos → `413` en lugar de `201` (límite efectivo = 5 MB − 1 byte). Ver defecto #1. |
| REQ-PER-01 | Aceptado | TC-26…29: crear → fila en BD; `GET` tras reinicio del backend persiste; `PUT` → BD refleja cambio; `DELETE` → fila desaparece de BD (`TC-26.json`…`TC-29.json`) |
| REQ-PER-02 | Aceptado | TC-30…31b: slug duplicado → `409`; `PUT` con categoryId UUID inexistente → `409` sin estado parcial en BD; registro con email ya existente → `400` "Email ya registrado" (`TC-30.json`, `TC-31.json`, `TC-31b.json`) |
| REQ-NAV-01 | Aceptado | TC-13, TC-32…37 (RBAC): Editor `DELETE` → `403`; Usuario `POST /articles` → `403`; Editor `PUT /categories` → `403`; sin token → `401`; Admin crea/edita categorías → `201`/`200` (`TC-13.json`, `TC-32.json`…`TC-37.json`) |
| REQ-NAV-02 | Aceptado | TC-33…38 (guards del SPA, Playwright): sin sesión `/upload` → `/login`; Usuario `/upload` → `/`; Editor `/upload` → formulario; Editor `/estadisticas` → `/`; Admin `/estadisticas` → página; autenticado `/login` → `/`. Capturas `imgs/TC-33…38.png` + `TC-33-frontend.json`…`TC-38-frontend.json` |
| REQ-ERR-01 | Aceptado | TC-39…43: ruta inexistente → `404` genérico; token malformado → `401`; JSON malformado → `400` sin stack trace; 16.º login → `429`; 6.º `verify-2fa` → `429` (`TC-39.json`…`TC-43.json`) |
| REQ-BIZ-01 | Aceptado | TC-44…48: `setup` → `verify-setup` → `201` + 10 respaldos; reutilizar respaldo → `401`; `DELETE /totp` con contraseña incorrecta → `400`, correcta → `200` y login posterior sin 2FA (`TC-44.json`…`TC-48.json`) |

**Veredicto global: ACEPTADO con un defecto menor.** La entrega cumple 12 de 13 requisitos. El único rechazo (REQ-VAL-03 / TC-25) es un off-by-one en el límite de subida (5 MB exactos → `413`), de severidad menor y fácilmente corregible (ajustar `limits.fileSize` o documentar el límite como "5 MB − 1 byte"). El defecto #2 (errata "intentas" en el mensaje de rate limit) es cosmético y no afecta el veredicto.

---

## 9. Riesgos y limitaciones

- **Rate limit en memoria:** los casos de `429` dependen del contador del proceso; requieren reinicio del backend o esperar 15 min.
- **Falta de filtrado/búsqueda:** se documenta como requisito no verificable (NV-01).
- **Tests existentes** (`backend/tests/*.test.ts`, vitest) son unitarios/caja blanca: **no cuentan** como evidencia de caja negra; se usan solo como referencia del comportamiento esperado.
- **Frontend sin edición de artículos:** la edición/eliminación se cubre vía API (TC-12/TC-14).
