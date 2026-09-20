import { z } from 'zod'

/** Id de categoría (rutas /api/categories/:id). */
export const categoryIdParamSchema = z.object({
  id: z.uuid('Id de categoría inválido (debe ser un UUID)'),
})

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
})

export const updateCategorySchema = createCategorySchema
