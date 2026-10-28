// PRACTICA 8 - Fase 3: pruebas de INTEGRACIÓN (componentes reales).
// Cliente HTTP (supertest) + Express + Prisma + PostgreSQL real de pruebas.
// Sin mocks: el flujo completo toca la base de datos real.
import request from 'supertest'
import { authenticator } from 'otplib'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/index'
import { prisma } from '../src/prisma'

const email = `test-p8-${Date.now()}@labandera.test`
const password = 'Prueba#123'
let token = ''
let pendingToken = ''
let totpSecret = ''

const currentTotp = () =>
  authenticator.generate(totpSecret, {
    encoding: 'decimal',
    digits: 6,
    period: 30,
  })

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test P8', email, password })
  expect(res.status).toBe(201)
  token = res.body.token
  const setup = await request(app)
    .post('/api/auth/totp/setup')
    .set('Authorization', `Bearer ${token}`)
  totpSecret = setup.body.secret
  const verify = await request(app)
    .post('/api/auth/totp/verify-setup')
    .set('Authorization', `Bearer ${token}`)
    .send({ code: currentTotp() })
  expect(verify.status).toBe(201)
})

afterAll(async () => {
  await prisma.totpBackupCode.deleteMany({ where: { user: { email } } })
  await prisma.userRole.deleteMany({ where: { user: { email } } })
  await prisma.user.deleteMany({ where: { email } })
})

describe('Práctica 8 · Integración · login con 2FA (API + BD real)', () => {
  it('FLUJO CORRECTO: login → token pendiente → TOTP → token completo → ruta protegida', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
    expect(login.status).toBe(200)
    expect(login.body.requires2fa).toBe(true)
    pendingToken = login.body.pendingToken

    const verify = await request(app)
      .post('/api/auth/login/verify-2fa')
      .set('Authorization', `Bearer ${pendingToken}`)
      .send({ code: currentTotp() })
    expect(verify.status).toBe(200)
    const fullToken = verify.body.token

    // El token completo (emitido por el servicio de auth) abre la ruta protegida
    // verificada por el middleware contra la BD real.
    const articles = await request(app)
      .get('/api/articles')
      .set('Authorization', `Bearer ${fullToken}`)
    expect(articles.status).toBe(200)
  })

  it('MANEJO DE ERROR: contraseña incorrecta con 2FA activo responde 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'contraseña-falsa' })
    expect(res.status).toBe(401)
    expect(res.body.pendingToken).toBeUndefined()
  })
})
