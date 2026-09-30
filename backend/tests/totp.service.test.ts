import { describe, it, expect } from 'vitest'
import {
  generateTotpSecret,
  buildOtpauthUri,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from '../src/features/twofactor/totp.service'

describe('totp.service', () => {
  it('genera un secreto TOTP en Base32', () => {
    const secret = generateTotpSecret()
    expect(secret).toMatch(/^[A-Z2-7]{16,}$/)
  })

  it('construye una URI otpauth:// válida', () => {
    const secret = generateTotpSecret()
    const uri = buildOtpauthUri(secret, 'usuario@labandera.mx')
    expect(uri.startsWith('otpauth://totp/')).toBe(true)
    expect(uri).toContain('Labandera')
    expect(uri).toContain(`secret=${secret}`)
  })

  it('verifica un código TOTP válido y rechaza uno inválido', async () => {
    const secret = generateTotpSecret()
    // Genera el código "correcto" para el intervalo actual usando la misma librería.
    const { authenticator } = await import('otplib')
    const validCode = authenticator.generate({
      secret,
      encoding: 'decimal',
      digits: 6,
      period: 30,
    })
    expect(verifyTotpCode(secret, validCode)).toBe(true)
    expect(verifyTotpCode(secret, '000000')).toBe(false)
    expect(verifyTotpCode(secret, '12345')).toBe(false) // longitud inválida
  })

  it('genera 10 códigos de respaldo únicos y verifica sus hashes', async () => {
    const { codes, codeHashes } = await generateBackupCodes()
    expect(codes).toHaveLength(10)
    expect(codeHashes).toHaveLength(10)
    expect(new Set(codes).size).toBe(10)
    for (const code of codes) {
      expect(code).toMatch(/^\d{8}$/)
    }
    // Cada hash verifica contra SU código y no contra otro.
    for (let i = 0; i < codes.length; i++) {
      expect(await verifyBackupCode(codes[i], codeHashes[i])).toBe(true)
      expect(await verifyBackupCode(codes[(i + 1) % codes.length], codeHashes[i])).toBe(false)
    }
  })

  it('hashBackupCode nunca devuelve el código en claro', async () => {
    const hash = await hashBackupCode('12345678')
    expect(hash).not.toBe('12345678')
    expect(hash.startsWith('$2')).toBe(true) // formato bcrypt
  })
})
