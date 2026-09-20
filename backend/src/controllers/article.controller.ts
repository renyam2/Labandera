import { Request, Response, RequestHandler } from 'express'
import { prisma } from '../prisma'
import { AuthRequest } from '../middlewares/auth'

// Los errores (incluidos los de Prisma) se resuelven en el manejador global
// de errores (src/middlewares/errorHandler.ts). Express 5 reenvía
// automáticamente los rechazos de handlers async a ese middleware.

export const getArticles: RequestHandler = async (req, res) => {
  const articles = await prisma.article.findMany({
    include: { author: { select: { id: true, name: true } }, category: true, images: true },
    orderBy: { createdAt: 'desc' }
  })
  res.json(articles)
}

export const getArticleById: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } }, category: true, images: true }
  })
  if (!article) return res.status(404).json({ message: 'Artículo no encontrado' })
  res.json(article)
}

export const createArticle: RequestHandler = async (req, res) => {
  const { title, slug, summary, content, image, published, categoryId, state } = req.body
  const authorId = (req as AuthRequest).user?.id

  if (!authorId) {
    res.status(401).json({ message: 'No se pudo identificar al periodista autenticado' })
    return
  }

  const article = await prisma.article.create({
    data: { title, slug, summary, content, image, published, categoryId, authorId, state }
  })
  res.status(201).json(article)
}

export const updateArticle: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  const { title, slug, summary, content, image, published, categoryId, state } = req.body
  // P2025 (id inexistente) → 404 y P2003 (categoryId inexistente) → 409
  // los resuelve el manejador global de errores.
  const article = await prisma.article.update({
    where: { id },
    data: { title, slug, summary, content, image, published, categoryId, state }
  })
  res.json(article)
}

export const deleteArticle: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  await prisma.article.delete({ where: { id } })
  res.json({ message: 'Artículo eliminado' })
}
