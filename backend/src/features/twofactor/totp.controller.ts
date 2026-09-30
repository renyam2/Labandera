import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { AuthRequest } from '../../middlewares/auth'
import { prisma } from '../../prisma'
import {
  generateTotpSecret,
  buildOtpauthUri,
  verifyTotpCode,
  generateBackupCodes,
} from './totp.service'

/**
 * POST /api/auth/totp/setup
 * Genera el secreto TOTP y la URI otpauth:// (para escanear con la
 * app autenticadora del smart watch). Aún NO activa el 2FA: se activa
 * en /verify-setup cuando el usuario confirma un código.
 */
export const setupTotp = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.id
  if (!uid) return res.status(401).json({ message: 'Token requerido' })
  const user = await prisma.user.findUnique({ where: { id: uid } })
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
  if (user.totpEnabled) {
    return res.status(400).json({ message: 'El 2FA ya está activo' })
  }

  const secret = generateTotpSecret()
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret },
  })

  res.json({
    secret,
    otpauthUri: buildOtpauthUri(secret, user.email),
  })
}

/**
 * POST /api/auth/totp/verify-setup
 * El usuario ingresa un código TOTP de 6 dígitos generado por su app
 * autenticadora. Si es válido, activa el 2FA y genera 10 códigos de
 * respaldo (se muestran UNA sola vez).
 */
export const verifyTotpSetup = async (req: AuthRequest, res: Response) => {
  const { code } = req.body
  const uid = req.user?.id
  if (!uid) return res.status(401).json({ message: 'Token requerido' })

  const user = await prisma.user.findUnique({ where: { id: uid } })
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
  if (!user.totpSecret) {
    return res.status(400).json({ message: 'Primero genera el secreto en /setup' })
  }

  if (!verifyTotpCode(user.totpSecret, code)) {
    return res.status(400).json({ message: 'Código incorrecto' })
  }

  const { codes, codeHashes } = await generateBackupCodes()

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true, totpEnabledAt: new Date() },
    }),
    prisma.totpBackupCode.createMany({
      data: codeHashes.map((codeHash) => ({ userId: user.id, codeHash })),
    }),
  ])

  // Los códigos en claro se devuelven UNA sola vez; después solo existen sus hashes.
  res.status(201).json({
    message: '2FA activado. Guarda tus códigos de respaldo: no se volverán a mostrar.',
    backupCodes: codes,
  })
}

/**
 * DELETE /api/auth/totp
 * Desactiva el 2FA (requiere confirmar la contraseña).
 * Borra el secreto y los códigos de respaldo.
 */
export const disableTotp = async (req: AuthRequest, res: Response) => {
  const { password } = req.body
  const uid = req.user?.id
  if (!uid) return res.status(401).json({ message: 'Token requerido' })

  const user = await prisma.user.findUnique({ where: { id: uid } })
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(400).json({ message: 'Contraseña incorrecta' })

  await prisma.$transaction([
    prisma.totpBackupCode.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: null, totpEnabled: false, totpEnabledAt: null },
    }),
  ])

  res.json({ message: '2FA desactivado' })
}

/**
 * POST /api/auth/totp/backup-codes
 * Regenera los 10 códigos de respaldo (anula los anteriores).
 * Útil si el usuario los perdió. Se muestran UNA sola vez.
 */
export const regenerateBackupCodes = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.id
  if (!uid) return res.status(401).json({ message: 'Token requerido' })
  const user = await prisma.user.findUnique({ where: { id: uid } })
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
  if (!user.totpEnabled) {
    return res.status(400).json({ message: 'El 2FA no está activo' })
  }

  const { codes, codeHashes } = await generateBackupCodes()
  await prisma.$transaction([
    prisma.totpBackupCode.deleteMany({ where: { userId: user.id } }),
    prisma.totpBackupCode.createMany({
      data: codeHashes.map((codeHash) => ({ userId: user.id, codeHash })),
    }),
  ])

  res.status(201).json({
    message: 'Códigos de respaldo regenerados. Guárdalos: no se volverán a mostrar.',
    backupCodes: codes,
  })
}
