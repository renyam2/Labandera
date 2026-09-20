import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma'
import { validateEnv } from '../schemas/env'
import { ROLES } from '../constants/roles'

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(400).json({ message: 'Email ya registrado' })

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashed }
  })

  // Asignar rol por defecto "Usuario"
  const defaultRole = await prisma.role.findUnique({ where: { name: ROLES.USER } })
  if (defaultRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: defaultRole.id,
      }
    })
  }

  // Obtener roles del usuario recién creado
  const userWithRoles = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: { role: true }
      }
    }
  })

  const rolesArray = userWithRoles?.roles.map(ur => ur.role.name) || []

  const token = jwt.sign(
    { id: user.id, roles: rolesArray },
    validateEnv().JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, roles: rolesArray }
  })
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: { role: true }
      }
    }
  })
  // Mensaje genérico: no revelar si el error es email o password (evita enumeración de usuarios)
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' })

  const rolesArray = user.roles.map(ur => ur.role.name)

  const token = jwt.sign(
    { id: user.id, roles: rolesArray },
    validateEnv().JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, roles: rolesArray }
  })
}

