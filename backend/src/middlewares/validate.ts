import { Request, Response, NextFunction } from 'express'
import { ZodType } from 'zod'

/**
 * Middleware genérico de validación con Zod.
 * - `source: 'body'`  → valida req.body y lo reemplaza por el dato parseado
 *                        (aplica coerciones/transforms del schema).
 * - `source: 'params'` → valida req.params (solo verificación; no se reasigna).
 *
 * Ante un ZodError responde 400 con la lista de errores por campo.
 */
export function validate(schema: ZodType, source: 'body' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }))
      res.status(400).json({ message: 'Datos de petición inválidos', errors })
      return
    }
    if (source === 'body') {
      req.body = result.data
    }
    next()
  }
}
