import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma'
import { validateEnv } from '../schemas/env'
import { ROLES } from '../constants/roles'
import { verifyTotpCode, verifyBackupCode } from '../features/twofactor/totp.service'
import { AuthRequest } from '../middlewares/auth'

// Duración del token pendiente (solo para completar la verificación 2FA).
const PENDING_TTL = '5m'

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

  // Si el usuario tiene 2FA activo, NO emitir el token completo:
  // devolver un token pendiente de corta duración (claim mfa: "pending")
  // que solo sirve para completar la verificación en /login/verify-2fa.
  if (user.totpEnabled) {
    const pendingToken = jwt.sign(
      { id: user.id, roles: rolesArray, mfa: 'pending' },
      validateEnv().JWT_SECRET,
      { expiresIn: PENDING_TTL }
    )
    res.json({ requires2fa: true, pendingToken })
    return
  }

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

/**
 * POST /api/auth/login/verify-2fa
 * Segundo paso del login: recibe el token pendiente (mfa: "pending")
 * y un código TOTP de 6 dígitos o un código de respaldo. Si es válido,
 * emite el JWT completo (7 días).
 */
export const verifyTwoFactor = async (req: AuthRequest, res: Response) => {
  const { code } = req.body
  const session = req.user
  if (!session) {
    return res.status(401).json({ message: 'Token requerido' })
  }

  // Solo se acepta un token pendiente de 2FA.
  if (session.mfa !== 'pending') {
    return res.status(400).json({ message: 'Token pendiente inválido o ya completado' })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { roles: { include: { role: true } } },
  })
  if (!user || !user.totpEnabled) {
    return res.status(401).json({ message: 'Credenciales inválidas' })
  }

  let success = false
  let type: 'totp' | 'backup' = 'totp'

  // 1) Intentar con TOTP.
  if (user.totpSecret && verifyTotpCode(user.totpSecret, code)) {
    success = true
  } else {
    // 2) Intentar con un código de respaldo de uso único.
    type = 'backup'
    const backupCodes = await prisma.totpBackupCode.findMany({
      where: { userId: user.id, usedAt: null },
    })
    for (const bc of backupCodes) {
      if (await verifyBackupCode(code, bc.codeHash)) {
        await prisma.totpBackupCode.update({
          where: { id: bc.id },
          data: { usedAt: new Date() },
        })
        success = true
        break
      }
    }
  }

  // Auditoría de intentos (éxito o fallo).
  await prisma.authAttempt.create({
    data: { type, success, userId: user.id },
  })

  if (!success) {
    return res.status(401).json({ message: 'Código incorrecto' })
  }

  const rolesArray = user.roles.map(ur => ur.role.name)
  const token = jwt.sign(
    { id: user.id, roles: rolesArray },
    validateEnv().JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, roles: rolesArray },
  })
}

