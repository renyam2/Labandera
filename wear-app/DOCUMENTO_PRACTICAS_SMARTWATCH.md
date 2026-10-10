# Documento de integración de prácticas — Smartwatch (Wear OS)

**Proyecto:** `wear-app` — App de segundo factor de autenticación (2FA/TOTP) para **Labandera**, desarrollada en **Kotlin nativo** para **Wear OS** (smartwatch), ejecutada en el **emulador de Wear OS** de Android Studio.

> Este documento explica **dónde se usan los elementos de cada práctica** dentro del proyecto real de la carpeta `wear-app`, y **justifica** los elementos que no se utilizan porque no son viables para este caso concreto. Solo se cubre la rama de **smartwatch**; las secciones de Smart TV y Alexa quedan fuera de alcance.

---

## 0. Resumen del sistema real

| Aspecto | Valor en el proyecto |
|---|---|
| Dispositivo | Smartwatch (Wear OS 3+, `minSdk = 30`) |
| Lenguaje | Kotlin (JVM 17) |
| IDE | Android Studio |
| Build | Gradle Kotlin DSL (`gradlew`) |
| UI | Views nativas + ViewBinding (`activity_main.xml`) |
| Cámara | CameraX (`androidx.camera`) |
| Escaneo QR | ML Kit Barcode Scanning (offline, sin API key) |
| Cifrado | `javax.crypto.Mac` (HmacSHA1, RFC 6238) |
| Almacenamiento | `SharedPreferences` (local, privado) |
| Conectividad | Ninguna (app standalone: `com.google.android.wearable.standalone = true`) |
| Pantallas | 2 estados principales + 2 diálogos (escaneo / código) |

### 0.1. Estado de aplicación por práctica

Cada práctica expone únicamente los temas que se vieron en clase; el criterio para marcarla como **positiva** es que **al menos una función** de esos temas se use en el proyecto.

| Práctica | Temas expuestos | Elementos usados en `wear-app` | Funciones usadas (al menos una) | Estado |
|---|---|---|---|---|
| **1 — UI Smartwatch** | Pantallas, menú, botones, tipografía, navegación, colores, notificaciones | Panel de código, 2 botones, tipografía monoespaciada, fondo negro, toques, Toast | `showCodePanel()`, `updateCode()`, `showManualInput()`, `confirmReset()` | ✅ **Positiva** |
| **2 — Arquitectura** | Componentes, comunicación, procesamiento local, persistencia, seguridad, offline | Capa de dominio TOTP, `SharedPreferences`, permiso CAMERA, anti-spam | `Totp.generate()`, `Totp.base32Decode()`, `OtpauthParser.parse()` | ✅ **Positiva** |
| **3 — Entorno de desarrollo** | Flutter, Dart, SDK, emulador, `flutter doctor` | Android SDK, Gradle, Android Studio, emulador Wear OS con cámara virtual | Ninguna (solo configuración del entorno) | ❌ **No positiva** |
| **4 — Notificaciones** | Notification Channel, `TaskAlert`, feedback al usuario | `Toast` en pantalla, diálogos Material, anti-spam | `Toast.makeText(...)`, `MaterialAlertDialogBuilder(...).show()` | ✅ **Positiva** |

En resumen: **3 prácticas (1, 2 y 4) son positivas** porque usan al menos una función del proyecto; la **práctica 3 no** lo es, pues solo expone temas de configuración del entorno y no ejecuta código de la app.

---

# Práctica 1 — Diseño de interfaces para dispositivos inteligentes (Smartwatch)

## 1.1. Mapeo de los requerimientos de la práctica al proyecto real

La práctica pide el sistema **FitLife** (monitoreo de actividad física). El proyecto de la carpeta **no es FitLife**, sino **Labandera 2FA**, por lo que cada elemento de la práctica se mapea así:

| Requisito de la práctica (FitLife, Smartwatch) | ¿Se usa en `wear-app`? | Dónde / Justificación |
|---|---|---|
| Pantalla 1 — Inicio (hora, pasos, FC, calorías, progreso) | **Parcial** | El "inicio" es el **panel del código** (`codePanel` en `activity_main.xml`): muestra la información principal del sistema (código TOTP, cuenta, countdown, anillo de progreso). **No hay pasos, FC ni calorías porque Wear OS no expone sensores de actividad al desarrollador de forma estándar ni el caso de estudio (2FA) no los requiere.** |
| Pantalla 2 — Frecuencia cardiaca (actual, mín, máx, indicador visual) | **No** | **No viable:** la app no consume sensores biométricos; además Wear OS no garantiza acceso a la FC para apps de terceros. El "indicador visual" de la práctica sí tiene equivalente: el anillo de progreso `CodeRingView` (arco que se "come" con el countdown). |
| Pantalla 3 — Actividad (caminar/correr/bicicleta/entrenamiento) | **No** | **No viable:** no existe actividad física en el caso de estudio. El equivalente de "selección de modo" es la elección entre **escanear QR** vs. **ingresar secreto manualmente** (`manualButton`). |
| Pantalla 4 — Objetivo diario (meta, actuales, %) | **Parcial** | El objetivo del sistema es "generar un código válido". El **anillo de countdown** (`CodeRingView.setProgress(remaining/period)`) muestra el progreso del ciclo actual de 30 s como porcentaje completado. |
| Pantalla 5 — Notificaciones (3 notificaciones) | **Parcial** | Se usan **`Toast`** como mecanismo de notificación en pantalla (QR no TOTP, secreto inválido, permiso denegado, secreto vacío). Justificación completa en la **Práctica 4**. |
| Pantallas ≥ 5 | **No** | La app es de **una sola Activity con 2 estados + 2 diálogos**. **Justificación:** en un smartwatch cada pantalla extra añade un gesto/touch más; para una utilidad de un solo propósito (mostrar un código) la navegación mínima es la decisión correcta de UX, no una limitación del diseño. |
| Toques | **Sí** | `resetButton`, `manualButton`, `scanHint` (tocar pantalla para reintentar permiso) en `MainActivity.kt`. |
| Deslizamientos | **No** | **No viable:** con solo 2 estados no hay lista que deslizar; en Wear OS se preferirían `yarn`/`pill` layouts de la librería `androidx.wear`, que no se necesitan aquí. |
| Botones reducidos pero accesibles | **Sí** | Botones con `textSize` 12–13 sp y alto táctil suficiente; el diálogo de entrada manual se expande a `MATCH_PARENT` porque "en Wear la ventana del diálogo es demasiado pequeña" (comentario en `showManualInput()`). |
| Comandos de voz | **No** | **No viable:** el caso de estudio no los pide y añadir `SpeechRecognizer` consumiría recursos (batería, CPU) en un dispositivo con recursos limitados sin beneficio para un flujo de 10 segundos. |

