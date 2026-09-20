import { z } from 'zod'

/** Id de artículo (rutas /api/articles/:id). */
export const articleIdParamSchema = z.object({
  id: z.uuid('Id de artículo inválido (debe ser un UUID)'),
})

/**
 * Campos base SIN defaults.
 * Los defaults se añaden solo en el schema de creación, para que el
 * schema de actualización pueda detectar un body realmente vacío.
 */
const articleFields = z.object({
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'El slug solo puede contener letras, números y guiones'),
  summary: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, 'El contenido es obligatorio'),
  published: z.boolean(),
  categoryId: z.uuid('categoryId debe ser un UUID válido'),
  state: z.string().trim().min(1).max(50).optional().nullable(),
})

/** Crear artículo: todos los campos requeridos (published con default false). */
export const createArticleSchema = articleFields.extend({
  published: z.boolean().default(false),
})

/** Actualizar artículo: cualquier subconjunto, pero al menos un campo. */
export const updateArticleSchema = articleFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  })
