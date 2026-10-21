#!/usr/bin/env bash
# Conveniencia: lanza el emulador Wear OS con la cámara de la laptop.
# (En la laptop, la cámara es local, así que solo hay que lanzar el emulador.)
set -euo pipefail
cd "$(dirname "$0")"
bash launch-emulator.sh
