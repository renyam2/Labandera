import { z } from 'zod'

/**
 * Validación de variables de entorno al arranque.
 * Si alguna variable es inválida, el proceso termina con código 1
 * mostrando los campos problemáticos (fail-fast).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  // Prisma acepta los esquemas postgresql:// y postgres://; se exige host y base de datos
  // para que falles aquí (no con un error de conexión opaco de Prisma más tarde).
  DATABASE_URL: z.string().regex(
    /^(postgresql|postgres):\/\/\S+\/\S+/,
    'DATABASE_URL debe ser postgresql://[usuario:pass@]host[:puerto]/basededatos',
  ),
  JWT_SECRET: z.string().min(32, { message: 'JWT_SECRET debe tener al menos 32 caracteres' }),
})

export type Env = z.infer<typeof envSchema>

let validated: Env | null = null

/**
 * Valida process.env una sola vez (caches el resultado).
 * Llama a process.exit(1) si algo es inválido.
 */
export function validateEnv(): Env {
  if (validated) return validated
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Variables de entorno inválidas:')
    for (const issue of result.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`)
    }
    process.exit(1)
  }
  validated = result.data
  return validated
}
