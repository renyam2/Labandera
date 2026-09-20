import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import multer from 'multer'

/**
 * Mapea los códigos de error de Prisma a estados HTTP.
 * - P2002: violación de restricción única (email/slug duplicado) → 409
 * - P2003: violación de clave foránea (referencia inexistente) → 409
 * - P2025: registro no encontrado en update/delete → 404
 * - P1001/P1002: base de datos no alcanzable → 503
 */
function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): { status: number; message: string } {
  switch (error.code) {
    case 'P2025':
      return { status: 404, message: 'Registro no encontrado' }
    case 'P2002': {
      const field = error.meta?.target ? ` (campo: ${String(error.meta.target)})` : ''
      return { status: 409, message: `Ya existe un registro con ese valor${field}` }
    }
    case 'P2003':
      return { status: 409, message: 'Operación inválida: referencia a un registro inexistente' }
    case 'P1001':
    case 'P1002':
      return { status: 503, message: 'Base de datos no disponible' }
    default:
      return { status: 500, message: `Error de base de datos (${error.code})` }
  }
}

/**
 * Manejador global de errores.
 * Debe registrarse DESPUÉS de todas las rutas en el app.
 * Express 5 reenvía automáticamente los errores de handlers async (rejections)
 * a este middleware.
 */
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  // Errores de Prisma conocidos
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err)
    console.error(`[Prisma] ${mapped.message}`, err.meta)
    res.status(mapped.status).json({ message: mapped.message })
    return
  }

  // Errores de validación de Prisma (campos requeridos faltantes, tipos inválidos)
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error('[Prisma] Validación:', err.message)
    res.status(400).json({ message: 'Datos de petición inválidos' })
    return
  }

  // Errores de Prisma desconocidos (config, conexión, etc.)
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error('[Prisma] Error desconocido:', err)
    res.status(500).json({ message: 'Error interno de base de datos' })
    return
  }

  // JSON malformado en el body (SyntaxError de body-parser)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'JSON inválido en el cuerpo de la petición' })
    return
  }

  // Errores de multer (archivo demasiado grande, archivos inesperados, etc.)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ message: 'El archivo excede el tamaño máximo permitido' })
      return
    }
    res.status(400).json({ message: 'Error al procesar el archivo subido' })
    return
  }

  console.error('[Error] No controlado:', err)
  res.status(500).json({ message: 'Error interno del servidor' })
}

/**
 * 404 para rutas que no existen.
 * Registrar después de las rutas y antes del errorHandler.
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ message: 'Ruta no encontrada' })
}
