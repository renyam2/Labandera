import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma'

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body
  try {
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ message: 'Email ya registrado' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed }
    })

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })

} catch (err) {
    console.error('Error login:', err)
    res.status(500).json({ message: 'Error al iniciar sesión' })
  }

}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Contraseña incorrecta' })

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ message: 'Error al iniciar sesión' })
  }
}
