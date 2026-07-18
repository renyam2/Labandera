import { Request, Response, NextFunction, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

interface AuthRequest extends Request {
  user?: { id: string; role: string }
}

export const requireRole = (roles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ message: 'Token requerido' })
      return
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string }
      req.user = decoded
      if (!roles.includes(decoded.role)) {
        res.status(403).json({ message: 'No tienes permiso' })
        return
      }
      next()
    } catch {
      res.status(401).json({ message: 'Token inválido' })
    }
  }
}
