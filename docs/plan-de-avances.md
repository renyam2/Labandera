# Plan de Avances del Proyecto

> Este documento **sustituye a `docs/plan-2fa.md`** y queda como el único plan de avances vigente del proyecto.

---

## 1. Título del proyecto

**Labandera — Sitio web de noticias con API REST y autenticación de dos pasos (2FA/TOTP)**

Plataforma de noticias (frontend React + Vite + Tailwind, backend Express + Prisma/PostgreSQL) que incorpora un sistema de autenticación de dos pasos basado en TOTP (RFC 6238), compatible con aplicaciones autenticadoras en dispositivos inteligentes.

---

## 2. Punto de partida (contexto del curso anterior)

Durante el cuatrimestre anterior se construyó el proyecto completo. **Ese avance no forma parte del plan de avances de este ciclo**: el tiempo del plan corre únicamente desde las nuevas implementaciones del sistema de autenticación de dos pasos.

**Estado al cierre del curso anterior (referencia):**
- **Backend (API Express + Prisma):** autenticación JWT, RBAC (lector, editor, administrador), gestión de artículos/categorías/imágenes, schemas de validación, middlewares, rate limiting, helmet, tests automatizados (vitest + supertest).
- **Frontend (SPA React):** páginas de noticias, login/registro, estadísticas con `AdminGuard`, accesibilidad, upload.
- **Documentación:** pruebas manuales (`docs/pruebas-manuales.md`), pruebas RBAC (`docs/pruebas-rbac.md`), diagrama de autenticación (`docs/mer-auth.mmd`), reportes de prácticas.

El plan de este ciclo parte de esa base funcional y se centra exclusivamente en la implementación del 2FA.

---

## 3. Justificación

El sistema actual de autenticación se basa únicamente en contraseña + JWT. Una contraseña comprometida (reúso, filtración, ingeniería social) da acceso total a la cuenta, y los administradores/editores manejan contenido sensible.

Implementar **autenticación de dos pasos (2FA) con TOTP** es necesario porque:

1. **Mitiga el robo de credenciales:** aunque la contraseña filtre, el atacante necesita el segundo factor (código TOTP del dispositivo).
2. **No depende de SMS ni correo:** evita costos de mensajería, interceptación de SMS y dependencia de proveedores externos; funciona offline.
3. **Estándar de la industria:** TOTP (RFC 6238) es el mecanismo usado por la mayoría de plataformas (Google, GitHub, etc.), lo que reduce la curva de adopción del usuario.
4. **Recuperación de acceso:** los códigos de respaldo (hash, de uso único) permiten recuperar la cuenta si se pierde el dispositivo.
5. **Endurecimiento:** rate limiting en la verificación y registro de auditoría de intentos reducen el riesgo de fuerza bruta sobre códigos de 6 dígitos.

El alcance se limita a TOTP opt-in con recomendación; MFA por SMS/correo y "recordar este dispositivo" quedan fuera de este ciclo.

---

## 4. Selección de smart device

| Aspecto | Selección | Justificación |
|---|---|---|
| Dispositivo | **Smart watch (Android Wear / Wear OS o Apple Watch)** | Es el smart device que el usuario ya posee y usa a diario; es el medio natural para el segundo factor. |
| Aplicación | **App autenticadora TOTP** disponible para smart watch (p. ej., Aegis, Authy o la app autenticadora nativa del reloj) | Genera los códigos de 6 dígitos localmente (RFC 6238), sin conexión a internet ni costo. |
| Interacción con el proyecto | El usuario escanea un **QR Code** (renderizado en el frontend con `qrcode.react`) desde la cámara del smart watch para registrar el secreto TOTP, e ingresa el código generado en la pantalla de login. | Cierre del flujo completo: navegador (frontend) ↔ API (backend) ↔ smart watch (segundo factor). |
| Criterios de selección | Uso diario y portabilidad permanente, bajo costo, offline, estándar abierto (TOTP), sin dependencia de proveedor. | Garantiza que cualquier usuario pueda activar 2FA sin hardware adicional. |

