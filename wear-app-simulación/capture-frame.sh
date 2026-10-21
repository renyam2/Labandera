#!/usr/bin/env bash
# FALLBACK (si el modo webcam del emulador no detecta la cámara):
# Captura UN frame de la cámara local de la laptop y lo guarda como qr-frame.jpg.
# Luego lo cargas en Android Studio -> Extended Controls -> Camera.
set -euo pipefail
source "$(dirname "$0")/config.env"

OUT="$(cd "$(dirname "$0")" && pwd)/qr-frame.jpg"

echo "Capturando 1 frame de la cámara local ${VIDEO_DEV}..."
ffmpeg -f v4l2 -i "${VIDEO_DEV}" -frames:v 1 -s "${VIDEO_SIZE}" -q:v 3 "${OUT}"

echo
echo "Frame guardado en: ${OUT}"
echo
echo "Siguiente paso:"
echo "  1. Lanza el emulador Wear OS (cualquier modo de cámara)."
echo "  2. Android Studio -> Extended Controls (icono de engranaje) -> Camera."
echo "  3. Carga ${OUT} como imagen de la cámara."
echo "  4. En el reloj, abre wear-app y deja que detecte el QR."
