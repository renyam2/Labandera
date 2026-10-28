#!/usr/bin/env bash
# =============================================================================
# Práctica 7 — Caja negra: suite de pruebas API (TC-01..TC-48, parte backend)
# Sistema: Labandera (backend Express + Prisma + PostgreSQL, frontend React)
# Evidencia: docs/practica7-evidencia/ (un archivo JSON por caso + CSV resumen)
#
# Requisitos previos:
#   - Backend corriendo en http://localhost:3000 (pnpm dev en backend/)
#   - BD labandera con seed (admin@/editor@/usuario@labandera.mx, password123)
#   - jq, psql, ffmpeg o ImageMagick instalados
#
# Orden de ejecución (del documento de la práctica):
#   Fase A: TC-01..TC-05, TC-09..TC-23, TC-24..TC-32, TC-39..TC-41
#   Fase B: TC-44..TC-48 (2FA) + TC-06..TC-08 (login con 2FA)
#   Fase C: TC-42, TC-43 (rate limit; SIEMPRE al final, tras reinicio)
# =============================================================================
set -u

BASE="http://localhost:3000"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EV="$ROOT/docs/practica7-evidencia"
RES="$EV/resultados.csv"
mkdir -p "$EV"
echo "tc,requisito,descripcion,esperado,observado,veredicto" > "$RES"

# --- Contraseña de BD (se pide manualmente, no se guarda en el script) ---------
read -rp "Contraseña de la BD (labandera_user): " DB_PASS
PSQL() { PGPASSWORD="$DB_PASS" psql -h localhost -U labandera_user -d labandera -tAc "$1" 2>/dev/null; }

# --- utilidades -------------------------------------------------------------
PASS=0; FAIL=0

record() { # $1=tc $2=req $3=desc $4=esperado $5=observado
  local ok="RECHAZADO"
  [[ "$4" == "$5" ]] && ok="ACEPTADO"
  [[ "$ok" == "ACEPTADO" ]] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
  echo "$1,$2,\"$3\",\"$4\",\"$5\",\"$ok\"" >> "$RES"
  printf "[%s] %s | esperado: %s | observado: %s => %s\n" "$1" "$3" "$4" "$5" "$ok"
}

save_body() { cp /tmp/body.json "$EV/$1.json"; }

api() { # $1=method $2=path $3=data $4=token  -> CODE, BODY
  local args=(-s -o /tmp/body.json -w "%{http_code}" -X "$1" "$BASE$2" -H "Content-Type: application/json")
  [[ -n "${4:-}" ]] && args+=(-H "Authorization: Bearer $4")
  [[ -n "${3:-}" ]] && args+=(-d "$3")
  CODE=$(curl "${args[@]}")
  BODY=$(cat /tmp/body.json)
}