> El smart watch actúa como **dispositivo de segundo factor**, no como plataforma de despliegue: la aplicación se sigue usando desde el navegador, y el smart device aporta el código TOTP.

---

## 5. División de entregables en 2 secciones

> El plan del nuevo cuatrimestre se divide en **2 parciales** (segundo y tercer parcial), cuyo alcance es la implementación del sistema de autenticación de dos pasos. No hay semanas rígidas: las actividades se listan en orden cronológico de ejecución.

### 5.1 Segundo parcial — Primera mitad

**Actividades en orden cronológico:**

1. **Diseño y preparación**
   - [ ] Diseño técnico: modelo de datos (`User.totpSecret/totpEnabled/totpEnabledAt`, tabla `TotpBackupCode`), endpoints y diagrama `docs/mer-2fa.mmd`.
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

4. **Frontend: configuración del 2FA**
   - [ ] Página `/security`: activar 2FA con QR Code, secreto en texto y códigos de respaldo (visible una vez); confirmación con código de 6 dígitos.
   - [ ] Servicios HTTP (`setupTotp`, `verifyTotpSetup`, `disableTotp`, `regenerateBackupCodes`) y hook `useTwoFactor` con manejo de errores.
   - **Hito H4:** frontend de configuración 2FA funcional.

**Criterio de aceptación del parcial:** usuario puede activar 2FA desde el navegador y loguearse en dos pasos (backend + setup frontend), con tests de los flujos críticos.

### 5.2 Tercer parcial — Segunda mitad

**Actividades en orden cronológico:**

1. **Frontend: login de dos pasos**
   - [ ] Paso 2 en la pantalla de login: campo de código de 6 dígitos, opción de código de respaldo, "olvidé mi dispositivo".
   - [ ] Token pendiente en memoria (no `localStorage`); desactivación de 2FA desde la sección de seguridad (con contraseña).
   - **Hito H5:** experiencia de usuario 2FA completa (setup + login + desactivación).

2. **Pruebas y endurecimiento**
   - [ ] Tests de integración (vitest + supertest): login con/sin 2FA, código correcto/incorrecto/expirado, respaldo válido/usado, setup con/sin autorización, rate limit (429).
   - [ ] Revisión de seguridad: secreto ofuscado, respaldos en hash, token pendiente no persistido, validación con zod, sin logs de secretos/códigos.
   - **Hito H6:** sistema probado y endurecido.

3. **Documentación y puesta en producción**
   - [ ] Actualizar `README.md`; crear `docs/2fa.md` (guía de usuario); actualizar `pruebas-manuales.md`; diagrama final `docs/mer-2fa.mmd`.
   - [ ] Migración en producción, build y deploy de backend y frontend; verificación end-to-end en producción.
   - **Hito H7:** 2FA en producción y documentado.

4. **Estabilización y cierre**
   - [ ] Monitoreo de intentos de autenticación, corrección de bugs, ajuste de rate limits.
   - [ ] Retrospectiva del ciclo y backlog para el siguiente (MFA SMS/email, "recordar este dispositivo").
   - **Hito H8 (final):** 2FA estabilizado en producción.

**Criterio de aceptación del parcial:** en producción, un usuario puede activar 2FA por QR, loguearse con contraseña + TOTP, recuperar acceso con código de respaldo y desactivar 2FA, todo cubierto por tests y documentación.

---

## 6. Resumen ejecutivo de hitos

| Parcial | Hito | Entregable |
|---|---|---|
| 2º | H1 | Diseño técnico aprobado, dependencias listas |
| 2º | H2 | Endpoints backend de configuración 2FA |
| 2º | H3 | Login de dos pasos en backend |
| 2º | H4 | Frontend de configuración 2FA (QR + setup) |
| 3º | H5 | Frontend de login 2FA + desactivación |
| 3º | H6 | Pruebas automatizadas + endurecimiento |
| 3º | H7 | Documentación + despliegue a producción |
| 3º | H8 | Estabilización y cierre del ciclo |
