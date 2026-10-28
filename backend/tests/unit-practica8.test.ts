// PRACTICA 8 - Fase 2: pruebas UNITARIAS de la lógica de negocio de 2FA.
// Sin servidor, sin base de datos: solo funciones puras de totp.service.
// Doble de prueba: vi.spyOn(Math, 'random') para aislar la dependencia
// aleatoria de generateBackupCodes.
import { describe, it, expect, vi, afterAll } from 'vitest'
import { authenticator } from 'otplib'
import {
  verifyTotpCode,
  generateTotpSecret,
  buildOtpauthUri,
  generateBackupCodes,
} from '../src/features/twofactor/totp.service'

describe('Práctica 8 · Unitarias · verifyTotpCode / generateBackupCodes', () => {
  afterAll(() => vi.restoreAllMocks())

  it('CASO VÁLIDO: un código TOTP correcto se acepta', () => {
    const secret = generateTotpSecret()
    const code = authenticator.generate(secret, {
      encoding: 'decimal',
      digits: 6,
      period: 30,
    })
    expect(verifyTotpCode(secret, code)).toBe(true)
  })

  it('CASO LÍMITE: código de 6 dígitos en el borde (000000) y longitud 5 se rechazan', () => {
    const secret = generateTotpSecret()
    expect(verifyTotpCode(secret, '000000')).toBe(false) // borde inferior, formato válido
    expect(verifyTotpCode(secret, '12345')).toBe(false) // longitud < 6
    expect(verifyTotpCode(secret, '1234567')).toBe(false) // longitud > 6
  })

  it('CASO INVÁLIDO/ERROR: secreto vacío y código con caracteres no numéricos', () => {
    // Secreto inválido: no debe aceptar nada ni lanzar excepción.
    expect(verifyTotpCode('', '123456')).toBe(false)
    // Código con letras: fuera del dominio numérico esperado.
    const secret = generateTotpSecret()
    expect(verifyTotpCode(secret, 'abc123')).toBe(false)
  })

  it('Doble de prueba: generateBackupCodes con Math.random determinístico', async () => {
    // Aisla la dependencia externa (aleatoriedad) con un doble determinístico.
    vi.spyOn(Math, 'random').mockImplementation(() => 0)
    const { codes, codeHashes } = await generateBackupCodes(3)
    expect(codes).toEqual(['00000000', '00000000', '00000000'])
    expect(codeHashes).toHaveLength(3)
  })

  it('URI otpauth construida con datos de prueba (sin datos sensibles)', () => {
    const uri = buildOtpauthUri('JBSWY3DPEHPK3PXP', 'test@labandera.test')
    expect(uri).toBe(
      'otpauth://totp/Labandera:test%40labandera.test?secret=JBSWY3DPEHPK3PXP&period=30&digits=6&algorithm=SHA1&issuer=Labandera',
    )
  })
})
