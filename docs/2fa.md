# Autenticación de dos factores (2FA / TOTP)

Segundo factor de autenticación basado en **TOTP (RFC 6238)** para Labandera.
El usuario configura una app autenticadora (Aegis, Authy, Google Authenticator,
Clock/Watch Face con TOTP en Wear OS, etc.) que escanea un QR; después, cada
login requiere además de la contraseña un código de 6 dígitos.

## Arquitectura

- **Backend** — módulo `backend/src/features/twofactor/` (service, controller,
  routes, schemas) + integración en `auth.controller.ts` (login de dos pasos).
- **Frontend** — `src/app/services/totp.ts` (cliente API),
  `src/app/pages/SecurityPage.tsx` (página `/security` para administrar el 2FA)
  y `LoginPage.tsx` (segundo paso del login).
- **Smart watch** — cero código propio: solo se instala una app TOTP de terceros
  que escanea la URI `otpauth://` generada por el backend.

## Modelo de datos

| Campo / Tabla | Descripción |
|---|---|
| `User.totpSecret` | Secreto Base32 (≤64 chars). `null` si el 2FA está desactivado. |
| `User.totpEnabled` | Flag booleano. |
| `User.totpEnabledAt` | Fecha de activación. |
| `TotpBackupCode` | 10 códigos de respaldo (8 dígitos) por usuario, **hasheados con bcrypt**, de un solo uso (`usedAt`). |
| `AuthAttempt` | Auditoría de intentos de verificación (TOTP o backup, éxito/fallo). |

Migración: `backend/prisma/migrations/20260930132954_add_totp_2fa/migration.sql`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Si `totpEnabled`, devuelve `{ requires2fa: true, pendingToken }` (JWT de ~5 min con claim `mfa: "pending"`). Si no, token completo de 7 días. |
| `POST` | `/api/auth/login/verify-2fa` | Verifica código TOTP (6 dígitos) o código de respaldo (8). Emite el JWT de 7 días. Rate-limit estricto: 5 intentos / 15 min por IP. |
| `GET` | `/api/auth/totp/status` | `{ totpEnabled, totpEnabledAt }` para la página de seguridad. |
| `POST` | `/api/auth/totp/setup` | Genera secreto + URI `otpauth://` (no activa aún). |
| `POST` | `/api/auth/totp/verify-setup` | Confirma código válido, activa el 2FA y devuelve los 10 códigos de respaldo (se muestran una sola vez). |
| `DELETE` | `/api/auth/totp` | Desactiva el 2FA (requiere contraseña en el body). |
| `POST` | `/api/auth/totp/backup-codes` | Regenera los 10 códigos de respaldo (anula los anteriores). |

## Flujo

```
login (contraseña)
  └─ ¿totpEnabled?
       ├─ no  → JWT 7 días → listo
       └─ sí  → pendingToken (5 min, solo en memoria del frontend)
                  └─ POST /login/verify-2fa
                       ├─ código TOTP válido   → JWT 7 días
                       ├─ código de respaldo   → JWT 7 días (se consume)
                       └─ incorrecto/expirado  → 400/401 → reintentar
```

## Decisiones de seguridad

- El **token pendiente nunca se guarda en localStorage**: vive solo en el state
  de React durante el login.
- Los **códigos de respaldo se almacenan hasheados** (bcrypt, cost 10) y son de
  un solo uso.
- El código de verificación se valida con **zod** (`/^\d{6}$/`) y el rate-limit
  de `verify-2fa` es más estricto que el de login (5 vs 15 intentos / 15 min).
- Cada intento de verificación se registra en `AuthAttempt` (auditoría).
- Desactivar el 2FA **requiere la contraseña** (no basta con el token).
- `otplib` (RFC 6238) con ventana ±1 período para tolerar desincronización.

## Pruebas

- `backend/tests/totp.service.test.ts` — unitarias del servicio (generación,
  verificación, códigos de respaldo), sin base de datos.
- `backend/tests/totp.test.ts` — integración del flujo completo (setup →
  verify-setup → login de dos pasos → verify-2fa con TOTP y con backup).

## Diagrama

Ver [`docs/mer-2fa.mmd`](mer-2fa.mmd).