### Los 2 estados de la interfaz (equivalentes a "pantallas")

1. **Estado de escaneo** — `previewView` (cámara recortada a círculo), `scanReticle` (retícula animada), `scanHintText`, botón *Ingresar secreto manualmente*.
2. **Estado de código** — `codeRing` (anillo de progreso), `accountText`, `codeText` (código de 6 dígitos, monoespaciado, 36 sp; baja a 28 sp si son 8 dígitos), `countdownText`, botón *Restablecer*.
3. **Diálogo de confirmación** — `MaterialAlertDialogBuilder` para "¿Restablecer?".
4. **Diálogo de entrada manual** — `EditText` de secreto Base32 + cuenta, a pantalla completa.

## 1.2. Tabla de decisiones de diseño (comentario de clase)

| Elemento | Smartwatch (wear-app) | Justificación |
|---|---|---|
| **Menú** | Sin menú. Una sola Activity con 2 estados. | En una esfera de ~1.5" un menú de varias entradas obliga a deslizar/tocar repetidas veces; la app es de un solo propósito (mostrar el código), así que el menú se elimina por completo. |
| **Botones** | 2 botones persistentes (`Restablecer`, `Ingresar secreto manualmente`) + botones de diálogo (Guardar/Cancelar). `MaterialButton` con `textSize` 12–13 sp. | Botones grandes en área táctil limitada; solo acciones destructivas o alternativas (reset/manual) merecen botón dedicado. El diálogo se expande a pantalla completa porque el tamaño por defecto de diálogo en Wear es demasiado pequeño. |
| **Tipografía** | Código: `fontFamily="monospace"`, `letterSpacing=0.15`, 36 sp (28 sp si 8 dígitos). Títulos 12–15 sp, ayudas 11 sp. | Monoespaciado para evitar ambigüedad entre caracteres (0/O, 1/I) al transcribir el código a mano; el tamaño se reduce dinámicamente porque "8 dígitos no caben cómodamente a 36 sp en la esfera de Wear OS" (comentario en `showCodePanel()`). |
| **Navegación** | Sin navegación: transición automática entre escaneo → código al detectar el QR; volver a escaneo solo con *Restablecer*. | Minimiza el número de toques: el usuario llega, mira el código y se va. La transición es por evento (QR detectado), no por menú. |
| **Información** | Código (dato principal), cuenta, countdown en segundos, estado de error vía Toast. | El dato que el usuario viene a buscar (el código de 6 dígitos) ocupa el centro visual; todo lo secundario se reduce a texto de 11–12 sp. |
| **Interacción** | Toque (botones, pantalla para reintentar permiso), cámara (escaneo automático), diálogo con teclado. | Wear OS no tiene control remoto ni ratón; el toque es el método primario. La cámara es la interacción "pasiva" más rápida: escanear un QR es más rápido que tipear un secreto Base32 en esfera. |
| **Colores** | Fondo negro; código azul `#4FC3F7`; textos grises `#808080`/`#B0B0B0`; anillo de progreso azul sobre pista blanca translúcida. | Fondo negro ahorra batería en pantallas AMOLED y da máximo contraste (legibilidad bajo luz solar, típica del uso de smartwatch); el azul de acento distingue el dato accionable (el código) del resto. |
| **Notificaciones** | `Toast` en pantalla (QR no TOTP, secreto inválido, permiso denegado, secreto vacío) con anti-spam (`lastInvalidSecret`, `lastNonOtpauth`, `codeErrorShown`). | Wear OS no tiene un "panel de notificaciones" persistente como el teléfono; el feedback inmediato en pantalla es el mecanismo correcto. Ver Práctica 4. |

## 1.3. Preguntas de la práctica (rama smartwatch)

**¿Qué información debe mostrarse primero en el smartwatch?**
La información que el usuario viene a buscar en ese instante. En FitLife sería el resumen del día (pasos/FC/calorías); en `wear-app` es **el código TOTP y el countdown**, que ocupan el centro de la esfera en el mayor tamaño de fuente (36 sp monoespaciado). Lo secundario (cuenta, título) queda en 11–12 sp alrededor.

**¿Qué información puede mostrarse con mayor detalle en la Smart TV?**
*(Fuera de alcance de este documento, pero como contraste:)* en una pantalla grande caben gráficas históricas, tablas y textos largos; en el smartwatch solo el dato del momento. En `wear-app` el equivalente sería la página web `/security` (secreto completo, códigos de respaldo), que sí muestra detalle porque es una pantalla grande.

**¿Qué diferencias existen entre tocar una pantalla y navegar con un control remoto?**
*(Pregunta orientada al contraste TV; en smartwatch solo aplica el toque.)* Tocar es directo sobre el elemento (precisión espacial), mientras el control remoto es secuencial (foco + aceptar): la interfaz debe ser lineal y predecible. En `wear-app` esto justifica que no exista navegación: la secuencia es forzada por eventos (QR detectado → panel de código), no por el usuario.

**¿Qué elementos de la interfaz tuvieron que modificarse entre ambos dispositivos?**
*(Contraste TV; en smartwatch las modificaciones aplicadas fueron:)* menú eliminado, diálogos a pantalla completa, tipografía dinámica según número de dígitos, botones reducidos pero con área táctil suficiente, feedback por Toast en lugar de notificaciones de sistema, fondo negro para AMOLED.

**¿Cuál de los dos diseños requiere una navegación más simplificada y por qué?**
El del **smartwatch**. La esfera tiene ~1.5" de diámetro, se mira con un vistazo (1–2 s) y se opera con el pulgar sin ver la pantalla; cada toque extra tiene un costo alto (cuello doblado, precisión reducida). Por eso `wear-app` reduce la navegación a cero: 2 estados automáticos y 2 botones.

---

# Práctica 2 — Arquitectura de una aplicación para dispositivo inteligente

**Dispositivo elegido:** Reloj inteligente (Smartwatch, Wear OS).

## 2.1. Modelo arquitectónico

