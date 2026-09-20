import { Request, Response, RequestHandler } from 'express'
import { prisma } from '../prisma'

// Los errores (incluidos los de Prisma) se resuelven en el manejador global
// de errores (src/middlewares/errorHandler.ts).

export const getCategories: RequestHandler = async (req, res) => {
  const categories = await prisma.category.findMany()
  res.json(categories)
}

export const createCategory: RequestHandler = async (req, res) => {
  const { name } = req.body
  const category = await prisma.category.create({ data: { name } })
  res.status(201).json(category)
}

export const updateCategory: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  const { name } = req.body
  const category = await prisma.category.update({ where: { id }, data: { name } })
  res.json(category)
}

export const deleteCategory: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  await prisma.category.delete({ where: { id } })
  res.json({ message: 'Categoría eliminada' })
}
