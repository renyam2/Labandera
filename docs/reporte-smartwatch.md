# Reporte: Función de Smart Watch (2FA/TOTP en Wear OS)

**Proyecto:** Labandera
**Módulo:** `wear-app/` — App nativa para Wear OS
**Commit de origen:** `bbe6041` — *feat(2FA): app de smart watch (Wear OS) — escaneo del QR TOTP y generador de códigos*

---

## 1. Resumen ejecutivo

La app de smart watch es el **segundo factor de autenticación (2FA/TOTP)** de Labandera corriendo en un reloj inteligente (Wear OS). Consume el QR `otpauth://` que ya genera el backend en la página `/security` del sitio web, guarda el secreto localmente y genera el código de 6 dígitos cada 30 s, que el usuario escribe al iniciar sesión.

**Cero cambios en backend/frontend**: el reloj solo consume el QR existente. No requiere un dispositivo físico: funciona en el emulador de Wear OS (con cámara virtual).

## 2. Alcance y objetivo

- Proveer un autenticador TOTP en el smart watch (equivalente a Google Authenticator).
- Permitir escanear el QR de activación de 2FA directamente desde el reloj.
- Mostrar el código con countdown en tiempo real y permitir restablecer el secreto.

## 3. Flujo de la función (end-to-end)

```
Backend (POST /api/auth/totp/setup)
        │  genera secreto Base32 + URI otpauth://
        ▼
Sitio web /security → QR visible
        │
        ▼
Smart watch (Wear OS)
   1. Cámara (CameraX) captura el QR
   2. ML Kit Barcode Scanning decodifica la URI otpauth://
   3. OtpauthParser extrae secret/issuer/account/digits/period
   4. Secreto se guarda en SharedPreferences ("labandera_totp")
   5. Totp.generate() produce el código cada 30 s (RFC 6238, HmacSHA1)
        │
        ▼
Usuario escribe el código del reloj en POST /api/auth/login/verify-2fa
        │
        ▼
Backend valida con @otplib (ventana ±1 período) → sesión iniciada
```

## 4. Arquitectura y componentes

### 4.1 Estructura del módulo

```
wear-app/
├── build.gradle.kts            # AGP 8.5.2, Kotlin 2.0.20
├── settings.gradle.kts
├── gradle.properties
└── app/
    ├── build.gradle.kts        # minSdk 30 (Wear OS 3), CameraX + ML Kit
    └── src/main/
        ├── AndroidManifest.xml # permiso CAMERA, launcher
        ├── java/mx/labandera/wear/
        │   ├── MainActivity.kt   # escaneo QR + panel del código
        │   ├── Totp.kt           # RFC 6238 (Base32 + HmacSHA1)
        │   ├── OtpauthParser.kt  # parsea otpauth://totp/...
        │   ├── CirclePreviewView.kt  # preview recortado a círculo
        │   ├── ScanReticleView.kt    # retícula animada de escaneo
        │   └── CodeRingView.kt       # anillo de countdown
        └── res/
            ├── layout/activity_main.xml
            ├── values/strings.xml
            └── values/themes.xml
```

### 4.2 `MainActivity.kt` — lógica principal

| Responsabilidad | Detalle |
|---|---|
| Estado inicial | Si `prefs` ya tiene `secret` → panel del código; si no → escaneo de cámara. |
| Permiso de cámara | `RequestPermission` (ActivityResultContracts); si se otorga → `startCamera()`. |
| Selección de cámara | Prefiere trasera; si no existe, usa frontal; si no hay ninguna, muestra toast (cubre el commit `53382f5` "Manejar dispositivos sin cámara"). |
| Análisis de frames | `ImageAnalysis` con `STRATEGY_KEEP_ONLY_LATEST` en un `ExecutorService` de un hilo; cada frame pasa a ML Kit. |
| Guardado del secreto | Al detectar una URI `otpauth://` válida: guarda `secret`, `account`, `issuer`, `digits`, `period` en SharedPreferences y detiene la cámara. |
| Panel del código | Tick de 1 s (`Handler`): actualiza código, countdown y anillo de progreso. `FLAG_KEEP_SCREEN_ON` para no apagar el reloj. |
| Restablecer | Dialogo de confirmación → borra prefs → vuelve al escaneo. |
| Limpieza | `onDestroy`: detiene callbacks, libera cámara, cierra scanner y executor. |

### 4.3 `Totp.kt` — algoritmo TOTP (RFC 6238)

- `base32Decode()`: decodifica el secreto Base32 (RFC 4648), tolerando padding `=` y guiones.
- `generate()`: contador = `tiempo / período` (8 bytes big-endian) → `HmacSHA1` con el secreto → truncación dinámica (offset por byte final) → módulo `10^digits` → código con padding a la izquierda.
- Sin dependencias externas; replica la lógica de `@otplib` del backend, de modo que los códigos del reloj siempre son aceptados por `/api/auth/login/verify-2fa`.

