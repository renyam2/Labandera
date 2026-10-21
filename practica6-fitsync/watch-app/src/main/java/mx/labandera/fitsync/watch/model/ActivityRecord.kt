package mx.labandera.fitsync.watch.model

import java.util.UUID

/**
 * Modelo de datos: registro de actividad física (Actividad 1).
 *
 * Campos:
 * - id: identificador único (UUID) para detectar duplicados.
 * - timestamp: fecha y hora de la medición (epoch millis).
 * - heartRate: frecuencia cardiaca simulada (bpm).
 * - steps: número de pasos.
 * - durationSeconds: duración de la actividad (segundos).
 */
data class ActivityRecord(
    val id: String,
    val timestamp: Long,
    val heartRate: Int,
    val steps: Int,
    val durationSeconds: Int
) {
    companion object {
        // Rango plausible de frecuencia cardiaca para la simulación
        const val MIN_HEART_RATE = 30
        const val MAX_HEART_RATE = 220

        // La fecha debe ser válida: no antes de 2000-01-01 y no en el futuro
        const val MIN_TIMESTAMP = 946_684_800_000L // 2000-01-01T00:00:00Z
        const val FUTURE_TOLERANCE_MS = 5 * 60 * 1000L // 5 min de tolerancia

        /** Genera una medición simulada con identificador único. */
        fun generateSimulated(): ActivityRecord {
            val rnd = java.util.concurrent.ThreadLocalRandom.current()
            return ActivityRecord(
                id = UUID.randomUUID().toString(),
                timestamp = System.currentTimeMillis(),
                heartRate = rnd.nextInt(MIN_HEART_RATE, MAX_HEART_RATE + 1),
                steps = rnd.nextInt(0, 15_001),
                durationSeconds = rnd.nextInt(300, 5_401)
            )
        }

        /**
         * Reglas de validación (Actividad 1).
         * Devuelve la lista de errores; vacía si el registro es válido.
         */
        fun validate(record: ActivityRecord): List<String> {
            val errors = mutableListOf<String>()
            if (record.id.isBlank()) {
                errors.add("identificador vacío")
            }
            if (record.timestamp < MIN_TIMESTAMP ||
                record.timestamp > System.currentTimeMillis() + FUTURE_TOLERANCE_MS) {
                errors.add("fecha inválida")
            }
            if (record.steps < 0) {
                errors.add("pasos negativos")
            }
            if (record.durationSeconds < 0) {
                errors.add("duración negativa")
            }
            if (record.heartRate < MIN_HEART_RATE || record.heartRate > MAX_HEART_RATE) {
                errors.add("frecuencia cardiaca fuera de rango (${MIN_HEART_RATE}–${MAX_HEART_RATE} bpm)")
            }
            return errors
        }
    }
}
