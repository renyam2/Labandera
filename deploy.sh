#!/usr/bin/env bash
#
# deploy.sh — build de backend y frontend para actualizar el sistema
#
# Uso: ./deploy.sh
#
set -euo pipefail

cd "$(dirname "$0")"

# ---------- 1. Backend ----------
echo "==> [backend] pnpm install"
(cd backend && pnpm install)

echo "==> [backend] prisma generate + migrate deploy"
(cd backend && pnpm db:generate && pnpm exec prisma migrate deploy)

echo "==> [backend] build (tsc)"
(cd backend && pnpm build)

# ---------- 2. Frontend ----------
echo "==> [frontend] pnpm install"
(cd frontend && pnpm install)

echo "==> [frontend] build (vite)"
(cd frontend && pnpm build)

echo ""
echo "✅ Build completado."
echo "   Backend:  backend/dist (pnpm start)"
echo "   Frontend: frontend/dist"
