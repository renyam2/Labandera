import { Request, Response, NextFunction } from 'express'

/** Tamaño máximo por archivo (5 MB). */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024

/** MIME types permitidos para las imágenes de los artículos. */
export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

/** Extensión segura derivada del MIME real (no de `originalname`, que puede falsificarse). */
const MIME_BY_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
}

/**
 * Detecta el MIME real del archivo a partir de sus bytes mágicos.
 * Es más confiable que el `Content-Type` del cliente, que puede falsificarse.
 */
export function detectMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png'
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x47, 0x49, 0x46, 0x38]))) {
    return 'image/gif'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(Buffer.from('RIFF')) &&
    buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
  ) {
    return 'image/webp'
  }
  return null
}

/**
 * Devuelve la extensión de archivo correspondiente a un MIME permitido.
 */
export function mimeToExtension(mime: string): string {
  return MIME_BY_EXTENSION[mime] ?? ''
}

/**
 * Validación de uploads: exige archivo, tamaño máximo y MIME permitido
 * (verificado con bytes mágicos, no solo con el header del cliente).
 *
 * Debe usarse DESPUÉS de `multer.single(...)`.
 * Respuestas: 400 (sin archivo), 413 (excede el tamaño), 415 (MIME no permitido).
 */
export const validateImageUpload = (req: Request, res: Response, next: NextFunction): void => {
  const file = req.file
  if (!file) {
    res.status(400).json({ message: 'No se proporcionó archivo' })
    return
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    res
      .status(413)
      .json({ message: `El archivo excede el tamaño máximo de ${MAX_UPLOAD_SIZE / (1024 * 1024)} MB` })
    return
  }

  const detected = detectMime(file.buffer)
  if (!detected || !ALLOWED_IMAGE_MIMES.has(detected)) {
    res.status(415).json({ message: 'Tipo de archivo no permitido (solo JPEG, PNG, GIF o WebP)' })
    return
  }

  // Normaliza el MIME con el valor real detectado para el resto del flujo.
  file.mimetype = detected
  next()
}
