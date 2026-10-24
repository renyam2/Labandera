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

## 3. Tabla de requisitos (14 requisitos)

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
| TC-01 | REQ-OP-01 | BD sembrada | `name:"Nuevo Periodista"`, email único, `password:"password123"` | `201`, token, rol `Usuario` | curl + fila en BD |
| TC-02 | REQ-OP-01 | — | nombre de 2 car. (límite mín.) | `201` | curl |
| TC-03 | REQ-OP-01 | — | nombre de 100 car. (límite máx.) | `201` | curl |
| TC-04 | REQ-OP-01 | — | nombre de 101 car. | `400` mensaje de longitud | curl |
| TC-05 | REQ-OP-02 | usuario seed sin 2FA | `admin@labandera.mx` / `password123` | `200` + token exp 7 días | curl + decodificar JWT (exp−iat = 604800 s) |
| TC-06 | REQ-OP-02 | usuario con 2FA activo | email/contraseña válidos | `200` `requires2fa`, `pendingToken`, `otpauthUri` | curl |
| TC-07 | REQ-OP-02 | pendiente vigente | `POST /totp/verify-2fa` con código válido | `200` + token definitivo | curl |
| TC-08 | REQ-OP-02 | pendiente vencido (>5 min) | `verify-2fa` con `pendingToken` viejo | `401` | curl |
| TC-09 | REQ-OP-03 | token Editor | body válido completo | `201`; visible en `GET /articles` y frontend | curl + captura |
| TC-10 | REQ-OP-03 | token Admin | body válido | `201` | curl |
| TC-11 | REQ-OP-04 | token Admin | `PUT` cambiando título/published | `200` con cambios | curl + `GET` posterior |
| TC-12 | REQ-OP-04 | token Admin | `DELETE` artículo existente | `200` mensaje; `GET /:id` → `404` | curl + BD |
| TC-13 | REQ-VAL-01 | — | `name:"A"`, email `x@`, `password:"12345"` | `400` tres mensajes por campo | curl |
| TC-14 | REQ-VAL-01 | — | contraseña de 6 car. (límite) y 72 car. (límite) | `201` en ambos | curl |
| TC-15 | REQ-VAL-01 | — | contraseña de 5 y 73 car. | `400` | curl |
| TC-16 | REQ-VAL-02 | — | email válido, contraseña incorrecta | `401` "Credenciales inválidas" | curl |
| TC-17 | REQ-VAL-02 | — | email inexistente, contraseña cualquiera | `401` mismo mensaje | curl |
| TC-18 | REQ-VAL-03 | token Editor | slug `mi titulo` (espacios) | `400` | curl |
| TC-19 | REQ-VAL-03 | token Editor | `categoryId:"no-uuid"` | `400` | curl |
| TC-20 | REQ-VAL-03 | token Editor | `PUT` con body vacío `{}` | `400` | curl |
| TC-21 | REQ-VAL-03 | token Editor | archivo texto renombrado `img.jpg` | `415` MIME inválido | curl + archivo |
| TC-22 | REQ-VAL-03 | token Editor | PNG de 6 MB | `413` tamaño | curl |
| TC-23 | REQ-VAL-03 | token Editor | JPG de 5 MB exacto (límite) | `201` | curl |
| TC-24 | REQ-PER-01 | token Editor | crear→leer→editar→leer→eliminar→leer | estados consistentes en cada paso | curl + `psql` |
| TC-25 | REQ-PER-01 | tras reiniciar backend | `GET /articles` | mismos artículos que antes del reinicio | curl + captura |
| TC-26 | REQ-PER-02 | — | registro con email ya existente | `400` duplicado | curl + BD |
| TC-27 | REQ-PER-02 | artículo con slug S ya existe | crear con slug S | `409` | curl + BD |
| TC-28 | REQ-PER-02 | token Editor | `PUT` con `categoryId` UUID inexistente | `409` | curl + BD sin estado parcial |
| TC-29 | REQ-NAV-01 | token Editor | `DELETE /articles/:id` | `403` | curl |
| TC-30 | REQ-NAV-01 | token Usuario | `POST /articles` | `403` | curl |
| TC-31 | REQ-NAV-01 | token Editor | `POST /categories` | `403` | curl |
| TC-32 | REQ-NAV-01 | sin token | `POST /articles` | `401` "Token requerido" | curl |
| TC-33 | REQ-NAV-02 | sin sesión en navegador | abrir `/upload` | redirige a `/login` | captura |
| TC-34 | REQ-NAV-02 | sesión rol Usuario | abrir `/upload` | redirige a `/` | captura |
| TC-35 | REQ-NAV-02 | sesión rol Editor | abrir `/upload` | muestra formulario | captura |
| TC-36 | REQ-NAV-02 | sesión rol Editor | abrir `/estadisticas` | redirige a `/` | captura |
| TC-37 | REQ-NAV-02 | sesión Admin | abrir `/estadisticas` | muestra estadísticas | captura |
| TC-38 | REQ-NAV-02 | ya autenticado | abrir `/login` | redirige a `/` | captura |
| TC-39 | REQ-ERR-01 | — | `GET /api/ruta-inexistente` | `404` `{"message":"Ruta no encontrada"}` | curl |
| TC-40 | REQ-ERR-01 | — | `Authorization: Bearer token-malformado` | `401` | curl |
| TC-41 | REQ-ERR-01 | — | body JSON malformado | `400` sin stack trace | curl |
| TC-42 | REQ-ERR-01 | 15 logins fallidos previos | 16.º intento en 15 min | `429` "Demasiados intentos" | curl (ejecutar al final) |
| TC-43 | REQ-ERR-01 | 5 `verify-2fa` fallidos previos | 6.º intento | `429` | curl (ejecutar al final) |
| TC-44 | REQ-BIZ-01 | usuario sin 2FA | `POST /totp/setup` con contraseña correcta | `200` + `otpauthUri` + QR | curl + captura |
| TC-45 | REQ-BIZ-01 | setup vigente | `verify-setup` con código válido | `201` + 10 códigos de respaldo | curl + BD |
| TC-46 | REQ-BIZ-01 | respaldo R ya usado | `verify-2fa` con R de nuevo | `401` | curl + BD (`usedAt` no nulo) |
| TC-47 | REQ-BIZ-01 | 2FA activo | `DELETE /totp` con contraseña incorrecta | `400` | curl |
| TC-48 | REQ-BIZ-01 | 2FA activo | `DELETE /totp` con contraseña correcta | `200`; login posterior sin 2FA | curl + BD |

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
  1. TC-01…TC-12 (operaciones y validaciones de registro/login/artículos).
  2. TC-13…TC-23 (validaciones).
  3. TC-24…TC-28 (persistencia; incluir reinicio del backend en TC-25).
  4. TC-29…TC-32 (RBAC API) y TC-33…TC-38 (guards frontend, con capturas).
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