```
┌────────────────────────────────────────────────────────────────┐
│                    wear-app (Wear OS, Kotlin)                  │
│                                                              │
│  ┌────────────────────────── Capa de UI ───────────────────┐  │
│  │ MainActivity.kt          activity_main.xml              │  │
│  │  ├─ CirclePreviewView   (cámara recortada a círculo)    │  │
│  │  ├─ ScanReticleView     (retícula animada de escaneo)   │  │
│  │  ├─ CodeRingView        (anillo de progreso countdown)  │  │
│  │  └─ Dialogs: reset / entrada manual                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │ eventos (toques, frames de cámara)  │
│  ┌────────────────────── Capa de dominio ──────────────────┐  │
│  │ OtpauthParser.kt  → parsea otpauth://totp/...           │  │
│  │ Totp.kt           → RFC 6238 (Base32 + HmacSHA1)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│  ┌────────────────────── Capa de servicios ─────────────────┐  │
│  │ CameraX (cámara)  +  ML Kit Barcode (escaneo offline)   │  │
│  │ SharedPreferences "labandera_totp" (persistencia local) │  │
│  │ Handler/Looper (tick 1 s del countdown)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
        │ (sin conexión en tiempo de ejecución)
        │
   QR otpauth:// ← generado por el backend web (POST /api/auth/totp/setup)
   Solo se consume el QR; la app NUNCA hace llamadas HTTP.
```

## 2.2. Respuestas a los puntos que debe determinar el equipo

| Pregunta de la práctica | Respuesta en `wear-app` |
|---|---|
| **Qué componentes tendrá el sistema** | `MainActivity` (controlador UI/estado), `Totp` (cálculo RFC 6238), `OtpauthParser` (parseo de URI), `CirclePreviewView` / `ScanReticleView` / `CodeRingView` (vistas custom), CameraX + ML Kit (servicios de hardware), `SharedPreferences` (persistencia). |
| **Cómo se comunicarán entre sí** | Unidireccional por eventos: cámara → `ImageAnalysis` → `analyzeFrame()` → `OtpauthParser` → `Totp` → UI. `Handler(Looper.getMainLooper())` dispara el tick de 1 s que actualiza `codeText` y `codeRing`. Sin buses, sin red. |
| **Dónde se procesará la información** | **100 % local (on-device).** Cifrado HmacSHA1 con `javax.crypto` (API de la plataforma, sin dependencias), decodificación Base32 propia, escaneo QR con ML Kit **offline**. |
| **Qué información permanecerá localmente** | El secreto TOTP, cuenta, issuer, dígitos y período en `SharedPreferences` (`MODE_PRIVATE`, archivo `labandera_totp`). `android:allowBackup="false"` impide que salga en backups de Android. |
| **Qué información será enviada a servidores** | **Ninguna en tiempo de ejecución.** La única "comunicación" es el QR `otpauth://` que el backend ya generó y que el reloj escanea. La validación del código la hace el backend web al comparar contra su propio cálculo (ventana ±1 período), no la app. |
| **Cómo interactuará el usuario con el sistema** | Toques (botones, pantalla), cámara (escaneo pasivo), teclado (diálogo de entrada manual). |
| **Qué mecanismos de seguridad** | (1) Secreto solo en el dispositivo, `MODE_PRIVATE` + `allowBackup=false`; (2) permiso `CAMERA` solicitado en runtime con contrato `RequestPermission`; (3) validación del secreto Base32 antes de guardarlo; (4) anti-spam de errores (`lastInvalidSecret`, `lastNonOtpauth`, `codeErrorShown`); (5) `proguard-rules.pro` para release. |
| **Qué sucede cuando no existe conexión a Internet** | **Nada cambia: la app funciona completamente offline.** El TOTP se calcula con el reloj del dispositivo (`System.currentTimeMillis()`), sin servidor. Solo el escaneo inicial del QR requiere que el usuario lo obtenga de la web. |
| **Restricciones de recursos** | `minSdk 30`, una sola Activity, un solo `ExecutorService` de un hilo para la cámara, `STRATEGY_KEEP_ONLY_LATEST` para no acumular frames, `FLAG_KEEP_SCREEN_ON` (el costo de batería se acepta porque la app se usa segundos), tipografía reducida para 8 dígitos. |

---

# Práctica 3 — Configuración inicial del entorno de desarrollo

## 3.1. Respuestas previas a la instalación

| Pregunta | Respuesta |
|---|---|
| ¿Qué es Flutter? | Framework de Google para construir UIs multiplataforma (móvil, web, desktop) a partir de un solo código base. |
| ¿Qué lenguaje de programación utiliza Flutter? | **Dart**. |
| ¿Qué es Dart? | Lenguaje de Google, tipado, compilable a nativo (AOT) o JS; es el lenguaje de Flutter. |
| ¿Qué es Flutter SDK? | Paquete que contiene el framework Flutter, el compilador, las herramientas (`flutter` CLI), los widgets base y los conectores con las plataformas. |
| ¿Qué función cumple Android Studio? | IDE oficial de Google para desarrollar apps Android; en este proyecto sirve para abrir `wear-app`, gestionar Gradle, depurar y **crear/ejecutar el emulador de Wear OS**. |
| ¿Qué es Android SDK? | Conjunto de APIs, librerías y herramientas (aDB, build-tools, plataformas) necesarias para compilar y ejecutar apps Android. |
| ¿Qué es un emulador? | Máquina virtual que simula un dispositivo físico (SO, hardware, sensores) para probar la app sin hardware real. |
| ¿Diferencia entre dispositivo físico y emulador? | El físico tiene rendimiento, batería y sensores reales; el emulador es más lento pero reproducible, barato y permite escenarios imposibles (cámara virtual con imagen fija, como el QR de esta app). |
| ¿Qué es un IDE? | Entorno integrado de desarrollo: editor, compilador, depurador y herramientas en una sola herramienta. |
| ¿Qué función cumple `flutter doctor`? | Diagnóstico del entorno: verifica SDK, toolchains, dispositivos conectados y recursos de red, marcando ✓/✗ por componente. |

## 3.2. ¿Se usó Flutter en este proyecto? — Justificación

**No. El proyecto `wear-app` está escrito en Kotlin nativo para Wear OS, no en Flutter.** Justificación de por qué no es viable usar Flutter aquí:

1. **Wear OS + Flutter es una combinación marginal:** Flutter para Wear OS existe, pero el ecosistema maduro para relojes es `androidx.wear` (layouts circulares, yarn, always-on). Este proyecto usa **Views nativas** (`androidx.wear:wear:1.3.0`, `MaterialButton`, diálogos de Material) que son la ruta estándar y más ligera.
2. **Recursos:** Flutter añade el motor Flutter (C++/Dart AOT) al APK; en un smartwatch con poca RAM y CPU, una app de un solo propósito en Kotlin nativo es más eficiente.
3. **Acceso a hardware:** CameraX + ML Kit se integran directamente con las APIs de Android; en Flutter requerirían plugins de terceros.

### Equivalencias entre las herramientas de la práctica y las usadas en el proyecto

