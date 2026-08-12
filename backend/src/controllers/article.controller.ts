import { Request, Response, RequestHandler } from 'express'
import { prisma } from '../prisma'
import { AuthRequest } from '../middlewares/auth'

export const getArticles: RequestHandler = async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      include: { author: { select: { id: true, name: true } }, category: true, images: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(articles)
  } catch (error) {
    console.error('Error al obtener artículos:', error)
    res.status(500).json({ message: 'Error al obtener artículos' })
  }
}

export const getArticleById: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } }, category: true, images: true }
    })
    if (!article) return res.status(404).json({ message: 'Artículo no encontrado' })
    res.json(article)
  } catch (error) {
    console.error('Error al obtener artículo:', error)
    res.status(500).json({ message: 'Error al obtener artículo' })
  }
}

export const createArticle: RequestHandler = async (req, res) => {
  const { title, slug, summary, content, image, published, categoryId, state } = req.body
  const authorId = (req as AuthRequest).user?.id

  if (!authorId) {
    res.status(401).json({ message: 'No se pudo identificar al periodista autenticado' })
    return
  }

  try {
    const article = await prisma.article.create({
      data: { title, slug, summary, content, image, published, categoryId, authorId, state }
    })
    res.status(201).json(article)
  } catch (error) {
    console.error('Error al crear artículo:', error)
    res.status(500).json({ message: 'Error al crear artículo' })
  }
}


export const updateArticle: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  const { title, slug, summary, content, image, published, categoryId, state } = req.body
  try {
    const article = await prisma.article.update({
      where: { id },
      data: { title, slug, summary, content, image, published, categoryId, state }
    })
    res.json(article)
  } catch (error) {
    console.error('Error al actualizar artículo:', error)
    res.status(500).json({ message: 'Error al actualizar artículo' })
  }
}

export const deleteArticle: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  try {
    await prisma.article.delete({ where: { id } })
    res.json({ message: 'Artículo eliminado' })
  } catch (error) {
    console.error('Error al eliminar artículo:', error)
    res.status(500).json({ message: 'Error al eliminar artículo' })
  }
}
