import { Request, Response, RequestHandler } from 'express'
import { prisma } from '../prisma'

export const getCategories: RequestHandler = async (req, res) => {
  try {
    const categories = await prisma.category.findMany()
    res.json(categories)
  } catch {
    res.status(500).json({ message: 'Error al obtener categorías' })
  }
}

export const createCategory: RequestHandler = async (req, res) => {
  const { name } = req.body
  try {
    const category = await prisma.category.create({ data: { name } })
    res.status(201).json(category)
  } catch {
    res.status(500).json({ message: 'Error al crear categoría' })
  }
}

export const updateCategory: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  const { name } = req.body
  try {
    const category = await prisma.category.update({ where: { id }, data: { name } })
    res.json(category)
  } catch {
    res.status(500).json({ message: 'Error al actualizar categoría' })
  }
}

export const deleteCategory: RequestHandler = async (req, res) => {
  const id = req.params.id as string
  try {
    await prisma.category.delete({ where: { id } })
    res.json({ message: 'Categoría eliminada' })
  } catch {
    res.status(500).json({ message: 'Error al eliminar categoría' })
  }
}
