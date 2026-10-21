# wear-app-simulación

Simulación de la cámara del smartwatch (Wear OS) en el **emulador de Android**,
usando la **cámara real de la laptop CachyOS**.

**Todo se ejecuta en la laptop.** Esta carpeta se importa a la laptop y se
ejecuta ahí: la cámara (`/dev/video0`) es local al emulador, así que **no se
necesita SSH ni `v4l2loopback`**. El emulador simplemente usa la cámara física
de la laptop como su cámara trasera.

---

## Cómo funciona

```
Laptop CachyOS
  /dev/video0  (cámara real)  -->  emulador Wear OS  (-camera-back webcam)  -->  wear-app
```

- El emulador Wear OS se lanza con `-camera-back webcam`.
- El emulador lee la cámara física de la laptop (`/dev/video0`) como su
  "cámara trasera".
- `wear-app` usa `CameraSelector.DEFAULT_BACK_CAMERA`, por eso se configura la
  **cámara trasera** del emulador.
- Apuntas la cámara de la laptop al QR (mostrado en una pantalla) y el emulador
  lo ve en tiempo real.

> **Fallback:** si el modo "webcam" del emulador no detecta la cámara (p. ej.
> porque otra app la está usando), usa el frame estático (Paso 4B), que siempre
> funciona para escanear el QR.

---

## Requisitos (en la laptop)

- [ ] Android SDK con emulador (p. ej. `/home/renyam/Android/Sdk`)
- [ ] `ffmpeg` instalado (para el fallback de frame estático)
- [ ] Un **AVD de Wear OS** (Paso 0)
- [ ] Cámara de la laptop accesible en `/dev/video0`

---

## Paso a paso (en la laptop)

### Paso 0 — Crea un AVD de Wear OS
Android Studio → **Device Manager** → **Create Virtual Device** → elige un
dispositivo **Wear OS**. Anota su nombre (lo usas como `AVD_NAME`).

### Paso 1 — Configura `config.env`
Edita `config.env`:
- `SDK` → ruta del Android SDK en la laptop.
- `AVD_NAME` → nombre de tu AVD de Wear OS.
- `VIDEO_DEV` → dispositivo de la cámara (normalmente `/dev/video0`).

### Paso 2 — Lanza el emulador con la cámara de la laptop
```bash
cd wear-app-simulación
bash launch-emulator.sh
```
O, desde Android Studio, en la configuración del AVD pon
**Camera → Back → "Webcam"**.

Verifica que el emulador ve la cámara:
```bash
${SDK}/emulator/emulator -webcam-list
```
Debe listar `/dev/video0`.

### Paso 3 — Escanea el QR en el reloj
1. Instala `wear-app` en el emulador Wear OS.
2. Abre la app y concede el permiso de cámara.
3. Apunta la cámara de la laptop al QR `otpauth://...` (mostrado en una pantalla).
4. La app decodifica el secreto y empieza a mostrar el código TOTP.

### Paso 4B — FALLBACK: frame estático (si el modo webcam falla)
```bash
bash capture-frame.sh
```
Guarda `qr-frame.jpg` (1 cuadro de la cámara de la laptop). Luego:
1. Lanza el emulador (cualquier modo de cámara).
2. Android Studio → **Extended Controls** (icono de engranaje) → **Camera**.
3. Carga `qr-frame.jpg` como imagen de la cámara.
4. En el reloj abre `wear-app`; detectará el QR de la imagen.

---

## Todo en uno
```bash
bash run-simulation.sh
```
Equivalente a `launch-emulator.sh`.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `-webcam-list` no lista la cámara | Otro proceso usa la cámara | Cierra apps que usen la webcam y vuelve a intentar. |
| El emulador no detecta la webcam | Formato/ocupación del dispositivo | Usa el fallback (Paso 4B). |
| La app no detecta el QR | QR pequeño/incierto | Aumenta `VIDEO_SIZE` (p. ej. `1280x720`) y enfoca bien. |
| `SDK` no se encuentra | Ruta distinta en la laptop | Corrige `SDK` en `config.env`. |

---

## Archivos

```
wear-app-simulación/
├── README.md
├── config.env            # edita: SDK, AVD_NAME, VIDEO_DEV
├── run-simulation.sh     # lanza el emulador (conveniencia)
├── launch-emulator.sh    # lanza el emulador con -camera-back webcam
└── capture-frame.sh      # fallback: frame estático qr-frame.jpg
```