| Herramienta de la práctica (Flutter) | Equivalente usado en `wear-app` |
|---|---|
| Flutter SDK + Dart SDK | **Kotlin** (2.0.20) + **AGP 8.5.2** (Android Gradle Plugin) |
| `flutter --version` | `./gradlew --version` |
| `flutter doctor` | **Gradle sync** de Android Studio + verificación del toolchain Android (SDK, Platform-Tools, Build-Tools, Emulator) |
| Emulador Android (Alternativa A) | **Emulador Wear OS** (Device Manager → Wear OS 3/4) con **cámara virtual** |
| `flutter devices` | `adb devices` / Device Manager de Android Studio |
| Android SDK (SDK, Platform, Platform-Tools, Build-Tools, Emulator) | **Sí, se usa exactamente el mismo Android SDK** — Flutter lo requeriría igual |

### Ubicación y versión de las herramientas (documentadas en el proyecto)

| Dato | Valor |
|---|---|
| Ruta del proyecto | `~/Documentos/Labandera/wear-app` |
| Gradle wrapper | `gradle/wrapper/gradle-wrapper.properties` |
| Kotlin | 2.0.20 (raíz `build.gradle.kts`) |
| AGP | 8.5.2 |
| `compileSdk` / `targetSdk` | 34 |
| `minSdk` | 30 (Wear OS 3 / Android 11) |
| Executable de build | `./gradlew` (wrapper en la raíz) |
| SDK de Android | definido en `local.properties` (`sdk.dir`) |

### Emulador utilizado (equivalente a la "Alternativa A — Emulador")

| Parámetro | Valor |
|---|---|
| Nombre del dispositivo | Wear OS (Device Manager) |
| Modelo | Wear OS 3 / Wear OS 4 (categoría Wear OS) |
| Resolución | Esfera circular del AVD de Wear OS |
| Versión de Android | Wear OS 3 (Android 11) o superior |
| Cámara | **Cámara virtual** (Extended Controls → Camera → Set Image con el PNG del QR) |

### Capturas de pantalla (pendientes de insertar)

```
┌───────────────────────────────────────────────────────────────────┐
│ [CAPTURA 1] Terminal: salida de `./gradlew --version`            │
│ (equivalente a `flutter --version`: versión de Gradle/Kotlin)    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ [CAPTURA 2] Android Studio: Gradle Sync exitoso del proyecto     │
│ (equivalente a `flutter doctor`: toolchains Android ✓)           │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ [CAPTURA 3] Device Manager: emulador Wear OS creado y en marcha  │
│ (nombre, versión de Android, esfera circular)                    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ [CAPTURA 4] Extended Controls → Camera → Set Image con el QR     │
│ (cámara virtual recibiendo el otpauth://)                       │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ [CAPTURA 5] App en el emulador: panel del código TOTP con        │
│ countdown y anillo de progreso                                    │
└───────────────────────────────────────────────────────────────────┘
```

### Preguntas finales de la práctica

- **Flutter SDK vs Dart SDK:** Dart SDK es el lenguaje (compilador, librerías estándar); Flutter SDK es el framework construido sobre Dart que añade widgets, renderizado y tooling multiplataforma. *(No aplican directamente: este proyecto usa Kotlin + Android SDK.)*
- **¿Función de `flutter doctor`?** Diagnóstico del entorno; su equivalente aquí es el Gradle sync + verificación del SDK de Android en Android Studio.
- **¿Problemas durante la configuración?** El principal fue la **cámara virtual del emulador de Wear OS**: el QR no siempre se detecta a la primera (se resuelve reenviando una imagen mayor/más contrastada o usando la entrada manual del secreto Base32).
- **¿Por qué es necesario configurar Android SDK?** Porque Gradle/AGP necesita Platform, Platform-Tools y Build-Tools para compilar el APK y el emulador para ejecutarlo.
- **¿Ventajas del emulador?** Reproducibilidad, cámara virtual con imagen fija (ideal para escanear el QR), sin hardware, rápido de recrear.
- **¿Ventajas del dispositivo físico?** Rendimiento real, batería real, sensores reales (FC, GPS) y pruebas de usabilidad real (tacto, luz solar).
- **¿Qué información proporciona `flutter devices`?** Dispositivos/emuladores conectados y su estado; equivalente: `adb devices`.
- **¿Qué sucede si Flutter no encuentra el Android SDK?** `flutter doctor` marca ✗ en "Android toolchain" y no se puede construir para Android; equivalente aquí: Gradle falla al no encontrar `sdk.dir` en `local.properties`.
- **¿Componentes del entorno?** IDE (Android Studio), SDK de la plataforma (Android SDK), lenguaje (Kotlin), sistema de build (Gradle), emulador, depurador.
- **¿Pasos para configurar en una PC nueva?** 1) Instalar Android Studio → 2) instalar Android SDK (SDK, Platform, Platform-Tools, Build-Tools, Emulator) vía SDK Manager → 3) instalar JDK 17 → 4) clonar el proyecto → 5) Gradle sync → 6) crear AVD Wear OS → 7) Run.

---

# Práctica 4 — Implementación de una notificación en Android Studio

## 4.1. ¿Se implementó `TaskAlert` / Notification Channel en este proyecto? — Justificación

**No. `wear-app` no crea `NotificationChannel` ni notificaciones del sistema Android.** Justificación de por qué no es viable en este contexto:

1. **Wear OS no tiene el panel de notificaciones del teléfono.** En un smartwatch las notificaciones del sistema se muestran como píldoras en la esfera y se gestionan desde el teléfono compañero; no existe el "centro de notificaciones" persistente donde el usuario iría a buscar un recordatorio.
2. **El flujo de la app es de segundos, no de recordatorios.** `TaskAlert` notifica para volver más tarde; `wear-app` necesita **feedback inmediato en pantalla** (¿QR válido? ¿se guardó el secreto? ¿permiso denegado?) mientras la cámara está activa.
3. **El mecanismo usado es `Toast`**, que es la notificación en pantalla apropiada para Wear OS en este caso:
   - `Toast.makeText(this, getString(R.string.qr_not_totp), ...)` → "QR detectado, pero no es un código TOTP válido"
   - `Toast.makeText(this, "Secreto TOTP inválido: ...", ...)`
   - `Toast.makeText(this, "Este dispositivo no tiene cámara", ...)`
   - `Toast.makeText(this, "El secreto no puede estar vacío", ...)`
   - Diálogo `MaterialAlertDialogBuilder` para la confirmación destructiva (Restablecer).
4. Se aplica además **anti-spam** (`lastInvalidSecret`, `lastNonOtpauth`, `codeErrorShown`) porque la cámara detecta el mismo QR repetidamente cada frame; un `NotificationChannel` dispararía notificaciones duplicadas.

