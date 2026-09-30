import { z } from 'zod'

// Código TOTP de 6 dígitos (RFC 6238).
export const totpCodeSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, 'El código debe tener exactamente 6 dígitos'),
})

// Desactivar 2FA requiere confirmar la contraseña.
export const disableTotpSchema = z.object({
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type TotpCodeInput = z.infer<typeof totpCodeSchema>
export type DisableTotpInput = z.infer<typeof disableTotpSchema>
