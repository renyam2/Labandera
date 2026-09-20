import request from 'supertest'
import jwt from 'jsonwebtoken'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/index'
import { prisma } from '../src/prisma'
import { validateEnv } from '../src/schemas/env'
import { ROLES } from '../src/constants/roles'

// Crea un usuario con el rol indicado y devuelve su JWT.
async function tokenForRole(roleName: string): Promise<string> {
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName },
  })
  const email = `test-rbac-${roleName}-${Date.now()}@labandera.test`
  const user = await prisma.user.create({
    data: {
      name: `RBAC ${roleName}`,
      email,
      password: 'hashed-not-used',
      roles: { create: { roleId: role.id } },
    },
  })
  return jwt.sign({ id: user.id, roles: [roleName] }, validateEnv().JWT_SECRET, { expiresIn: '1h' })
}

let adminToken: string
let editorToken: string
let userToken: string
let categoryId: string
let articleId: string

beforeAll(async () => {
  adminToken = await tokenForRole(ROLES.ADMIN)
  editorToken = await tokenForRole(ROLES.EDITOR)
  userToken = await tokenForRole(ROLES.USER)

  const category = await prisma.category.create({ data: { name: `Categoría de test ${Date.now()}` } })
  categoryId = category.id
})

afterAll(async () => {
  await prisma.article.deleteMany({ where: { categoryId } })
  await prisma.category.deleteMany({ where: { id: categoryId } })
  await prisma.userRole.deleteMany({
    where: { user: { email: { startsWith: 'test-rbac-' } } },
  })
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-rbac-' } } })
})

// Se construye en el momento de la petición: categoryId solo existe
// después de beforeAll (un objeto a nivel de módulo lo fijaría en undefined).
// El slug es único por ejecución: en la base, slug es @unique.
function articleBody() {
  return {
    title: 'Artículo de test',
    slug: `articulo-de-test-${Date.now()}`,
    content: 'Contenido de prueba',
    published: false,
    categoryId,
  }
}

describe('RBAC en /api/articles', () => {
  it('GET /api/articles es público (sin token)', async () => {
    const res = await request(app).get('/api/articles')
    expect(res.status).toBe(200)
  })

  it('POST /api/articles con rol Usuario responde 403', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${userToken}`)
      .send(articleBody())
    expect(res.status).toBe(403)
  })

  it('POST /api/articles con rol Editor crea el artículo (201)', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${editorToken}`)
      .send(articleBody())

    expect(res.status).toBe(201)
    articleId = res.body.id
  })

  it('DELETE /api/articles/:id con rol Editor responde 403', async () => {
    const res = await request(app)
      .delete(`/api/articles/${articleId}`)
      .set('Authorization', `Bearer ${editorToken}`)
    expect(res.status).toBe(403)
  })

  it('DELETE /api/articles/:id con rol Admin elimina el artículo (200)', async () => {
    const res = await request(app)
      .delete(`/api/articles/${articleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})