### Equivalencia práctica

| Elemento de `TaskAlert` (práctica) | Equivalente en `wear-app` |
|---|---|
| Botón "GENERAR NOTIFICACIÓN" | Botón *Ingresar secreto manualmente* / escaneo automático del QR |
| Notification Channel "TaskAlert" | No aplica (Wear OS) → `Toast` + diálogos Material |
| Notificación "Nueva tarea pendiente" | Toast "QR detectado, pero no es un código TOTP válido" / "Secreto TOTP inválido" |
| Al tocar la notificación se abre la app | Al tocar la esfera con permiso denegado se reabre el flujo (`scanHint.setOnClickListener { cameraPermission.launch(...) }`) |

## 4.2. Investigación solicitada (Notification Channels)

- **¿Qué es un Notification Channel?** Un contenedor que agrupa notificaciones de un tipo (p. ej., "tareas pendientes") al que el usuario puede asignar comportamiento (sonido, vibración, importancia) desde Ajustes.
- **¿Por qué es necesario?** Desde Android 8.0 (API 26) **toda** notificación debe pertenecer a un canal; sin canal no se muestra. Permite al usuario controlar por categoría.
- **¿A partir de qué versión?** Android 8.0 / API 26 (O).
- **¿Puede modificarse posteriormente la importancia del canal desde la aplicación?** No de forma efectiva una vez creado: la app puede declarar la importancia inicial al crear el canal, pero el **usuario** puede cambiarla en Ajustes y la app no puede forzarla después (solo puede crear un canal nuevo con otra importancia).

### Capturas de pantalla (pendientes de insertar)

```
┌───────────────────────────────────────────────────────────────────┐
│ [CAPTURA 6] (Si se construye TaskAlert como ejercicio aparte)    │
│ Pantalla principal de TaskAlert con el botón GENERAR             │
│ NOTIFICACIÓN                                                      │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ [CAPTURA 7] (Si se construye TaskAlert como ejercicio aparte)    │
│ Notificación en el panel del teléfono: "Nueva tarea pendiente"   │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ [CAPTURA 8] wear-app: Toast de feedback en el emulador Wear OS   │
│ (p. ej., "QR detectado, pero no es un código TOTP válido")       │
└───────────────────────────────────────────────────────────────────┘
```

---

# Anexo — Scripts del proyecto

## A.1. `app/build.gradle.kts`

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "mx.labandera.wear"
    compileSdk = 34

    defaultConfig {
        applicationId = "mx.labandera.wear"
        minSdk = 30 // Wear OS 3 (Android 11)
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    // Wear OS
    implementation("androidx.wear:wear:1.3.0")

    // UI base
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")

    // Cámara (CameraX)
    implementation("androidx.camera:camera-core:1.4.2")
    implementation("androidx.camera:camera-camera2:1.4.2")
    implementation("androidx.camera:camera-lifecycle:1.4.2")
    implementation("androidx.camera:camera-view:1.4.2")

    // Escaneo de QR (ML Kit, offline, sin API key)
    implementation("com.google.mlkit:barcode-scanning:17.2.0")
}
```

## A.2. `app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.CAMERA" />

    <uses-feature android:name="android.hardware.type.watch" />
    <uses-feature android:name="android.hardware.camera.any" android:required="false" />

    <application
        android:allowBackup="false"
        android:label="@string/app_name"
        android:theme="@style/Theme.LabanderaWear">

        <meta-data
            android:name="com.google.android.wearable.standalone"
            android:value="true" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>```

## A.3. `MainActivity.kt`

```kotlin
package mx.labandera.wear

