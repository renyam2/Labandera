import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.email('Email inválido').transform((v) => v.toLowerCase()),
  // bcrypt truncada a 72 bytes; el frontend ya exige mínimo 6 caracteres.
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(72),
})

export const loginSchema = z.object({
  email: z.email('Email inválido').transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
