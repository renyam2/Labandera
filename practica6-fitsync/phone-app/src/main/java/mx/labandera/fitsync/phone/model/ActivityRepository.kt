package mx.labandera.fitsync.phone.model

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * Almacén local de registros de actividad en el teléfono.
 * Persiste la lista como JSON en SharedPreferences.
 */
class ActivityRepository(context: Context) {

    private val prefs = context.getSharedPreferences("fitsync_records", Context.MODE_PRIVATE)
    private val gson = Gson()

    private fun load(): MutableList<ActivityRecord> =
        gson.fromJson(
            prefs.getString("records", "[]"),
            object : TypeToken<MutableList<ActivityRecord>>() {}.type
        ) ?: mutableListOf()

    /** Todos los registros guardados, del más reciente al más antiguo. */
    fun all(): List<ActivityRecord> = load().sortedByDescending { it.timestamp }

    /** Detecta duplicados por identificador. */
    fun contains(id: String): Boolean = load().any { it.id == id }

    /** Guarda un registro; devuelve false si ya existe uno con el mismo id. */
    fun save(record: ActivityRecord): Boolean {
        val records = load()
        if (records.any { it.id == record.id }) return false
        records.add(record)
        prefs.edit().putString("records", gson.toJson(records)).apply()
        return true
    }
}