import android.Manifest
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import mx.labandera.wear.databinding.ActivityMainBinding
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val prefs: SharedPreferences by lazy {
        getSharedPreferences("labandera_totp", MODE_PRIVATE)
    }
    private val handler = Handler(Looper.getMainLooper())
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var barcodeScanner: BarcodeScanner? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var cameraBound = false
    private var lastInvalidSecret: String? = null
    private var lastNonOtpauth: String? = null
    private var codeErrorShown = false

    private val cameraPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) {
                binding.scanHint.setOnClickListener(null)
                startCamera()
            } else {
                showCameraDenied()
            }
        }

    private val tick = object : Runnable {
        override fun run() {
            updateCode()
            handler.postDelayed(this, 1000L)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.resetButton.setOnClickListener { confirmReset() }
        binding.manualButton.setOnClickListener { showManualInput() }

        if (prefs.contains("secret")) showCodePanel() else requestCameraAndScan()
    }

    // ── Escaneo del QR ──────────────────────────────────────────────────────

    private fun requestCameraAndScan() {
        binding.codePanel.visibility = View.GONE
        binding.previewView.visibility = View.VISIBLE
        binding.scanReticle.visibility = View.VISIBLE
        binding.scanHint.visibility = View.VISIBLE
        binding.scanHintText.text = getString(R.string.scan_hint)
        binding.scanHint.setOnClickListener(null)

        val granted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
        if (granted) startCamera() else cameraPermission.launch(Manifest.permission.CAMERA)
    }

    /**
     * El usuario denegó el permiso de cámara: muestra un mensaje y permite
     * reintentar tocando la pantalla.
     */
    private fun showCameraDenied() {
        binding.previewView.visibility = View.GONE
        binding.scanReticle.visibility = View.GONE
        binding.scanHintText.text = getString(R.string.camera_denied_hint)
        binding.scanHint.setOnClickListener {
            cameraPermission.launch(Manifest.permission.CAMERA)
        }
    }

    private fun startCamera() {
        if (cameraBound) return

        barcodeScanner = BarcodeScanning.getClient()
        val future = ProcessCameraProvider.getInstance(this)
        future.addListener({
            val provider = future.get()
            cameraProvider = provider

            // Elegir una cámara que exista en este dispositivo
            val selector = try {
                when {
                    provider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA) ->
                        CameraSelector.DEFAULT_BACK_CAMERA
                    provider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA) ->
                        CameraSelector.DEFAULT_FRONT_CAMERA
                    else -> null
                }
            } catch (e: Exception) {
                Log.e("Camera", "Error consultando cámaras", e)
                null
            }

            if (selector == null) {
                Log.w("Camera", "Este dispositivo no tiene cámara")
                Toast.makeText(this, "Este dispositivo no tiene cámara", Toast.LENGTH_LONG).show()
                return@addListener
            }

            val preview = Preview.Builder().build()
            preview.setSurfaceProvider(binding.previewView.surfaceProvider)

            val analysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
            analysis.setAnalyzer(cameraExecutor) { image -> analyzeFrame(image) }

            try {
                provider.unbindAll()
                provider.bindToLifecycle(this, selector, preview, analysis)
                cameraBound = true
            } catch (e: Exception) {
                Log.e("Camera", "No se pudo iniciar la cámara", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }
    @androidx.annotation.OptIn(ExperimentalGetImage::class)
    private fun analyzeFrame(image: ImageProxy) {
        val scanner = barcodeScanner
        val mediaImage = image.image
        if (scanner == null || mediaImage == null || prefs.contains("secret")) {
            image.close()
            return
        }
        val input = InputImage.fromMediaImage(mediaImage, image.imageInfo.rotationDegrees)
        scanner.process(input)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    val raw = barcode.rawValue ?: continue
                    val config = OtpauthParser.parse(raw)
                    if (config == null) {
                        // La cámara SÍ está leyendo el QR, pero no es una URI
                        // otpauth:// válida: dar feedback en lugar de callar.
                        if (raw != lastNonOtpauth) {
                            lastNonOtpauth = raw
                            Toast.makeText(this, getString(R.string.qr_not_totp), Toast.LENGTH_LONG).show()
                        }
                        continue
                    }
                    val secret = config.secret.uppercase()
                    try {
                        Totp.base32Decode(secret)
                    } catch (e: IllegalArgumentException) {
                        // Evita spam de toasts si la cámara sigue detectando el mismo QR.
                        if (raw != lastInvalidSecret) {
                            lastInvalidSecret = raw
                            Toast.makeText(this, "Secreto TOTP inválido: ${e.message}", Toast.LENGTH_LONG).show()
                        }
                        return@addOnSuccessListener // sigue escaneando
                    }
                    prefs.edit()
                        .putString("secret", secret)
                        .putString("account", config.account)
                        .putString("issuer", config.issuer)
                        .putInt("digits", config.digits)
                        .putInt("period", config.period)
                        .apply()
                    handler.post { if (!isDestroyed) onSecretSaved() }
                    return@addOnSuccessListener
                }
            }
            .addOnCompleteListener { image.close() }
    }

    private fun onSecretSaved() {
        stopCamera()
        showCodePanel()
    }

    private fun stopCamera() {
        cameraProvider?.unbindAll()
        cameraProvider = null
        cameraBound = false
    }

    // ── Panel del código ─────────────────────────────────────────────────────

    private fun showCodePanel() {
        binding.previewView.visibility = View.GONE
        binding.scanReticle.visibility = View.GONE
        binding.scanHint.visibility = View.GONE
        binding.codePanel.visibility = View.VISIBLE
        val account = prefs.getString("account", null).orEmpty()
        binding.accountText.visibility = if (account.isEmpty()) View.GONE else View.VISIBLE
        binding.accountText.text = account
        // 8 dígitos no caben cómodamente a 36sp en la esfera de Wear OS
        binding.codeText.textSize = if (prefs.getInt("digits", 6) >= 8) 28f else 36f
        updateCode()
        handler.removeCallbacks(tick)
        handler.postDelayed(tick, 1000L)
    }

    private fun updateCode() {
        val secret = prefs.getString("secret", null) ?: return
        val digits = prefs.getInt("digits", 6)
        val period = prefs.getInt("period", 30)
        val nowSeconds = System.currentTimeMillis() / 1000L
        val remaining = period - (nowSeconds % period)
        try {
            binding.codeText.text = Totp.generate(secret, nowSeconds, period, digits)
            codeErrorShown = false
        } catch (e: IllegalArgumentException) {
            // Secreto guardado inválido (p. ej. de una versión anterior): no tumbar la app.
            binding.codeText.text = "—"
            if (!codeErrorShown) {
                codeErrorShown = true
                Toast.makeText(this, "Secreto TOTP guardado es inválido: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
        binding.countdownText.text = getString(R.string.countdown_format, remaining)
        binding.codeRing.setProgress(remaining.toFloat() / period)
    }

    private fun confirmReset() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reset_title)
            .setMessage(R.string.reset_message)
            .setPositiveButton(R.string.reset_confirm) { _, _ ->
                prefs.edit().clear().apply()
                lastInvalidSecret = null
                lastNonOtpauth = null
                codeErrorShown = false
                handler.removeCallbacks(tick)
                requestCameraAndScan()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    // ── Entrada manual del secreto ──────────────────────────────────────────

    private fun showManualInput() {
        val secretInput = EditText(this).apply {
            hint = getString(R.string.manual_secret_label)
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                android.text.InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
            textSize = 14f
            height = 48
        }
        val accountInput = EditText(this).apply {
            hint = getString(R.string.manual_account_label)
            textSize = 14f
            height = 48
        }

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 8, 40, 0)
            addView(secretInput)
            addView(accountInput)
        }

        val dialog = MaterialAlertDialogBuilder(this)
            .setView(ScrollView(this).apply { addView(layout) })
            .setNegativeButton(R.string.cancel, null)
            .create()
        dialog.setButton(
            android.content.DialogInterface.BUTTON_POSITIVE,
            getString(R.string.manual_save),
            android.content.DialogInterface.OnClickListener { _, _ ->
                val secret = secretInput.text.toString().trim().uppercase()
                val account = accountInput.text.toString().trim().ifEmpty { "usuario" }
                if (secret.isEmpty()) {
                    Toast.makeText(this, "El secreto no puede estar vacío", Toast.LENGTH_SHORT).show()
                    return@OnClickListener
                }
                try {
                    Totp.base32Decode(secret)
                } catch (e: IllegalArgumentException) {
                    Toast.makeText(this, "Secreto no válido (Base32): ${e.message}", Toast.LENGTH_LONG).show()
                    return@OnClickListener
                }
                prefs.edit()
                    .putString("secret", secret)
                    .putString("account", account)
                    .putString("issuer", "Labandera")
                    .putInt("digits", 6)
                    .putInt("period", 30)
                    .apply()
                dialog.dismiss()
                onSecretSaved()
            }
        )
        dialog.show()
        // En Wear la ventana del diálogo es demasiado pequeña; se hace a pantalla completa
        dialog.window?.setLayout(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT
        )
    }

    override fun onDestroy() {
        handler.removeCallbacks(tick)
        stopCamera()
        barcodeScanner?.close()
        cameraExecutor.shutdown()
        super.onDestroy()
    }
}```

## A.4. `Totp.kt`

```kotlin
package mx.labandera.wear

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.math.pow

/**
 * Implementación TOTP (RFC 6238) — misma lógica que `@otplib` en el backend.
 * HmacSHA1 sobre el contador de tiempo (30 s por período), sin dependencias externas.
 */
object Totp {

    private const val BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

    /** Decodifica un secreto Base32 (RFC 4648) a bytes. */
    fun base32Decode(input: String): ByteArray {
        val clean = input.uppercase().replace("=", "").replace("-", "")
        if (clean.isEmpty()) throw IllegalArgumentException("Secreto TOTP vacío")
        var accumulator = 0
        var bits = 0
        val out = ArrayList<Byte>()
        for (c in clean) {
            val value = BASE32_ALPHABET.indexOf(c)
            if (value < 0) {
                throw IllegalArgumentException("Secreto TOTP contiene un carácter no Base32: '$c'")
            }
            accumulator = (accumulator shl 5) or value
            bits += 5
            if (bits >= 8) {
                bits -= 8
                out.add(((accumulator ushr bits) and 0xFF).toByte())
            }
        }
        return out.toByteArray()
    }

    /**
     * Genera el código TOTP de `digits` dígitos para el instante actual.
     * Acepta `timeSeconds` explícito para pruebas.
     */
    fun generate(
        secret: String,
        timeSeconds: Long = System.currentTimeMillis() / 1000L,
        period: Int = 30,
        digits: Int = 6,
    ): String {
        val counter = timeSeconds / period
        val key = base32Decode(secret)
        if (key.isEmpty()) throw IllegalArgumentException("Secreto TOTP vacío o inválido")

        val counterBytes = ByteArray(8)
        for (i in 7 downTo 0) counterBytes[i] = (counter ushr (i * 8)).toByte()

        val mac = Mac.getInstance("HmacSHA1")
        mac.init(SecretKeySpec(key, "HmacSHA1"))
        val hash = mac.doFinal(counterBytes)

        val offset = hash[hash.size - 1].toInt() and 0x0F
        val binary = ((hash[offset].toInt() and 0x7F) shl 24) or
            ((hash[offset + 1].toInt() and 0xFF) shl 16) or
            ((hash[offset + 2].toInt() and 0xFF) shl 8) or
            (hash[offset + 3].toInt() and 0xFF)

        return (binary % 10.0.pow(digits)).toLong().toString().padStart(digits, '0')
    }
}
```

## A.5. `OtpauthParser.kt`

```kotlin
package mx.labandera.wear

import android.net.Uri
import java.net.URLDecoder

/** Configuración extraída de una URI `otpauth://totp/...`. */
data class OtpauthConfig(
    val issuer: String,
    val account: String,
    val secret: String,
    val digits: Int = 6,
    val period: Int = 30,
)

/**
 * Parsea la URI `otpauth://` que el backend genera en
 * `POST /api/auth/totp/setup` (ver `totp.service.ts` → `buildOtpauthUri`).
 *
 * Formato: `otpauth://totp/Issuer:Account?secret=...&issuer=...&digits=6&period=30`
 */
object OtpauthParser {

    fun parse(raw: String): OtpauthConfig? {
        val uri = Uri.parse(raw)
        if (uri.scheme?.lowercase() != "otpauth") return null
        // El tipo ("totp") va en la host de la URI: otpauth://totp/Label?... ;
        // se acepta también el formato alternativo otpauth://totp/Label.
        if (uri.host?.lowercase() != "totp") return null

        val secret = uri.getQueryParameter("secret")
        if (secret.isNullOrBlank()) return null

        // El label estándar va en la path; se acepta también un query param `label`.
        // Uri.getPath() devuelve la path sin decodificar: se decodifica el
        // percent-encoding (p. ej. %3A → ':', %40 → '@').
        val label = uri.path?.removePrefix("/")
            ?.let { URLDecoder.decode(it, "UTF-8") }
            ?.trim()
            ?.ifEmpty { null }
            ?: uri.getQueryParameter("label")
            ?: ""
        val issuer = uri.getQueryParameter("issuer")
            ?: label.substringBefore(':').ifEmpty { "Labandera" }
        val account = label.substringAfter(':', missingDelimiterValue = label)
            .ifEmpty { "usuario" }

        val digits = uri.getQueryParameter("digits")?.toIntOrNull()?.coerceIn(6, 8) ?: 6
        val period = uri.getQueryParameter("period")?.toIntOrNull()?.coerceIn(15, 120) ?: 30

        return OtpauthConfig(
            issuer = issuer,
            account = account,
            secret = secret,
            digits = digits,
            period = period,
        )
    }
}
```

## A.6. `CodeRingView.kt` (anillo de progreso del countdown)

```kotlin
package mx.labandera.wear

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View

/**
 * Anillo de progreso circular para el countdown del código TOTP:
 * el arco azul se va "comiendo" conforme faltan menos segundos.
 */
@SuppressLint("ViewConstructor")
class CodeRingView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val trackPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0x33FFFFFF
        strokeWidth = dp(5f)
    }

    private val progressPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0xFF4FC3F7.toInt()
        strokeWidth = dp(5f)
        strokeCap = Paint.Cap.ROUND
    }

    private var progress = 0f

    fun setProgress(p: Float) {
        progress = p.coerceIn(0f, 1f)
        invalidate()
    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    override fun onDraw(canvas: Canvas) {
        val cx = width / 2f
        val cy = height / 2f
        val radius = minOf(width, height) / 2f - dp(4f)
        val rect = android.graphics.RectF(cx - radius, cy - radius, cx + radius, cy + radius)

        canvas.drawCircle(cx, cy, radius, trackPaint)
        if (progress > 0f) {
            // Empieza en la parte superior (-90°)
            canvas.drawArc(rect, -90f, -360f * progress, false, progressPaint)
        }
    }
}
```

## A.7. `ScanReticleView.kt` (retícula animada de escaneo)

```kotlin
package mx.labandera.wear

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import kotlin.math.cos
import kotlin.math.sin

