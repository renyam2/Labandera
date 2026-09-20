import request from 'supertest'
import { describe, it, expect, afterAll } from 'vitest'
import app from '../src/index'
import { prisma } from '../src/prisma'

const email = `test-auth-${Date.now()}@labandera.test`
const password = 'secret123'

afterAll(async () => {
  // Limpieza: el registro crea también el vínculo UserRole.
  await prisma.userRole.deleteMany({ where: { user: { email } } })
  await prisma.user.deleteMany({ where: { email } })
})

describe('Auth', () => {
  it('POST /api/auth/register crea usuario y devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password })

    expect(res.status).toBe(201)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.user.email).toBe(email)
    expect(res.body.user.roles).toContain('Usuario')
  })

  it('POST /api/auth/register con email duplicado responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password })

    expect(res.status).toBe(400)
  })

  it('POST /api/auth/login con credenciales válidas devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password })

    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
  })

  it('POST /api/auth/login con contraseña incorrecta responde 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'contraseña-falsa' })

    expect(res.status).toBe(401)
  })

  it('POST /api/auth/login con body inválido responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-un-email' })

    expect(res.status).toBe(400)
  })

  it('Ruta protegida sin token responde 401', async () => {
    const res = await request(app).post('/api/articles').send({})
    expect(res.status).toBe(401)
  })

  it('Ruta protegida con token inválido responde 401', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', 'Bearer token-falso')
      .send({})
    expect(res.status).toBe(401)
  })
})
