# UNIVERSIDAD TECNOLÓGICA DE QUERÉTARO

**Nombre de los integrantes:**
Elian Eduardo Ramírez Ramírez

**Grupo:**
IDGS17

**Nombre de la actividad:**
FORMATO DE AVANCES

**Nombre de la materia:**
Desarrollo para dispositivos inteligentes

---

# Labandera — Sitio web de noticias con API REST y autenticación de dos pasos (2FA/TOTP)

Plataforma de noticias (frontend React + Vite + Tailwind, backend Express + Prisma/PostgreSQL) que incorpora un sistema de autenticación de dos pasos basado en TOTP (RFC 6238), compatible con aplicaciones autenticadoras en dispositivos inteligentes (smart watch).

> **Punto de partida:** durante el cuatrimestre anterior se construyó el proyecto completo (backend con JWT/RBAC, frontend SPA, documentación). Ese avance **no** forma parte de este plan: el tiempo del plan corre únicamente desde las nuevas implementaciones del sistema de autenticación de dos pasos. El plan se centra exclusivamente en el 2FA.

---

# División de entregables en 3 fases

Los 8 entregables originales (H1–H8) se reagrupan en **3 fases**, cada una con su hito de cierre y evidencia (incluye espacios para capturas de pantalla de las funciones de la aplicación del smart watch).

| Fase | Alcance | Entregables originales | Hito de cierre |
|---|---|---|---|
| **Fase 1** — Diseño y backend del 2FA | Diseño técnico, modelo de datos, endpoints de configuración y login de dos pasos en el backend | H1, H2, H3 | Backend de 2FA completo y testeado |
| **Fase 2** — Frontend y smart watch | Página de seguridad, login de dos pasos en el navegador y app autenticadora en el smart watch (Wear OS) | H4, H5 | Experiencia de usuario 2FA completa (setup + login + desactivación) |
| **Fase 3** — Pruebas, documentación y producción | Tests de integración, endurecimiento, documentación, deploy y estabilización | H6, H7, H8 | 2FA estabilizado en producción y documentado |

---

## FASE 1 — Diseño y backend del 2FA

### Actividades

1. **Diseño y preparación**
   - [ ] Diseño técnico: modelo de datos (`User.totpSecret` / `totpEnabled` / `totpEnabledAt`, tabla `TotpBackupCode`), endpoints y diagrama `docs/mer-2fa.mmd`.
   - [ ] Rama `feat/2fa-foundation`; instalar `otplib` (backend) y `qrcode.react` (frontend); revisar rate limits.
   - [ ] Checklist de pruebas manuales 2FA.
   - **Hito H1:** diseño aprobado y base técnica lista.

2. **Modelo de datos y configuración 2FA (backend)**
   - [ ] Migración de Prisma (campos en `User` + `TotpBackupCode`).
   - [ ] Endpoints: `POST /api/auth/totp/setup`, `POST /api/auth/totp/verify-setup`, `DELETE /api/auth/totp`, `POST /api/auth/totp/backup-codes` + middleware `requireTwoFactorConfig`.
   - **Hito H2:** backend de configuración 2FA completo y testeado.

3. **Login de dos pasos (backend)**
   - [ ] `POST /api/auth/login` con token pendiente + `requires2fa`; `POST /api/auth/login/verify-2fa` (TOTP o código de respaldo de uso único).
   - [ ] Rate limiting en `verify-2fa` y registro de auditoría (`AuthAttempt`).
   - **Hito H3:** login de dos pasos operativo en backend.

### Hito de cierre de la fase

**H1 + H2 + H3:** el backend genera el secreto TOTP y el QR, valida el código del segundo paso (TOTP o respaldo de uso único), aplica rate limiting y registra auditoría de intentos.

### Evidencia

- [ ] Captura: diagrama de autenticación 2FA (`docs/mer-2fa.mmd` renderizado).
- [ ] Captura: migración de Prisma aplicada (campos en `User` + tabla `TotpBackupCode`).
- [ ] Captura: respuesta de `POST /api/auth/totp/setup` (secreto Base32 + URI `otpauth://`).
- [ ] Captura: verificación de endpoint con `curl`/Postman (código correcto e incorrecto).
- [ ] Captura: registro de auditoría (`AuthAttempt`) en la base de datos.

---

## FASE 2 — Frontend y smart watch

### Actividades

1. **Frontend: configuración del 2FA**
   - [ ] Página `/security`: activar 2FA con QR Code, secreto en texto y códigos de respaldo (visible una vez); confirmación con código de 6 dígitos.
   - [ ] Servicios HTTP (`setupTotp`, `verifyTotpSetup`, `disableTotp`, `regenerateBackupCodes`) y hook `useTwoFactor` con manejo de errores.
   - **Hito H4:** frontend de configuración 2FA funcional.

2. **Frontend: login de dos pasos**
   - [ ] Paso 2 en la pantalla de login: campo de código de 6 dígitos, opción de código de respaldo, "olvidé mi dispositivo".
   - [ ] Token pendiente en memoria (no `localStorage`); desactivación de 2FA desde la sección de seguridad (con contraseña).
   - **Hito H5:** experiencia de usuario 2FA completa (setup + login + desactivación).

