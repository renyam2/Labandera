#!/usr/bin/env bash
# Lanza el emulador usando la cámara REAL de la laptop.
# Usa un AVD de PHONE (google_apis): la imagen Wear OS no incluye HAL de
# cámara, así que la cámara no existe en el guest.
# La webcam se expone como cámara FRONTAL (-camera-front webcam0); la app
# prioriza DEFAULT_FRONT_CAMERA, así que usa la webcam física.
set -euo pipefail
source "$(dirname "$0")/config.env"

if [[ "${AVD_NAME}" == REEMPLAZAR* ]]; then
  echo "AVISE: define AVD_NAME en config.env (nombre de tu AVD de Wear OS)."
fi

echo "Lanzando emulador '${AVD_NAME}' con -camera-front webcam0 (cámara física de la laptop)..."
# -camera-front webcam0: expone la webcam como cámara FRONTAL y añade una
# back fake. CameraX 1.4.2 valida que existan front y back (el emulador
# declara android.hardware.camera.front); con solo -camera-back la
# validación falla. La app prioriza DEFAULT_FRONT_CAMERA, así que usa la
# webcam real.
"${SDK}/emulator/emulator" -avd "${AVD_NAME}" -camera-front webcam0 -no-snapshot -no-window
