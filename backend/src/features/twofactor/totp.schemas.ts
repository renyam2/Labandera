import { z } from 'zod'

// Código TOTP de 6 dígitos (RFC 6238).
export const totpCodeSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, 'El código debe tener exactamente 6 dígitos'),
})

// Segundo paso del login: acepta un código TOTP de 6 dígitos
// o un código de respaldo de 8 dígitos.
export const verifyTwoFactorSchema = z.object({
  code: z
    .string()
    .regex(/^(\d{6}|\d{8})$/, 'El código debe tener 6 dígitos (TOTP) o 8 dígitos (respaldo)'),
})

// Desactivar 2FA requiere confirmar la contraseña.
export const disableTotpSchema = z.object({
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type TotpCodeInput = z.infer<typeof totpCodeSchema>
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>
export type DisableTotpInput = z.infer<typeof disableTotpSchema>