3. **App del smart watch (Wear OS) — segundo factor**
   - [ ] App autenticadora TOTP (`wear-app`): escaneo del QR de `/security`, guardado local del secreto, generación del código de 6 dígitos cada 30 s (RFC 6238, HmacSHA1) con countdown.
   - [ ] Funciones auxiliares: botón **Restablecer** (borra el secreto para escanear de nuevo) y **Ingresar secreto manualmente** (pegar el secreto Base32 sin escanear el QR).
   - [ ] Validación en el emulador de Wear OS (cámara virtual): escaneo del QR generado por el sitio y lectura del código en el login de la web.

### Hito de cierre de la fase

**H4 + H5 (+ app del smart watch):** el usuario puede activar 2FA desde el navegador (QR escaneado con el smart watch), loguearse en dos pasos leyendo el código en el reloj, usar un código de respaldo y desactivar el 2FA con contraseña.

### Evidencia — Capturas de pantalla de las funciones de la app del smart watch

> Insertar aquí las capturas de pantalla de la aplicación del smart watch (Wear OS, `wear-app`):

**1. Pantalla de escaneo del QR**
(cámara del reloj apuntando al QR de la página `/security`, con retícula de escaneo)

| Captura 1 — Escaneo del código QR desde la cámara del smart watch |
|---|
| *(espacio para captura de pantalla)* |

**2. Código TOTP de 6 dígitos con countdown**
(código generado localmente cada 30 s, con anillo de progreso)

| Captura 2 — Código de 6 dígitos mostrado en el smart watch |
|---|
| *(espacio para captura de pantalla)* |

**3. Entrada manual del secreto**
(botón "Ingresar secreto manualmente" con el campo para pegar el secreto Base32)

| Captura 3 — Pantalla de ingreso manual del secreto TOTP |
|---|
| *(espacio para captura de pantalla)* |

**4. Botón Restablecer**
(confirmación para borrar el secreto y escanear un QR nuevo)

| Captura 4 — Función de restablecer / desvincular el reloj |
|---|
| *(espacio para captura de pantalla)* |

**5. Cierre del flujo en la web**
(página `/security` confirmando el código del reloj y mostrando los códigos de respaldo)

| Captura 5 — Confirmación del 2FA en la página /security de la web |
|---|
| *(espacio para captura de pantalla)* |

**6. Login de dos pasos**
(paso 1: email + contraseña; paso 2: campo de código de 6 dígitos leído del smart watch)

| Captura 6 — Pantalla de login con el segundo paso (código del smart watch) |
|---|
| *(espacio para captura de pantalla)* |

### Evidencia complementaria

- [ ] Captura: página `/security` con el QR Code renderizado (`qrcode.react`).
- [ ] Captura: códigos de respaldo visibles una sola vez tras la activación.
- [ ] Captura: opción de código de respaldo y "olvidé mi dispositivo" en el login.
- [ ] Captura: desactivación de 2FA desde la sección de seguridad (con contraseña).

---

## FASE 3 — Pruebas, documentación y producción

### Actividades

1. **Pruebas y endurecimiento**
   - [ ] Tests de integración (vitest + supertest): login con/sin 2FA, código correcto/incorrecto/expirado, respaldo válido/usado, setup con/sin autorización, rate limit (429).
   - [ ] Revisión de seguridad: secreto ofuscado, respaldos en hash, token pendiente no persistido, validación con zod, sin logs de secretos/códigos.
   - **Hito H6:** sistema probado y endurecido.

2. **Documentación y puesta en producción**
   - [ ] Actualizar `README.md`; crear `docs/2fa.md` (guía de usuario); actualizar `pruebas-manuales.md`; diagrama final `docs/mer-2fa.mmd`.
   - [ ] Migración en producción, build y deploy de backend y frontend; verificación end-to-end en producción.
   - **Hito H7:** 2FA en producción y documentado.

3. **Estabilización y cierre**
   - [ ] Monitoreo de intentos de autenticación, corrección de bugs, ajuste de rate limits.
   - [ ] Retrospectiva del ciclo y backlog para el siguiente (MFA SMS/email, "recordar este dispositivo").
   - **Hito H8 (final):** 2FA estabilizado en producción.

### Hito de cierre de la fase

**H6 + H7 + H8:** en producción, un usuario puede activar 2FA por QR (escaneado con el smart watch), loguearse con contraseña + TOTP, recuperar acceso con código de respaldo y desactivar el 2FA; todo cubierto por tests, documentación y monitoreo.

### Evidencia

- [ ] Captura: resultados de los tests de integración (vitest + supertest).
- [ ] Captura: respuesta 429 por rate limit en `verify-2fa`.
- [ ] Captura: documentación `docs/2fa.md` y `README.md` actualizados.
- [ ] Captura: verificación end-to-end en producción (activación, login 2FA, respaldo, desactivación).
- [ ] Captura: panel/consulta de auditoría de intentos en producción.

---

# Resumen ejecutivo de hitos

| Fase | Hito | Entregable |
|---|---|---|
| 1 | H1 | Diseño técnico aprobado, dependencias listas |
| 1 | H2 | Endpoints backend de configuración 2FA |
| 1 | H3 | Login de dos pasos en backend |
| 2 | H4 | Frontend de configuración 2FA (QR + setup) |
| 2 | H5 | Frontend de login 2FA + desactivación |
| 2 | — | App del smart watch (Wear OS) como segundo factor |
| 3 | H6 | Pruebas automatizadas + endurecimiento |
| 3 | H7 | Documentación + despliegue a producción |
| 3 | H8 | Estabilización y cierre del ciclo |
