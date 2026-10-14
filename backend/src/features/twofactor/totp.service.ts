import { Authenticator } from '@otplib/core'
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto'
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two'
import bcrypt from 'bcryptjs'

const TOTP_ISSUER = 'Labandera'
const TOTP_DIGITS = 6
const TOTP_PERIOD = 30
const TOTP_WINDOW = 1 // tolera ±1 intervalo (30 s) para desfases de reloj
const BACKUP_CODES_COUNT = 10
const BACKUP_CODE_LENGTH = 8

// Se usa una instancia fija para generar secretos y URIs (no dependen del tiempo).
const authenticator = new Authenticator({
  createDigest,
  createRandomBytes,
  keyDecoder,
  keyEncoder,
  window: TOTP_WINDOW,
})

/**
 * Crea un Authenticator con `epoch` en el momento actual.
 * @otplib congela `epoch: Date.now()` al construir la instancia; si se reutiliza
 * una sola instancia para verificar, el TOTP se valida contra el momento en que
 * arrancó el servidor y nunca coincide con el código de la app del smartwatch.
 */
function createVerifyAuthenticator(): Authenticator {
  return new Authenticator({
    createDigest,
    createRandomBytes,
    keyDecoder,
    keyEncoder,
    window: TOTP_WINDOW,
    epoch: Date.now(),
  })
}

/**
 * Genera un secreto TOTP en Base32 (RFC 4648).
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

/**
 * Construye la URI otpauth:// para escanear con la app autenticadora
 * (smart watch, teléfono, etc.).
 */
export function buildOtpauthUri(secret: string, accountName: string): string {
  return authenticator.keyuri(accountName, TOTP_ISSUER, secret)
}

/**
 * Verifica un código TOTP de 6 dígitos contra el secreto.
 * Devuelve true si el código es válido dentro de la ventana tolerada.
 */
export function verifyTotpCode(secret: string, code: string): boolean {
  return createVerifyAuthenticator().verify({
    token: code,
    secret,
  })
}

/**
 * Genera `count` códigos de respaldo numéricos (por defecto 10 de 8 dígitos).
 * Devuelve los códigos en claro (se muestran UNA sola vez al usuario)
 * y sus hashes (lo que se persiste en BD).
 */
export async function generateBackupCodes(count = BACKUP_CODES_COUNT): Promise<{
  codes: string[]
  codeHashes: string[]
}> {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    let code = ''
    for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
      code += Math.floor(Math.random() * 10).toString()
    }
    codes.push(code)
  }
  const codeHashes = await Promise.all(codes.map((c) => hashBackupCode(c)))
  return { codes, codeHashes }
}

/**
 * Hash de un código de respaldo (bcrypt). Los códigos NUNCA se guardan en claro.
 */
export function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

/**
 * Verifica un código de respaldo contra su hash.
 */
export function verifyBackupCode(code: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(code, codeHash)
}

export const TOTP_ISSUER_NAME = TOTP_ISSUER
