package mx.labandera.wear

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.math.pow

/**
 * Implementación TOTP (RFC 6238) — misma lógica que `@otplib` en el backend.
 * HmacSHA1 sobre el contador de tiempo (30 s por período), sin dependencias externas.
 */
object Totp {

    private const val BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

    /** Decodifica un secreto Base32 (RFC 4648) a bytes. */
    fun base32Decode(input: String): ByteArray {
        val clean = input.uppercase().replace("=", "").replace("-", "")
        if (clean.isEmpty()) throw IllegalArgumentException("Secreto TOTP vacío")
        var accumulator = 0
        var bits = 0
        val out = ArrayList<Byte>()
        for (c in clean) {
            val value = BASE32_ALPHABET.indexOf(c)
            if (value < 0) {
                throw IllegalArgumentException("Secreto TOTP contiene un carácter no Base32: '$c'")
            }
            accumulator = (accumulator shl 5) or value
            bits += 5
            if (bits >= 8) {
                bits -= 8
                out.add(((accumulator ushr bits) and 0xFF).toByte())
            }
        }
        return out.toByteArray()
    }

    /**
     * Genera el código TOTP de `digits` dígitos para el instante actual.
     * Acepta `timeSeconds` explícito para pruebas.
     */
    fun generate(
        secret: String,
        timeSeconds: Long = System.currentTimeMillis() / 1000L,
        period: Int = 30,
        digits: Int = 6,
    ): String {
        val counter = timeSeconds / period
        val key = base32Decode(secret)
        if (key.isEmpty()) throw IllegalArgumentException("Secreto TOTP vacío o inválido")

        val counterBytes = ByteArray(8)
        for (i in 7 downTo 0) counterBytes[i] = (counter ushr (i * 8)).toByte()

        val mac = Mac.getInstance("HmacSHA1")
        mac.init(SecretKeySpec(key, "HmacSHA1"))
        val hash = mac.doFinal(counterBytes)

        val offset = hash[hash.size - 1].toInt() and 0x0F
        val binary = ((hash[offset].toInt() and 0x7F) shl 24) or
            ((hash[offset + 1].toInt() and 0xFF) shl 16) or
            ((hash[offset + 2].toInt() and 0xFF) shl 8) or
            (hash[offset + 3].toInt() and 0xFF)

        return (binary % 10.0.pow(digits)).toLong().toString().padStart(digits, '0')
    }
}