/**
 * Retícula de escaneo estilo smartwatch: anillo punteado, marcas en las
 * esquinas y un arco de barrido que gira continuamente.
 */
@SuppressLint("ViewConstructor")
class ScanReticleView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val accent = 0xFF4FC3F7.toInt()

    private val faintPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0x40FFFFFF
        strokeWidth = dp(1f)
    }

    private val ringPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0xB0FFFFFF.toInt()
        strokeWidth = dp(2f)
        pathEffect = DashPathEffect(floatArrayOf(dp(10f), dp(6f)), 0f)
    }

    private val tickPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0xE0FFFFFF.toInt()
        strokeWidth = dp(3f)
        strokeCap = Paint.Cap.ROUND
    }

    private val sweepPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = accent
        strokeWidth = dp(3f)
        strokeCap = Paint.Cap.ROUND
    }

    private var sweepAngle = 0f
    private val animator = object : Runnable {
        override fun run() {
            sweepAngle = (sweepAngle + 3f) % 360f
            invalidate()
            postDelayed(this, 33L)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (visibility == VISIBLE) post(animator)
    }

    /**
     * Detiene el animador cuando la vista se oculta (p. ej. al mostrar el
     * panel del código) y lo reanuda al volver a ser visible, para no
     * seguir gastando CPU/batería en un view que no se dibuja.
     */
    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, visibility)
        if (visibility == VISIBLE) {
            removeCallbacks(animator)
            post(animator)
        } else {
            removeCallbacks(animator)
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        removeCallbacks(animator)
    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    override fun onDraw(canvas: Canvas) {
        val cx = width / 2f
        val cy = height / 2f
        val radius = minOf(width, height) / 2f - dp(6f)

        // Anillo guía tenue
        canvas.drawCircle(cx, cy, radius, faintPaint)

        // Anillo punteado principal
        canvas.drawCircle(cx, cy, radius, ringPaint)

        // Marcas en las diagonales (esquinas del retículo)
        for (angleDeg in intArrayOf(45, 135, 225, 315)) {
            val rad = Math.toRadians(angleDeg.toDouble())
            val inner = radius - dp(10f)
            val outer = radius + dp(4f)
            canvas.drawLine(
                cx + inner * cos(rad).toFloat(), cy + inner * sin(rad).toFloat(),
                cx + outer * cos(rad).toFloat(), cy + outer * sin(rad).toFloat(),
                tickPaint
            )
        }

        // Arco de barrido girando
        canvas.drawArc(cx - radius, cy - radius, radius * 2f, radius * 2f, sweepAngle, 70f, false, sweepPaint)
    }
}
```

## A.8. `CirclePreviewView.kt` (cámara recortada a círculo)

```kotlin
package mx.labandera.wear

