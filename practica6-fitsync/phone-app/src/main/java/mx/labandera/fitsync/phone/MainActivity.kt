package mx.labandera.fitsync.phone

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Node
import com.google.android.gms.wearable.Wearable
import com.google.gson.Gson
import mx.labandera.fitsync.phone.databinding.ActivityMainBinding
import mx.labandera.fitsync.phone.model.ActivityRecord
import mx.labandera.fitsync.phone.model.ActivityRepository

class MainActivity : AppCompatActivity() {

    companion object {
        const val TAG = "FitSyncPhone"
        const val PATH_ACTIVITY = "/activity"
    }

    private lateinit var binding: ActivityMainBinding
    private lateinit var messageClient: MessageClient
    private lateinit var repository: ActivityRepository

    private val listener = object : MessageClient.OnMessageReceivedListener {
        override fun onMessageReceived(event: MessageEvent) {
            Log.i(TAG, "Mensaje recibido: path=${event.path} de ${event.sourceNodeId}")
            if (event.path != PATH_ACTIVITY) return
            val result = processRecord(String(event.data, Charsets.UTF_8))
            Log.i(TAG, "Resultado: $result")
            runOnUiThread {
                binding.lastResult.text = result
                Toast.makeText(this@MainActivity, result, Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        repository = ActivityRepository(this)
        messageClient = Wearable.getMessageClient(this)

        // Sin filtro de URI: se comprueba la ruta dentro del listener
        messageClient.addListener(listener).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                Log.i(TAG, "Escuchando mensajes (ruta $PATH_ACTIVITY)")
            } else {
                Log.e(TAG, "No se pudo registrar el listener: ${task.exception?.message}")
            }
        }

        binding.historyButton.setOnClickListener {
            startActivity(Intent(this, HistoryActivity::class.java))
        }

        updateCount()
        refreshConnection()
    }

    private fun processRecord(json: String): String {
        val record: ActivityRecord? = try {
            Gson().fromJson(json, ActivityRecord::class.java)
        } catch (e: Exception) {
            return "INVÁLIDO: no se pudo deserializar el JSON (${e.message})"
        }
        if (record == null) return "INVÁLIDO: JSON vacío"

        val errors = ActivityRecord.validate(record)
        if (errors.isNotEmpty()) {
            return "INVÁLIDO: ${errors.joinToString(", ")}"
        }

        if (repository.contains(record.id)) {
            return "DUPLICADO: el registro ${record.id.take(8)}… ya existe en el historial"
        }

        repository.save(record)
        runOnUiThread { updateCount() }
        return "REGISTRADO: ${record.id.take(8)}… (HR ${record.heartRate} bpm, ${record.steps} pasos, ${record.durationSeconds} s)"
    }

    private fun updateCount() {
        binding.recordCount.text = getString(R.string.records_count, repository.all().size)
    }

    private fun refreshConnection() {
        Wearable.getNodeClient(this).getConnectedNodes()
            .addOnCompleteListener { task ->
                val nodes: List<Node> =
                    if (task.isSuccessful) task.result ?: emptyList() else emptyList()
                val connected = nodes.any { it.isNearby }
                binding.connectionStatus.text =
                    if (connected) getString(R.string.watch_connected)
                    else getString(R.string.watch_not_connected)
            }
    }

    override fun onResume() {
        super.onResume()
        refreshConnection()
    }

    override fun onDestroy() {
        super.onDestroy()
        messageClient.removeListener(listener)
    }
}