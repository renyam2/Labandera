import api from './api'
import type { LoginResponse } from './auth'

export interface TotpSetupResponse {
  secret: string
  otpauthUri: string
}

export interface TotpVerifySetupResponse {
  message: string
  backupCodes: string[]
}

export interface TotpStatusResponse {
  totpEnabled: boolean
  totpEnabledAt: string | null
}

/**
 * Genera el secreto TOTP y la URI otpauth:// (para escanear con la
 * app autenticadora del smart watch). Aún no activa el 2FA.
 */
export const setupTotp = () =>
  api.post<TotpSetupResponse>('/auth/totp/setup')

/**
 * Confirma un código TOTP de 6 dígitos. Si es válido, activa el 2FA
 * y devuelve los 10 códigos de respaldo (se muestran una sola vez).
 */
export const verifyTotpSetup = (code: string) =>
  api.post<TotpVerifySetupResponse>('/auth/totp/verify-setup', { code })

/**
 * Estado actual del 2FA del usuario.
 */
export const getTotpStatus = () =>
  api.get<TotpStatusResponse>('/auth/totp/status')

/**
 * Desactiva el 2FA (requiere la contraseña).
 */
export const disableTotp = (password: string) =>
  api.delete<{ message: string }>('/auth/totp', { data: { password } })

/**
 * Regenera los 10 códigos de respaldo (anula los anteriores).
 */
export const regenerateBackupCodes = () =>
  api.post<TotpVerifySetupResponse>('/auth/totp/backup-codes')

/**
 * Segundo paso del login: verifica un código TOTP o un código de
 * respaldo usando el token pendiente (no se guarda en localStorage).
 */
export const verifyTwoFactor = async (
  pendingToken: string,
  code: string
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>(
    '/auth/login/verify-2fa',
    { code },
    { headers: { Authorization: `Bearer ${pendingToken}` } }
  )
  return res.data
}