## 7. Registro de defectos (plantilla)

| # | REQ | Caso | Descripción | Severidad (bloqueante/mayor/menor) | Reproducible | Evidencia |
|---|---|---|---|---|---|---|
| 1 | | | | | | |

---

## 8. Veredicto (plantilla)

| REQ | Estado (aceptado/rechazado) | Justificación (evidencia) |
|---|---|---|
| REQ-OP-01 | | |
| REQ-OP-02 | | |
| REQ-OP-03 | | |
| REQ-OP-04 | | |
| REQ-VAL-01 | | |
| REQ-VAL-02 | | |
| REQ-VAL-03 | | |
| REQ-PER-01 | | |
| REQ-PER-02 | | |
| REQ-NAV-01 | | |
| REQ-NAV-02 | | |
| REQ-ERR-01 | | |
| REQ-BIZ-01 | | |

---

## 9. Riesgos y limitaciones

- **Rate limit en memoria:** los casos de `429` dependen del contador del proceso; requieren reinicio del backend o esperar 15 min.
- **Falta de filtrado/búsqueda:** se documenta como requisito no verificable (NV-01).
- **Tests existentes** (`backend/tests/*.test.ts`, vitest) son unitarios/caja blanca: **no cuentan** como evidencia de caja negra; se usan solo como referencia del comportamiento esperado.
- **Frontend sin edición de artículos:** la edición/eliminación se cubre vía API (TC-11/TC-12).