login() { # $1=email $2=pass -> TOKEN (vacío si falla)
  curl -s -o /tmp/login.json -w "%{http_code}" -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" -d "{\"email\":\"$1\",\"password\":\"$2\"}" > /tmp/login_code
  LCODE=$(cat /tmp/login_code)
  TOKEN=$(jq -r '.token // empty' /tmp/login.json 2>/dev/null)
}

jwt_exp_diff() { # $1=token -> exp-iat
  local payload=$(echo "$1" | cut -d. -f2)
  payload=$(echo "$payload" | tr '_-' '/+'); local pad=$(( (4 - ${#payload} % 4) % 4 ))
  for ((i=0;i<pad;i++)); do payload+="="; done
  jq -r '(.exp - .iat)' <<< "$(base64 -d <<< "$payload")"
}

restart_backend() {
  pkill -f "nodemon[.]js" 2>/dev/null
  pkill -f "bin[.]js src/index[.]ts" 2>/dev/null
  sleep 2
  (cd "$ROOT/backend" && nohup pnpm dev > /tmp/labandera-backend.log 2>&1 &)
  for i in $(seq 1 45); do
    sleep 2
    c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles")
    [[ "$c" == "200" ]] && return 0
  done
  echo "ERROR: el backend no volvió a arrancar"; return 1
}

# --- Limpieza de datos de ejecuciones anteriores (slugs fijos del script) ---
PSQL "DELETE FROM \"ArticleImage\" WHERE \"articleId\" IN (SELECT id FROM \"Article\" WHERE slug IN ('articulo-prueba-caja-negra','articulo-para-subidas','articulo-persistencia','articulo-cat-fantasma','art-slug-dup'))"
PSQL "DELETE FROM \"Article\" WHERE slug IN ('articulo-prueba-caja-negra','articulo-para-subidas','articulo-persistencia','articulo-cat-fantasma','art-slug-dup')"
PSQL "DELETE FROM \"Category\" WHERE name IN ('Categoría Práctica 7','Categoría Práctica 7 editada')"
PSQL "DELETE FROM \"TotpBackupCode\" WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email LIKE '%@labandera.test')"
PSQL "DELETE FROM \"User\" WHERE email LIKE '%@labandera.test'"
echo "[prep] BD limpia de datos de ejecuciones previas"

# --- prepárame los tokens ---------------------------------------------------
echo "== Preparación: login de cuentas seed =="
login "admin@labandera.mx" "password123";   ADMIN_TOKEN="$TOKEN"
login "editor@labandera.mx" "password123";   EDITOR_TOKEN="$TOKEN"
login "usuario@labandera.mx" "password123";  USER_TOKEN="$TOKEN"
[[ -n "$ADMIN_TOKEN" && -n "$EDITOR_TOKEN" && -n "$USER_TOKEN" ]] || { echo "ERROR: no se pudo loguear con las cuentas seed"; exit 1; }
echo "Tokens obtenidos para admin, editor y usuario."

# Imágenes de prueba (validación de subida)
IMG_DIR="$EV/imgs"; mkdir -p "$IMG_DIR"
if command -v convert >/dev/null; then
  convert -size 800x600 plasma:fractal "$IMG_DIR/ok.jpg"
  convert -size 800x600 plasma:fractal "$IMG_DIR/ok.png"
else
  ffmpeg -y -f lavfi -i color=black:s=800x600 -frames:v 1 "$IMG_DIR/ok.jpg"
  ffmpeg -y -f lavfi -i color=black:s=800x600 -frames:v 1 "$IMG_DIR/ok.png"
fi
# JPG de 5 MB exacto (límite) y PNG de 6 MB (excede)
SZ5=$((5*1024*1024)); SZ6=$((6*1024*1024))
cp "$IMG_DIR/ok.jpg" "$IMG_DIR/limite.jpg"; head -c $((SZ5 - $(stat -c%s "$IMG_DIR/limite.jpg"))) /dev/zero >> "$IMG_DIR/limite.jpg"
cp "$IMG_DIR/ok.png" "$IMG_DIR/grande.png"; head -c $((SZ6 - $(stat -c%s "$IMG_DIR/grande.png"))) /dev/zero >> "$IMG_DIR/grande.png"
echo "fake.txt" > "$IMG_DIR/fake.jpg"

# =============================================================================
echo; echo "=== FASE A: operaciones, validaciones, persistencia, RBAC, errores ==="

# --- TC-01..TC-04: registro (REQ-OP-01 / REQ-VAL-01) ---
E01="tc01-$(date +%s)@labandera.test"
api POST /api/auth/register "{\"name\":\"Nuevo Periodista\",\"email\":\"$E01\",\"password\":\"password123\"}"
save_body TC-01
OBS01=$(jq -r 'if .token and (.user.roles[0]=="Usuario") then "token+Usuario" else "faltante" end' /tmp/body.json)
record TC-01 REQ-OP-01 "Registro válido: 201 + token + rol Usuario" "201|token+Usuario" "$CODE|$OBS01"

E02="tc02-$(date +%s)@labandera.test"
api POST /api/auth/register "{\"name\":\"Ab\",\"email\":\"$E02\",\"password\":\"password123\"}"
save_body TC-02
record TC-02 REQ-OP-01 "Registro con nombre de 2 caracteres (límite mín.)" 201 "$CODE"

N100=$(printf 'a%.0s' {1..100}); N101=$(printf 'a%.0s' {1..101})
E03="tc03-$(date +%s)@labandera.test"
api POST /api/auth/register "{\"name\":\"$N100\",\"email\":\"$E03\",\"password\":\"password123\"}"
save_body TC-03
record TC-03 REQ-OP-01 "Registro con nombre de 100 caracteres (límite máx.)" 201 "$CODE"

E04="tc04-$(date +%s)@labandera.test"
api POST /api/auth/register "{\"name\":\"$N101\",\"email\":\"$E04\",\"password\":\"password123\"}"
save_body TC-04
record TC-04 REQ-VAL-01 "Registro con nombre de 101 caracteres" 400 "$CODE"

# --- TC-05: login admin (REQ-OP-02) ---
login "admin@labandera.mx" "password123"
DIFF=$(jwt_exp_diff "$TOKEN")
record TC-05 REQ-OP-02 "Login admin: exp-iat del JWT" 604800 "$DIFF"

# --- TC-09..TC-12: CRUD de artículos (REQ-OP-03/04) ---
CAT_ID=$(curl -s "$BASE/api/categories" | jq -r '.[0].id')
ART_BODY='{"title":"Artículo de prueba caja negra","slug":"articulo-prueba-caja-negra","summary":"Resumen de prueba","content":"Contenido de prueba para la práctica 7.","published":true,"categoryId":"'$CAT_ID'"}'
api POST /api/articles "$ART_BODY" "$EDITOR_TOKEN"
save_body TC-09
ART_ID=$(jq -r '.id' /tmp/body.json)
record TC-09 REQ-OP-03 "Editor crea artículo válido" 201 "$CODE"

api GET /api/articles/$ART_ID
save_body TC-10
AUTHOR=$(jq -r '.author.name' /tmp/body.json)
record TC-10 REQ-OP-03 "GET artículo: autor es editor" "editor@labandera.mx" "$AUTHOR"

api GET /api/articles
save_body TC-11
FOUND=$(jq --arg id "$ART_ID" '[.[] | select(.id==$id)] | length' /tmp/body.json)
record TC-11 REQ-OP-03 "Artículo visible en GET /api/articles" 1 "$FOUND"

api PUT /api/articles/$ART_ID '{"title":"Artículo modificado en caja negra","published":false}' "$EDITOR_TOKEN"
save_body TC-12
record TC-12 REQ-OP-04 "Editor actualiza título y publicado" 200 "$CODE"
api GET /api/articles/$ART_ID
T2=$(jq -r '.title' /tmp/body.json); P2=$(jq -r '.published' /tmp/body.json)
record TC-12 REQ-OP-04 "GET posterior refleja cambios" "Artículo modificado en caja negra|false" "$T2|$P2"

api DELETE /api/articles/$ART_ID "$EDITOR_TOKEN"
save_body TC-13
record TC-13 REQ-NAV-01 "Editor intenta DELETE de artículo" 403 "$CODE"

api DELETE /api/articles/$ART_ID "$ADMIN_TOKEN"
save_body TC-14
record TC-14 REQ-OP-04 "Admin elimina artículo" 200 "$CODE"
api GET /api/articles/$ART_ID
record TC-14 REQ-OP-04 "GET del artículo eliminado" 404 "$CODE"

# Reiniciar backend para resetear authLimiter (15 intentos/15 min por IP)
restart_backend || exit 1

# --- TC-13..TC-15: validaciones de registro (REQ-VAL-01) ---
E13="tc13-$(date +%s)@labandera.test"
api POST /api/auth/register "{\"name\":\"A\",\"email\":\"x@\",\"password\":\"12345\"}"
save_body TC-15
ERRS=$(jq -r '.errors | length' /tmp/body.json 2>/dev/null || echo 0)
record TC-15 REQ-VAL-01 "Registro con 3 campos inválidos: mensajes por campo (name, email, password)" 3 "$ERRS"

E14a="tc14a-$(date +%s)@labandera.test"; E14b="tc14b-$(date +%s)@labandera.test"
P6="123456"; P72=$(printf 'b%.0s' {1..72})
api POST /api/auth/register "{\"name\":\"Ab\",\"email\":\"$E14a\",\"password\":\"$P6\"}"
C14a=$CODE
api POST /api/auth/register "{\"name\":\"Ab\",\"email\":\"$E14b\",\"password\":\"$P72\"}"
C14b=$CODE
save_body TC-16
record TC-16 REQ-VAL-01 "Registro con pass de 6 y 72 caracteres (límites)" "201|201" "$C14a|$C14b"

P5="12345"; P73=$(printf 'b%.0s' {1..73})
E15a="tc15a-$(date +%s)@labandera.test"; E15b="tc15b-$(date +%s)@labandera.test"
api POST /api/auth/register "{\"name\":\"Ab\",\"email\":\"$E15a\",\"password\":\"$P5\"}"
C15a=$CODE
api POST /api/auth/register "{\"name\":\"Ab\",\"email\":\"$E15b\",\"password\":\"$P73\"}"
C15b=$CODE
save_body TC-17
record TC-17 REQ-VAL-01 "Registro con pass de 5 y 73 caracteres" "400|400" "$C15a|$C15b"

# --- TC-16..TC-17: credenciales (REQ-VAL-02) ---
login "admin@labandera.mx" "contraseña-incorrecta"
MSG16=$(jq -r '.message // empty' /tmp/login.json)
record TC-18 REQ-VAL-02 "Login con contraseña incorrecta" 401 "$LCODE"
login "no-existe-$(date +%s)@labandera.test" "cualquiercosa"
MSG17=$(jq -r '.message // empty' /tmp/login.json)
record TC-18 REQ-VAL-02 "Mismo mensaje que TC-18 (no revela cuál campo falló)" "$MSG16" "$MSG17"
record TC-19 REQ-VAL-02 "Login con email inexistente" 401 "$LCODE"

# --- TC-18..TC-20: validaciones de artículos (REQ-VAL-03) ---
api POST /api/articles "{\"title\":\"Título de prueba\",\"slug\":\"mi titulo con espacios\",\"content\":\"x\",\"published\":true,\"categoryId\":\"$CAT_ID\"}" "$EDITOR_TOKEN"
save_body TC-20
record TC-20 REQ-VAL-03 "Slug con espacios" 400 "$CODE"

api POST /api/articles "{\"title\":\"Título de prueba\",\"slug\":\"slug-valido\",\"content\":\"x\",\"published\":true,\"categoryId\":\"no-uuid\"}" "$EDITOR_TOKEN"
save_body TC-21
record TC-21 REQ-VAL-03 "categoryId no UUID" 400 "$CODE"

api PUT /api/articles/$ART_ID '{}' "$EDITOR_TOKEN"
save_body TC-22
record TC-22 REQ-VAL-03 "PUT con body vacío {}" 400 "$CODE"

# --- TC-21..TC-23: validación de subida de imágenes (REQ-VAL-03) ---
# Crear un artículo temporal para subir imágenes
api POST /api/articles "{\"title\":\"Artículo para subidas\",\"slug\":\"articulo-para-subidas\",\"content\":\"x\",\"published\":false,\"categoryId\":\"$CAT_ID\"}" "$EDITOR_TOKEN"
IMG_ART_ID=$(jq -r '.id' /tmp/body.json)

up() { # $1=tc $2=arch $3=esperado
  CODE=$(curl -s -o /tmp/body.json -w "%{http_code}" -X POST "$BASE/api/articles/$IMG_ART_ID/images" \
    -H "Authorization: Bearer $EDITOR_TOKEN" -F "image=@$2")
  save_body "$1"
  record "$1" REQ-VAL-03 "$(basename "$2")" "$3" "$CODE"
}
up TC-23 "$IMG_DIR/fake.jpg" 415
up TC-24 "$IMG_DIR/grande.png" 413
up TC-25 "$IMG_DIR/limite.jpg" 201

# --- TC-24..TC-28: persistencia (REQ-PER-01/02) ---
api POST /api/articles "{\"title\":\"Artículo persistencia\",\"slug\":\"articulo-persistencia\",\"content\":\"Contenido persistente\",\"published\":true,\"categoryId\":\"$CAT_ID\"}" "$EDITOR_TOKEN"
P_ART_ID=$(jq -r '.id' /tmp/body.json)
save_body TC-26
DB1=$(PSQL "SELECT count(*) FROM \"Article\" WHERE id='$P_ART_ID'")
record TC-26 REQ-PER-01 "Crear -> fila en BD" 1 "$DB1"

restart_backend || exit 1
api GET /api/articles/$P_ART_ID
save_body TC-27
record TC-27 REQ-PER-01 "GET tras reiniciar backend (datos persisten)" 200 "$CODE"

api PUT /api/articles/$P_ART_ID '{"title":"Título persistencia editado"}' "$EDITOR_TOKEN"
DB2=$(PSQL "SELECT title FROM \"Article\" WHERE id='$P_ART_ID'")
record TC-28 REQ-PER-01 "PUT -> BD refleja cambio" "Título persistencia editado" "$DB2"

api DELETE /api/articles/$P_ART_ID "$ADMIN_TOKEN"
DB3=$(PSQL "SELECT count(*) FROM \"Article\" WHERE id='$P_ART_ID'")
record TC-29 REQ-PER-01 "DELETE -> fila desaparece de BD" 0 "$DB3"

# slug duplicado: primero crear un artículo con ese slug, luego duplicarlo
api POST /api/articles "{\"title\":\"Artículo slug dup\",\"slug\":\"art-slug-dup\",\"content\":\"x\",\"published\":false,\"categoryId\":\"$CAT_ID\"}" "$EDITOR_TOKEN"
api POST /api/articles "{\"title\":\"Artículo slug dup 2\",\"slug\":\"art-slug-dup\",\"content\":\"x\",\"published\":false,\"categoryId\":\"$CAT_ID\"}" "$EDITOR_TOKEN"
save_body TC-30
record TC-30 REQ-PER-02 "Crear artículo con slug ya existente" 409 "$CODE"

# categoryId UUID inexistente en PUT
FAKE_UUID="00000000-0000-0000-0000-000000000000"
api POST /api/articles "{\"title\":\"Artículo cat fantasma\",\"slug\":\"articulo-cat-fantasma\",\"content\":\"x\",\"published\":false,\"categoryId\":\"$CAT_ID\"}" "$EDITOR_TOKEN"
G_ART_ID=$(jq -r '.id' /tmp/body.json)
api PUT /api/articles/$G_ART_ID "{\"categoryId\":\"$FAKE_UUID\"}" "$EDITOR_TOKEN"
save_body TC-31
record TC-31 REQ-PER-02 "PUT con categoryId UUID inexistente" 409 "$CODE"
DB4=$(PSQL "SELECT \"categoryId\" FROM \"Article\" WHERE id='$G_ART_ID'")
record TC-31 REQ-PER-02 "BD sin estado parcial (categoryId no cambió)" "$CAT_ID" "$DB4"

# --- TC-29..TC-32: RBAC (REQ-NAV-01) ---
api POST /api/articles "$ART_BODY" "$USER_TOKEN"
save_body TC-32
record TC-32 REQ-NAV-01 "Usuario intenta crear artículo" 403 "$CODE"

api POST /api/categories '{"name":"Categoría de Editor"}' "$EDITOR_TOKEN"
save_body TC-33
record TC-33 REQ-NAV-01 "Editor intenta crear categoría" 403 "$CODE"

api POST /api/articles "$ART_BODY"
save_body TC-34
record TC-34 REQ-NAV-01 "POST /api/articles sin token" 401 "$CODE"

api POST /api/categories '{"name":"Categoría Práctica 7"}' "$ADMIN_TOKEN"
save_body TC-35
record TC-35 REQ-NAV-01 "Admin crea categoría" 201 "$CODE"
NEW_CAT_ID=$(jq -r '.id' /tmp/body.json)

api PUT /api/categories/$NEW_CAT_ID '{"name":"Categoría Práctica 7 editada"}' "$ADMIN_TOKEN"
save_body TC-36
record TC-36 REQ-NAV-01 "Admin edita categoría" 200 "$CODE"

api PUT /api/categories/$NEW_CAT_ID '{"name":"Intento editor"}' "$EDITOR_TOKEN"
save_body TC-37
record TC-37 REQ-NAV-01 "Editor intenta editar categoría" 403 "$CODE"

# --- TC-39..TC-41: manejo de errores (REQ-ERR-01) ---
api GET /api/ruta-inexistente
save_body TC-39
record TC-39 REQ-ERR-01 "GET ruta inexistente" 404 "$CODE"
record TC-39 REQ-ERR-01 "Mensaje de ruta" "Ruta no encontrada" "$(jq -r '.message' /tmp/body.json)"

api POST /api/articles "{\"title\":\"x\",\"slug\":\"x\",\"content\":\"x\",\"categoryId\":\"$CAT_ID\"}" "Bearer eyJ"
save_body TC-40
record TC-40 REQ-ERR-01 "Bearer token malformado en ruta protegida" 401 "$CODE"

CODE=$(curl -s -o /tmp/body.json -w "%{http_code}" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{esto no es json')
save_body TC-41
record TC-41 REQ-ERR-01 "Body JSON malformado" 400 "$CODE"
grep -qi "stack\|at .*(" /tmp/body.json && record TC-41 REQ-ERR-01 "Sin stack trace en respuesta" "sin" "CON" || record TC-41 REQ-ERR-01 "Sin stack trace en respuesta" "sin" "sin"

# =============================================================================
echo; echo "=== FASE B: doble factor (REQ-BIZ-01) + login con 2FA (TC-06..TC-08) ==="

# Usuario dedicado para 2FA
E2FA="twofactor-$(date +%s)@labandera.test"
api POST /api/auth/register "{\"name\":\"Usuario 2FA\",\"email\":\"$E2FA\",\"password\":\"password123\"}"
TOKEN2FA=$(jq -r '.token' /tmp/body.json)

api POST /api/auth/totp/setup "" "$TOKEN2FA"
save_body TC-44
OTP_URI=$(jq -r '.otpauthUri' /tmp/body.json)
record TC-44 REQ-BIZ-01 "Setup 2FA: devuelve otpauthUri y QR" 200 "$CODE"
[[ -n "$OTP_URI" ]] || { echo "ERROR: sin otpauthUri"; exit 1; }

T2FA_CODE=$(node "$ROOT/test_blackbox/totp.js" "$OTP_URI")
api POST /api/auth/totp/verify-setup "{\"code\":\"$T2FA_CODE\"}" "$TOKEN2FA"
save_body TC-45
N_BACKUP=$(jq -r '.backupCodes | length' /tmp/body.json 2>/dev/null || jq -r '.backup_codes | length' /tmp/body.json 2>/dev/null || echo 0)
record TC-45 REQ-BIZ-01 "Verify-setup con código válido" 201 "$CODE"
record TC-45 REQ-BIZ-01 "Códigos de respaldo emitidos" 10 "$N_BACKUP"
BACKUP1=$(jq -r '(.backupCodes[0] // .backup_codes[0])' /tmp/body.json)
DB5=$(PSQL "SELECT count(*) FROM \"TotpBackupCode\" WHERE \"userId\"='$E2FA'")
# el id de usuario no es el email; buscar por user
UID2FA=$(PSQL "SELECT id FROM \"User\" WHERE email='$E2FA'")
DB5=$(PSQL "SELECT count(*) FROM \"TotpBackupCode\" WHERE \"userId\"='$UID2FA'")
record TC-45 REQ-BIZ-01 "Códigos de respaldo en BD" 10 "$DB5"

# TC-06: login con 2FA activo
login "$E2FA" "password123"
REQUIRES=$(jq -r '.requires2fa // empty' /tmp/login.json)
PENDING=$(jq -r '.pendingToken // empty' /tmp/login.json)
record TC-06 REQ-OP-02 "Login con 2FA: requires2fa + pendingToken" "true|no-vacío" "$REQUIRES|$([ -n "$PENDING" ] && echo no-vacío || echo vacío)"

# TC-07: verify-2fa con código válido (pendingToken en header Authorization)
T2FA_CODE=$(node "$ROOT/test_blackbox/totp.js" "$OTP_URI")
api POST /api/auth/login/verify-2fa "{\"code\":\"$T2FA_CODE\"}" "$PENDING"
save_body TC-07
record TC-07 REQ-OP-02 "Verify-2fa con código válido: token definitivo" 200 "$CODE"

# TC-08: pendingToken vencido (>5 min)
login "$E2FA" "password123"
PENDING_OLD=$(jq -r '.pendingToken // empty' /tmp/login.json)
echo "Esperando 5 min 10 s para que el pendingToken expire..."
sleep 310
T2FA_CODE=$(node "$ROOT/test_blackbox/totp.js" "$OTP_URI")
api POST /api/auth/login/verify-2fa "{\"code\":\"$T2FA_CODE\"}" "$PENDING_OLD"
save_body TC-08
record TC-08 REQ-OP-02 "Verify-2fa con pendingToken vencido" 401 "$CODE"

# TC-46: código de respaldo reutilizado
login "$E2FA" "password123"
PENDING=$(jq -r '.pendingToken' /tmp/login.json)
api POST /api/auth/login/verify-2fa "{\"code\":\"$BACKUP1\"}" "$PENDING"
save_body TC-46
record TC-46 REQ-BIZ-01 "Verify-2fa con código de respaldo (1.º uso)" 200 "$CODE"
login "$E2FA" "password123"
PENDING=$(jq -r '.pendingToken' /tmp/login.json)
api POST /api/auth/login/verify-2fa "{\"code\":\"$BACKUP1\"}" "$PENDING"
record TC-46 REQ-BIZ-01 "Código de respaldo reutilizado" 401 "$CODE"
DB6=$(PSQL "SELECT count(*) FROM \"TotpBackupCode\" WHERE \"userId\"='$UID2FA' AND \"usedAt\" IS NOT NULL")
record TC-46 REQ-BIZ-01 "BD marca respaldo como usado" 1 "$DB6"

# TC-47: desactivar 2FA con contraseña incorrecta
api DELETE /api/auth/totp "{\"password\":\"contraseña-mala\"}" "$TOKEN2FA"
save_body TC-47
record TC-47 REQ-BIZ-01 "DELETE /totp con contraseña incorrecta" 400 "$CODE"

# TC-48: desactivar 2FA con contraseña correcta
api DELETE /api/auth/totp "{\"password\":\"password123\"}" "$TOKEN2FA"
save_body TC-48
record TC-48 REQ-BIZ-01 "DELETE /totp con contraseña correcta" 200 "$CODE"
login "$E2FA" "password123"
REQUIRES2=$(jq -r '.requires2fa // "false"' /tmp/login.json)
record TC-48 REQ-BIZ-01 "Login posterior sin 2FA" "false" "$REQUIRES2"
DB7=$(PSQL "SELECT \"totpEnabled\" FROM \"User\" WHERE email='$E2FA'")
record TC-48 REQ-BIZ-01 "BD: totpEnabled" f "$DB7"

# =============================================================================
echo; echo "=== FASE C: rate limit (REQ-ERR-01) — SIEMPRE AL FINAL ==="

restart_backend || exit 1
echo "Reiniciado (contadores en memoria limpios)."

# TC-42: 16.º login fallido en 15 min
for i in $(seq 1 15); do login "no-existe-$i@labandera.test" "pass-fallida"; done
login "no-existe-16@labandera.test" "pass-fallida"
save_body TC-42
record TC-42 REQ-ERR-01 "16.º login fallido en 15 min" 429 "$LCODE"
record TC-42 REQ-ERR-01 "Mensaje de límite" "Demasiadas intentas. Intenta de nuevo más tarde." "$(jq -r '.message // empty' /tmp/login.json)"

restart_backend || exit 1

# TC-43: 6.º verify-2fa fallido en 15 min
login "$E2FA" "password123"   # 2FA ya desactivado; usar otro usuario con 2FA?
# Re-activar 2FA del usuario E2FA para poder fallar verify-2fa
api POST /api/auth/totp/setup "" "$TOKEN2FA"
OTP_URI=$(jq -r '.otpauthUri' /tmp/body.json)
for i in $(seq 1 5); do
  login "$E2FA" "password123"
  PENDING=$(jq -r '.pendingToken' /tmp/login.json)
  api POST /api/auth/login/verify-2fa "{\"code\":\"000000\"}" "$PENDING"
done
login "$E2FA" "password123"
PENDING=$(jq -r '.pendingToken' /tmp/login.json)
api POST /api/auth/login/verify-2fa "{\"code\":\"000000\"}" "$PENDING"
save_body TC-43
record TC-43 REQ-ERR-01 "6.º verify-2fa fallido en 15 min" 429 "$CODE"

# =============================================================================
echo
echo "=== RESUMEN ==="
echo "Aceptados: $PASS | Rechazados: $FAIL"
echo "CSV de resultados: $RES"
echo "Evidencias JSON: $EV/"
echo "Falta: TC-33..TC-38 (guards frontend, capturas) — ver run_frontend_guards.mjs"