### 4.4 `OtpauthParser.kt` — parseo de la URI

Formato esperado: `otpauth://totp/Issuer:Account?secret=...&issuer=...&digits=6&period=30`

- Valida scheme `otpauth` y path `totp`.
- Extrae `secret` (obligatorio), `issuer`, `account` (del label o host), `digits` (coerción 6–8, default 6) y `period` (coerción 15–120, default 30).
- Devuelve `null` si la URI no es una configuración TOTP válida (el escaneo sigue buscando).

### 4.5 UI (Wear OS)

- **Pantalla de escaneo**: preview de cámara recortado a círculo (`CirclePreviewView`), retícula animada (`ScanReticleView`) y hint de texto.
- **Panel del código**: anillo de countdown pegado al borde de la esfera (`CodeRingView`), cuenta regresiva, código de 6 dígitos en monospace (36sp, color `#4FC3F7`) y botón **Restablecer**.
- Fondo negro, diseño circular adaptado a la pantalla redonda de Wear OS.

## 5. Integración con el backend

| Endpoint | Rol en la función |
|---|---|
| `POST /api/auth/totp/setup` | Genera el secreto Base32 y la URI `otpauth://` (QR en `/security`) que el reloj escanea. |
| `POST /api/auth/totp/verify-setup` | Valida el código mostrado en el reloj para activar 2FA + 10 códigos de respaldo. |
| `POST /api/auth/login/verify-2fa` | Valida el código del reloj en cada login (ventana ±1 período, `TOTP_WINDOW = 1`). |
| `GET /api/auth/totp/status` · `DELETE /api/auth/totp/` · `POST /api/auth/totp/backup-codes` | Gestión de estado, desactivación y regeneración de respaldos. |

Constantes compartidas: issuer `Labandera`, 6 dígitos, período 30 s. El backend valida con `@otplib` (HmacSHA1, ventana ±1); el reloj replica esa lógica, por lo que ambos lados son compatibles sin servicio intermedio.

## 6. Stack técnico

| Capa | Tecnología |
|---|---|
| Plataforma | Wear OS (minSdk 30 = Wear OS 3 / Android 11, targetSdk 34) |
| Lenguaje | Kotlin 2.0.20, Java 17 |
| Cámara | CameraX 1.4.2 (`Preview` + `ImageAnalysis`) |
| Escaneo QR | ML Kit Barcode Scanning 17.2.0 (offline, sin API key) |
| TOTP | Implementación propia RFC 6238 (Base32 + `HmacSHA1` de `javax.crypto`) |
| Persistencia | SharedPreferences (`labandera_totp`) |
| UI | Material Components, ViewBinding, vistas custom (CirclePreview, ScanReticle, CodeRing) |

## 7. Consideraciones de seguridad

- El secreto TOTP se guarda **en claro en SharedPreferences, solo en el dispositivo** (misma práctica que Google Authenticator). En el backend solo existe el secreto para validar códigos; los códigos de respaldo se almacenan hasheados (bcrypt, nunca en claro).
- ML Kit opera **offline**: ningún dato sale del dispositivo.
- La app no requiere red: no hay llamadas HTTP desde el reloj; la integración es solo por QR y por el código que el usuario teclea.

## 8. Limitaciones y riesgos conocidos

- **Sin criptografía de almacenamiento**: el secreto en SharedPreferences está en claro en el dispositivo (aceptable por paridad con autenticadores comerciales, pero sin `EncryptedSharedPreferences`).
- **Dependencia de la hora del dispositivo**: si el reloj tiene la hora descalibrada más de ±30 s, los códigos dejarán de validarse (mitigado por la ventana ±1 del backend).
- **Escaneo con cámara virtual**: en emulador requiere subir una captura del QR; con QR de bajo contraste puede fallar a la primera.
- **Sin sincronización multi-dispositivo**: cada reloj escanea su propio QR; no hay replicación del secreto entre dispositivos.

## 9. Cómo ejecutar (resumen)

1. Abrir `wear-app/` en Android Studio y dejar sync de Gradle.
2. Crear emulador **Wear OS** (Device Manager).
3. Ejecutar `app` o `./gradlew :app:assembleDebug`.
4. En la web: login → `/security` → **Activar 2FA** → QR.
5. Emulador: *Extended Controls → Camera → Set Image* con el PNG del QR.
6. El reloj guarda el secreto y muestra el código; confirmarlo en la web activa el 2FA.

## 10. Conclusión

La función de smart watch es un autenticador TOTP autocontenido para Wear OS que reutiliza el flujo 2FA existente de Labandera sin modificar backend ni frontend. Su valor es permitir leer el segundo factor directamente en la muñeca, con escaneo QR offline (ML Kit), generación local RFC 6238 compatible con `@otplib` del backend, y una UI circular nativa de Wear OS (escaneo con retícula y anillo de countdown).
