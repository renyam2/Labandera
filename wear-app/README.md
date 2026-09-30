# Labandera — App de smart watch (Wear OS)

Segundo factor de autenticación (2FA/TOTP) para **Labandera** corriendo en un
**smart watch**. No requiere un dispositivo físico: funciona en el **emulador
de Wear OS** de Android Studio (que incluye una cámara virtual).

La app:

1. **Escanea el QR** de la página `/security` del sitio web (la URI
   `otpauth://` que genera `POST /api/auth/totp/setup` en el backend).
2. **Guarda el secreto TOTP** localmente (SharedPreferences).
3. **Genera el código de 6 dígitos** cada 30 s (RFC 6238, HmacSHA1 —
   misma lógica que `@otplib` en el backend) y lo muestra con countdown.
4. Botón **Restablecer** para borrar el secreto y escanear de nuevo.

> Cero cambios en backend/frontend: el QR ya existe en el sitio; el reloj
> solo lo consume.

## Estructura

```
wear-app/
├── build.gradle.kts            # plugins (AGP 8.5.2, Kotlin 2.0.20)
├── settings.gradle.kts
├── gradle.properties
├── gradle/wrapper/gradle-wrapper.properties
└── app/
    ├── build.gradle.kts        # minSdk 30 (Wear OS 3), CameraX + ML Kit
    └── src/main/
        ├── AndroidManifest.xml # permiso CAMERA, launcher
        ├── java/mx/labandera/wear/
        │   ├── MainActivity.kt   # escaneo QR + panel del código
        │   ├── Totp.kt           # RFC 6238 (Base32 + HmacSHA1)
        │   └── OtpauthParser.kt  # parsea otpauth://totp/...
        └── res/
            ├── layout/activity_main.xml
            ├── values/strings.xml
            └── values/themes.xml
```

## Cómo ejecutarla (sin smart watch físico)

### 1. Abrir el proyecto

- Android Studio → **File → Open** → selecciona esta carpeta `wear-app/`.
- Deja que Gradle haga sync (descarga AGP, Kotlin, CameraX y ML Kit).
- Si pide generar el wrapper, acepta (o abre el proyecto y ejecuta
  `gradle wrapper` desde el terminal de Android Studio).

### 2. Crear el emulador de Wear OS

- **Tools → Device Manager → Create Virtual Device** → categoría **Wear OS**
  (p. ej. *Wear OS 3* / *Wear OS 4*).
- Ábrelo. (También puedes lanzarlo desde un emulador de teléfono con
  **Tools → Wear OS → Launch Wear Emulator**.)

### 3. Instalar y abrir la app

- Ejecuta la configuración `app` (botón Run) con el emulador de Wear OS
  seleccionado, o instala el APK: `./gradlew :app:assembleDebug`.
- Toca el ícono **Labandera 2FA** en el reloj.

### 4. Escanear el QR desde el "reloj"

El emulador de Wear OS tiene **cámara virtual**:

1. En el navegador (o en el emulador de teléfono), entra a
   `http://<tu-backend>/` → login con `admin@labandera.mx / password123`
   → página **/security** → **Activar 2FA** → aparece el QR.
2. Toma una captura del QR (PNG).
3. En el emulador del reloj: **Extended Controls → Camera** →
   **Set Image** (o *Send Image to Emulator*) → elige el PNG del QR.
4. La app detecta la URI `otpauth://`, guarda el secreto y muestra el código.

> Tip: si el QR no se detecta a la primera, sube una captura más grande /
> con más contraste, o reenvía la imagen a la cámara virtual.

### 5. Cerrar el flujo 2FA en la web

1. El reloj muestra el código de 6 dígitos → escríbelo en
   `POST /api/auth/totp/verify-setup` (la página /security lo hace al
   confirmar) → 2FA activado + 10 códigos de respaldo.
2. Cierra sesión y vuelve a login: el segundo paso se lee **en el reloj**.

## Notas

- ML Kit Barcode Scanning es **offline** y no requiere API key.
- El secreto se guarda en claro en SharedPreferences **solo en el
  dispositivo** (igual que en Google Authenticator); en el backend solo
  existe el secreto para validar códigos y los backups hasheados.
- `Totp.kt` replica la validación de `@otplib` (ventana ±1 período en el
  backend), así los códigos del reloj siempre son aceptados por
  `/api/auth/login/verify-2fa`.
