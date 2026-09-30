import { authenticator } from 'otplib'
import bcrypt from 'bcryptjs'

const TOTP_ISSUER = 'Labandera'
const TOTP_DIGITS = 6
const TOTP_PERIOD = 30
const TOTP_WINDOW = 1 // tolera ±1 intervalo (30 s) para desfases de reloj
const BACKUP_CODES_COUNT = 10
const BACKUP_CODE_LENGTH = 8

/**
 * Genera un secreto TOTP en Base32 (RFC 4648).
 */
export function generateTotpSecret(): string {
  return authenticator.key()
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
  return authenticator.verify({
    token: code,
    secret,
    encoding: 'decimal',
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    window: TOTP_WINDOW,
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