import android.content.Context
import android.graphics.Outline
import android.graphics.Path
import android.util.AttributeSet
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import androidx.camera.core.Preview
import androidx.camera.view.PreviewView

/**
 * Contenedor que recorta un PreviewView a un círculo, para que la cámara
 * se vea como la esfera redonda de un smartwatch (Wear OS).
 *
 * `PreviewView` es una clase final, así que no se puede extender: se envuelve
 * en un FrameLayout y se aplica el outline al PreviewView interno.
 */
class CirclePreviewView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val preview: PreviewView = PreviewView(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        clipToOutline = true
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, existing: Outline) {
                if (view.width <= 0 || view.height <= 0) return
                val radius = minOf(view.width, view.height) / 2f
                val path = Path().apply {
                    addCircle(view.width / 2f, view.height / 2f, radius, Path.Direction.CW)
                }
                existing.setPath(path)
            }
        }
    }

    /** Delega al PreviewView interno para poder crear el [Preview]. */
    val surfaceProvider: Preview.SurfaceProvider
        get() = preview.surfaceProvider

    init {
        addView(preview)
    }
}
```

## A.9. `app/src/main/res/layout/activity_main.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@android:color/black">

    <!-- ── Escaneo del QR: esfera circular ─────────────────────────────── -->
    <FrameLayout
        android:id="@+id/scanContainer"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:padding="10dp">

        <!-- Cámara recortada a círculo (pantalla redonda de Wear OS) -->
        <mx.labandera.wear.CirclePreviewView
            android:id="@+id/previewView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:clipToOutline="true" />

        <!-- Retícula animada de escaneo -->
        <mx.labandera.wear.ScanReticleView
            android:id="@+id/scanReticle"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

        <LinearLayout
            android:id="@+id/scanHint"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_gravity="center_horizontal|bottom"
            android:layout_marginBottom="22dp"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/scan_title"
                android:textColor="#FFFFFF"
                android:textSize="15sp"
                android:textStyle="bold" />

            <TextView
                android:id="@+id/scanHintText"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="4dp"
                android:text="@string/scan_hint"
                android:textColor="#B0B0B0"
                android:textSize="11sp" />

            <Button
                android:id="@+id/manualButton"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="10dp"
                android:text="@string/manual_button"
                android:textSize="12sp" />
        </LinearLayout>
    </FrameLayout>

    <!-- ── Panel del código TOTP: esfera circular ──────────────────────── -->
    <FrameLayout
        android:id="@+id/codePanel"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:padding="10dp"
        android:visibility="gone">

        <!-- Anillo de countdown pegado al borde de la esfera -->
        <mx.labandera.wear.CodeRingView
            android:id="@+id/codeRing"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/code_title"
                android:textColor="#808080"
                android:textSize="12sp" />

            <TextView
                android:id="@+id/accountText"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="2dp"
                android:textColor="#B0B0B0"
                android:textSize="11sp" />

            <TextView
                android:id="@+id/codeText"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="10dp"
                android:fontFamily="monospace"
                android:letterSpacing="0.15"
                android:text="000000"
                android:textColor="#4FC3F7"
                android:textSize="36sp"
                android:textStyle="bold" />

            <TextView
                android:id="@+id/countdownText"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="6dp"
                android:textColor="#808080"
                android:textSize="12sp" />

            <com.google.android.material.button.MaterialButton
                android:id="@+id/resetButton"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="12dp"
                android:text="@string/reset_button"
                android:textSize="13sp" />
        </LinearLayout>
    </FrameLayout>
</FrameLayout>
```

## A.10. `app/src/main/res/values/strings.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Labandera 2FA</string>

    <string name="scan_title">Escanear QR de Labandera</string>
    <string name="scan_hint">Apunta la cámara al código QR de la página /security del sitio web</string>
    <string name="camera_denied_hint">Permiso de cámara denegado. Toca la pantalla para reintentar.</string>
    <string name="qr_not_totp">QR detectado, pero no es un código TOTP válido</string>

    <string name="code_title">Código de verificación 2FA</string>
    <string name="countdown_format">Se renueva en %1$d s</string>

    <string name="reset_button">Restablecer</string>
    <string name="reset_title">¿Restablecer?</string>
    <string name="reset_message">Se borrará el secreto TOTP guardado en este reloj. Tendrás que escanear el QR de nuevo desde la página /security.</string>
    <string name="reset_confirm">Restablecer</string>
    <string name="cancel">Cancelar</string>

    <string name="manual_button">Ingresar secreto manualmente</string>
    <string name="manual_title">Ingresar secreto TOTP</string>
    <string name="manual_hint">Pega el secreto Base32 que aparece en la página /security</string>
    <string name="manual_secret_label">Secreto Base32 (página /security)</string>
    <string name="manual_account_label">Cuenta (opcional)</string>
    <string name="manual_save">Guardar</string>
</resources>
```
