import { Request, Response, NextFunction, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

interface AuthRequest extends Request {
  user?: { id: string; roles: string[] }
}

// Solo valida que exista un token válido, sin exigir rol específico
export const verificarToken: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    res.status(401).json({ message: 'Token requerido' })
    return
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; roles: string[] }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido' })
  }
}

// Valida token Y que el usuario tenga al menos uno de los roles permitidos
export const requireRole = (roles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ message: 'Token requerido' })
      return
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; roles: string[] }
      req.user = decoded
      if (!decoded.roles.some(r => roles.includes(r))) {
        res.status(403).json({ message: 'No tienes permiso' })
        return
      }
      next()
    } catch {
      res.status(401).json({ message: 'Token inválido' })
    }
  }
}
