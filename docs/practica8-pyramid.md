# Práctica 8 — Pyramid Testing (proyecto: Labandera)

**Funcionalidad crítica seleccionada:** Autenticación y control de acceso con 2FA (TOTP + códigos de respaldo).
Justificación: es la lógica de negocio más sensible del proyecto (protege todas las rutas privadas), tiene lógica propia (`totp.service.ts`) e interactúa con componentes reales (Express, Prisma/PostgreSQL, JWT, rate-limiting).

**Datos de prueba:** usuarios ficticios con dominios `@labandera.test`, contraseñas de prueba y secretos generados al vuelo. Sin información real sensible.

---

## Fase 1. Diagnóstico de la estrategia actual

Pruebas existentes en `backend/tests/` (antes de esta práctica):

| Archivo | Nivel | # pruebas | ¿Se ejecuta automático? |
|---|---|---|---|
| `tests/totp.service.test.ts` | Unitaria | 5 | Sí (`pnpm test`) |
| `tests/auth.test.ts` | Integración (supertest + BD real) | 7 | Sí |
| `tests/rbac.test.ts` | Integración (supertest + BD real) | 5 | Sí |
| `tests/totp.test.ts` | Integración (supertest + BD real) | 11 | Sí |
| Frontend / E2E | E2E | 0 | No existe |

**Total inicial: 28 pruebas (5 unitarias, 23 de integración, 0 E2E).** Todas se ejecutan con `pnpm test` (vitest) en el backend; no hay CI configurado.

---

## Fase 2. Pruebas unitarias (nuevas)

Archivo: `backend/tests/unit-practica8.test.ts` (5 pruebas sobre `totp.service`, sin servidor ni BD).

| Caso | Prueba | Esperado | Obtenido |
|---|---|---|---|
| Válido | `verifyTotpCode` con código TOTP correcto | `true` | ✅ `true` |
| Límite | Código `'000000'` (borde), longitud 5 y 7 | `false` en los 3 | ✅ `false` |
| Inválido/error | Secreto vacío y código con letras | `false`, sin excepción | ✅ `false` |
| Doble de prueba | `generateBackupCodes(3)` con `Math.random` espionado (determinístico) | `['00000000','00000000','00000000']` | ✅ coincide |
| Doble de prueba | `buildOtpauthUri` con datos ficticios | URI otpauth exacta | ✅ coincide |

Aislamiento de dependencias: `vi.spyOn(Math, 'random')` elimina la aleatoriedad; no hay acceso a BD ni red.

---

## Fase 3. Pruebas de integración (nuevas)

Archivo: `backend/tests/integration-practica8.test.ts`. Configuración: **sin mocks** — supertest contra la app Express real + Prisma + PostgreSQL de desarrollo (`.env`). Datos de prueba: usuario `test-p8-<ts>@labandera.test`, contraseña `Prueba#123`.

| Prueba | Flujo | Esperado | Obtenido |
|---|---|---|---|
| Flujo correcto | registro → login (`requires2fa`) → `verify-2fa` con TOTP → `GET /api/articles` con token completo | 200 en cada paso, token completo válido | ✅ |
| Manejo de error | login con contraseña incorrecta con 2FA activo | 401 y sin `pendingToken` | ✅ |

---

## Fase 4. E2E

**Ejecución:** script `backend/scripts/e2e-practica8.mjs` contra el servidor real (`pnpm dev`, puerto 3000/3001) y BD real, usuario ficticio.

Pasos, resultado esperado vs. resultado real (registro en `docs/practica8-evidencia/e2e-p8.log`):

| # | Paso | Esperado | Real |
|---|---|---|---|
| 1 | Registro de usuario | 201 | 201 |
| 2 | Setup 2FA (secreto + URI otpauth) | 200 | 200 |
| 3 | Activar 2FA con TOTP válido | 201 + 10 respaldos | 201 + 10 |
| 4 | Login | 200, `requires2fa=true` | 200, `true` |
| 5 | `verify-2fa` con TOTP | 200, token completo | 200 |
| 6 | Acceso a área privada (`/api/articles`) | 200 | 200 |
| 7 | `verify-2fa` con código inválido | 401 (o 429 por rate-limit) | 401 |

**Limitación (declarada):** el E2E automatiza el flujo completo a nivel API contra el servidor real, pero **no automatiza la UI del frontend** (LoginPage/SecurityPage). No se clasificó como E2E de UI automatizado.

**Procedimiento automatizable pendiente (Playwright):**
1. `pnpm add -D @playwright/test` en `frontend/`; `npx playwright install chromium`.
2. Test: abrir `http://localhost:5173/login` → registrar usuario ficticio → ir a Seguridad → escanear/generar TOTP (interceptar la llamada a `/api/auth/totp/setup` para obtener el secreto y generar el código con `otplib`) → completar login con el código → verificar que aparece el área privada y que `totpEnabled=true` en la página de seguridad.
3. Ejecutar con `npx playwright test` usando el backend en modo test.

---

## Fase 5. Auditoría y conclusión técnica

### Pirámide de pruebas actual (tras la práctica)

| Nivel | # pruebas | % |
|---|---|---|
| Unitarias | 10 (5 previas + 5 nuevas) | 27.8 % |
| Integración | 25 (23 previas + 2 nuevas) | 69.4 % |
| E2E | 0 automatizadas (1 flujo E2E manual/script) | 0 % |
| **Total** | **35** | 100 % |

Salida de ejecución: `docs/practica8-evidencia/salida-tests.txt` → **35/35 pasadas**, 6 archivos, ~7 s.

### Capa más débil

**E2E (0 %).** La pirámide está "invertida" en la base: toda la validación se concentra en integración (69 %), que es lenta (depende de BD real) y no cubre el contrato entre frontend y backend: un defecto en la UI de login/2FA (p. ej., no enviar el `pendingToken`) pasaría desapercibido. Además, la capa unitaria (28 %) no cubre los controladores ni middlewares (`verificarToken`, rate-limiting, validación Zod).

### Mejoras priorizadas por riesgo

1. **E2E con Playwright del flujo login + 2FA** (riesgo alto: es la funcionalidad crítica y hoy no se prueba de punta a punta con UI). Procedimiento definido en Fase 4.
2. **CI que ejecute `pnpm test` en cada commit/PR** (riesgo alto: hoy las pruebas solo corren manualmente; sin CI, regresiones de auth pueden llegar a producción). Incluir además una BD de pruebas dedicada (no la de desarrollo) para que la integración sea reproducible.

### Cuándo ejecutar qué

- **En cada cambio de código:** unitarias + integración (`pnpm test`, ~7 s). Suficiente para detectar regresiones de lógica y contratos de API.
- **Antes de una entrega:** la suite completa + el E2E del flujo crítico (script `e2e-practica8.mjs` contra un entorno de staging con BD limpia), y verificación manual de la UI de login/2FA hasta que exista el E2E de Playwright.

### Evidencia

- Código de pruebas: `backend/tests/unit-practica8.test.ts`, `backend/tests/integration-practica8.test.ts`.
- Salida de ejecución: `docs/practica8-evidencia/salida-tests.txt`.
- Registro E2E: `docs/practica8-evidencia/e2e-p8.log`.
- Script E2E: `backend/scripts/e2e-practica8.mjs`.
