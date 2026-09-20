import rateLimit from 'express-rate-limit'

// Limit de intentas de autenticación por IP (login/register).
// Previene fuerza bruta y enumeración de usuarios.
// Nota: el store es en memoria. Con múltiples instancias detrás de
// un balanceador de carga, usar un store compartido (p. ej. Redis).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas intentas. Intenta de nuevo más tarde.' },
})

// Limit general para el resto de la API (protección básica).
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
})
