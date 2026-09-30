package mx.labandera.wear

import android.net.Uri

/** Configuración extraída de una URI `otpauth://totp/...`. */
data class OtpauthConfig(
    val issuer: String,
    val account: String,
    val secret: String,
    val digits: Int = 6,
    val period: Int = 30,
)

/**
 * Parsea la URI `otpauth://` que el backend genera en
 * `POST /api/auth/totp/setup` (ver `totp.service.ts` → `buildOtpauthUri`).
 *
 * Formato: `otpauth://totp/Issuer:Account?secret=...&issuer=...&digits=6&period=30`
 */
object OtpauthParser {

    fun parse(raw: String): OtpauthConfig? {
        val uri = Uri.parse(raw)
        if (uri.scheme?.lowercase() != "otpauth") return null
        if (uri.path?.removePrefix("/")?.lowercase() != "totp") return null

        val secret = uri.getQueryParameter("secret")
        if (secret.isNullOrBlank()) return null

        val label = uri.getQueryParameter("label") ?: ""
        val issuer = uri.getQueryParameter("issuer")
            ?: label.substringBefore(':').ifEmpty { "Labandera" }
        val account = label.substringAfter(':', missingDelimiterValue = label)
            .ifEmpty { uri.host ?: "usuario" }

        val digits = uri.getQueryParameter("digits")?.toIntOrNull()?.coerceIn(6, 8) ?: 6
        val period = uri.getQueryParameter("period")?.toIntOrNull()?.coerceIn(15, 120) ?: 30

        return OtpauthConfig(
            issuer = issuer,
            account = account,
            secret = secret,
            digits = digits,
            period = period,
        )
    }
}
