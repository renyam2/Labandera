import request from 'supertest'
import { authenticator } from 'otplib'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/index'
import { prisma } from '../src/prisma'

const email = `test-2fa-${Date.now()}@labandera.test`
const password = 'secret123'
let token = ''
let pendingToken = ''
let totpSecret = ''
let backupCodes: string[] = []

const currentTotp = () =>
  authenticator.generate({
    secret: totpSecret,
    encoding: 'decimal',
    digits: 6,
    period: 30,
  })

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test 2FA', email, password })
  token = res.body.token
})

afterAll(async () => {
  await prisma.authAttempt.deleteMany({ where: { user: { email } } })
  await prisma.totpBackupCode.deleteMany({ where: { user: { email } } })
  await prisma.userRole.deleteMany({ where: { user: { email } } })
  await prisma.user.deleteMany({ where: { email } })
})

describe('2FA (TOTP)', () => {
  it('setup sin token responde 401', async () => {
    const res = await request(app).post('/api/auth/totp/setup')
    expect(res.status).toBe(401)
  })

  it('setup: genera secreto y URI otpauth', async () => {
    const res = await request(app)
      .post('/api/auth/totp/setup')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.secret).toMatch(/^[A-Z2-7]{16,}$/)
    expect(res.body.otpauthUri.startsWith('otpauth://totp/')).toBe(true)
    totpSecret = res.body.secret
  })

  it('verify-setup: código inválido responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/totp/verify-setup')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' })
    expect(res.status).toBe(400)
  })

  it('verify-setup: código válido activa 2FA y entrega 10 respaldos', async () => {
    const res = await request(app)
      .post('/api/auth/totp/verify-setup')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: currentTotp() })
    expect(res.status).toBe(201)
    expect(res.body.backupCodes).toHaveLength(10)
    backupCodes = res.body.backupCodes
  })

  it('login con 2FA activo devuelve token pendiente (no token completo)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
    expect(res.status).toBe(200)
    expect(res.body.requires2fa).toBe(true)
    expect(res.body.pendingToken).toBeType('string')
    expect(res.body.token).toBeUndefined()
    pendingToken = res.body.pendingToken
  })

  it('verify-2fa: código TOTP válido emite token completo', async () => {
    const res = await request(app)
      .post('/api/auth/login/verify-2fa')
      .set('Authorization', `Bearer ${pendingToken}`)
      .send({ code: currentTotp() })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeType('string')
    expect(res.body.user.email).toBe(email)
  })

  it('verify-2fa: código TOTP inválido responde 401', async () => {
    const res = await request(app)
      .post('/api/auth/login/verify-2fa')
      .set('Authorization', `Bearer ${pendingToken}`)
      .send({ code: '123456' })
    expect(res.status).toBe(401)
  })

  it('verify-2fa: código de respaldo válido emite token y se consume', async () => {
    const code = backupCodes[0]
    const res = await request(app)
      .post('/api/auth/login/verify-2fa')
      .set('Authorization', `Bearer ${pendingToken}`)
      .send({ code })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeType('string')

    // El respaldo queda marcado como usado en la BD.
    const used = await prisma.totpBackupCode.findFirst({
      where: { user: { email }, usedAt: { not: null } },
    })
    expect(used).not.toBeNull()
  })

  it('verify-2fa: token no pendiente (JWT normal) responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/login/verify-2fa')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: currentTotp() })
    expect(res.status).toBe(400)
  })

  it('regenerar respaldos anula los anteriores', async () => {
    const res = await request(app)
      .post('/api/auth/totp/backup-codes')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(201)
    expect(res.body.backupCodes).toHaveLength(10)
    expect(res.body.backupCodes).not.toEqual(backupCodes)
    backupCodes = res.body.backupCodes
  })

  it('disable: con contraseña correcta desactiva el 2FA', async () => {
    const res = await request(app)
      .delete('/api/auth/totp')
      .set('Authorization', `Bearer ${token}`)
      .send({ password })
    expect(res.status).toBe(200)

    // En la BD, el 2FA queda desactivado y sin respaldos.
    const user = await prisma.user.findUnique({ where: { email } })
    expect(user?.totpEnabled).toBe(false)
    expect(user?.totpSecret).toBeNull()
    const backups = await prisma.totpBackupCode.findMany({ where: { userId: user!.id } })
    expect(backups).toHaveLength(0)
  })
})
