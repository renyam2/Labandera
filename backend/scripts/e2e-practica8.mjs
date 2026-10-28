// PRACTICA 8 - Fase 4: E2E manual del flujo crítico (registro → login → 2FA → acceso privado).
// Se ejecuta contra el servidor real (pnpm dev) y la BD real con datos ficticios.
// LIMITACIÓN: no automatiza la UI del frontend (requiere Playwright); ver docs/practica8-pyramid.md.
import { authenticator } from 'otplib'

const BASE = process.env.E2E_BASE || 'http://localhost:3000'
const email = `e2e-p8-${Date.now()}@labandera.test`
const password = 'Prueba#123'

const j = (r) => r.json()

console.log('1) Registro de usuario ficticio')
let r = await fetch(`${BASE}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'E2E P8', email, password }),
})
console.log('   ->', r.status, r.status === 201 ? 'OK' : 'FALLO')
const token = (await j(r)).token

console.log('2) Setup 2FA (generar secreto + URI otpauth)')
r = await fetch(`${BASE}/api/auth/totp/setup`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
})
console.log('   ->', r.status, r.status === 200 ? 'OK' : 'FALLO')
const { secret, otpauthUri } = await j(r)
console.log('   URI:', otpauthUri)

console.log('3) Activar 2FA con código TOTP válido (simula la app del smartwatch)')
const code = authenticator.generate(secret, { encoding: 'decimal', digits: 6, period: 30 })
r = await fetch(`${BASE}/api/auth/totp/verify-setup`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
})
const setup = await j(r)
console.log('   ->', r.status, r.status === 201 ? 'OK' : 'FALLO', `| respaldos: ${setup.backupCodes?.length}`)

console.log('4) Login: debe pedir 2FA (token pendiente)')
r = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const login = await j(r)
console.log('   ->', r.status, `requires2fa=${login.requires2fa}`)

console.log('5) Verificación 2FA con código TOTP nuevo')
r = await fetch(`${BASE}/api/auth/login/verify-2fa`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${login.pendingToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: authenticator.generate(secret, { encoding: 'decimal', digits: 6, period: 30 }) }),
})
const verify = await j(r)
console.log('   ->', r.status, r.status === 200 ? 'OK: token completo emitido' : 'FALLO')

console.log('6) Acceso a área privada con el token completo')
r = await fetch(`${BASE}/api/articles`, { headers: { Authorization: `Bearer ${verify.token}` } })
console.log('   ->', r.status, r.status === 200 ? 'OK: área privada accesible' : 'FALLO')

console.log('7) Verificación 2FA con código INVÁLIDO (debe rechazar)')
r = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const l2 = await j(r)
r = await fetch(`${BASE}/api/auth/login/verify-2fa`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${l2.pendingToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: '000000' }),
})
// 401 = código rechazado; 429 = rechazado por rate-limit anti fuerza bruta.
console.log('   ->', r.status, r.status === 401 || r.status === 429 ? 'OK: rechazado (429 = rate-limit activo)' : 'FALLO')

console.log('E2E completado: flujo crítico verificado de punta a punta.')
