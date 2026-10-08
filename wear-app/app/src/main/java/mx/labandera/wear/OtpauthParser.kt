package mx.labandera.wear

import android.net.Uri
import java.net.URLDecoder

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
        // El tipo ("totp") va en la host de la URI: otpauth://totp/Label?... ;
        // se acepta también el formato alternativo otpauth://totp/Label.
        if (uri.host?.lowercase() != "totp") return null

        val secret = uri.getQueryParameter("secret")
        if (secret.isNullOrBlank()) return null

        // El label estándar va en la path; se acepta también un query param `label`.
        // Uri.getPath() devuelve la path sin decodificar: se decodifica el
        // percent-encoding (p. ej. %3A → ':', %40 → '@').
        val label = uri.path?.removePrefix("/")
            ?.let { URLDecoder.decode(it, "UTF-8") }
            ?.trim()
            ?.ifEmpty { null }
            ?: uri.getQueryParameter("label")
            ?: ""
        val issuer = uri.getQueryParameter("issuer")
            ?: label.substringBefore(':').ifEmpty { "Labandera" }
        val account = label.substringAfter(':', missingDelimiterValue = label)
            .ifEmpty { "usuario" }

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
