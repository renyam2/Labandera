#!/usr/bin/env bash
# Lanza el emulador Wear OS usando la cámara REAL de la laptop.
# (wear-app usa CameraSelector.DEFAULT_BACK_CAMERA, por eso -camera-back.)
set -euo pipefail
source "$(dirname "$0")/config.env"

if [[ "${AVD_NAME}" == REEMPLAZAR* ]]; then
  echo "AVISE: define AVD_NAME en config.env (nombre de tu AVD de Wear OS)."
fi

echo "Lanzando emulador '${AVD_NAME}' con -camera-back webcam (cámara de la laptop)..."
"${SDK}/emulator/emulator" -avd "${AVD_NAME}" -camera-back webcam -no-snapshot
