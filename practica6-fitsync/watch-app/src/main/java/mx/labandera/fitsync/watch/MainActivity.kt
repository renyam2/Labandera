package mx.labandera.fitsync.watch

import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.Node
import com.google.android.gms.wearable.Wearable
import com.google.gson.Gson
import mx.labandera.fitsync.watch.databinding.ActivityMainBinding
import mx.labandera.fitsync.watch.model.ActivityRecord

/**
 * FitSync – lado del smartwatch (Actividad 2).
 *
 * El botón "Registrar actividad" genera una medición simulada con
 * identificador único y la envía al teléfono por la capa de datos
 * (MessageClient, ruta /activity) serializada en JSON.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val TAG = "FitSyncWatch"
        const val PATH_ACTIVITY = "/activity"
    }

    private lateinit var binding: ActivityMainBinding
    private lateinit var messageClient: MessageClient
    private val gson = Gson()
    private var lastRecord: ActivityRecord? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        messageClient = Wearable.getMessageClient(this)

        binding.registerButton.setOnClickListener {
            val record = ActivityRecord.generateSimulated()
            lastRecord = record
            showRecord(record)
            sendMessage(record)
        }

        // Prueba de duplicado: reenvía el último registro (mismo id)
        binding.resendButton.setOnClickListener {
            val record = lastRecord
            if (record == null) {
                Toast.makeText(this, getString(R.string.no_last_record), Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            sendMessage(record)
        }

        // Prueba de registro inválido: pasos negativos
        binding.invalidButton.setOnClickListener {
            val record = ActivityRecord(
                id = java.util.UUID.randomUUID().toString(),
                timestamp = System.currentTimeMillis(),
                heartRate = 120,
                steps = -50,
                durationSeconds = 1200
            )
            showRecord(record)
            sendMessage(record)
        }

        refreshConnection()
    }

    private fun sendMessage(record: ActivityRecord) {
        Wearable.getNodeClient(this).getConnectedNodes()
            .addOnCompleteListener { nodeTask ->
                val nodes: List<Node> = nodeTask.result ?: emptyList()
                val peer = nodes.firstOrNull { it.isNearby }
                if (peer == null) {
                    binding.statusText.text = getString(R.string.phone_not_connected)
                    return@addOnCompleteListener
                }
                val json = gson.toJson(record)
                binding.statusText.text = getString(R.string.sending, record.id.take(8))
                messageClient.sendMessage(peer.id, PATH_ACTIVITY, json.toByteArray(Charsets.UTF_8))
                    .addOnCompleteListener { sendTask ->
                        if (sendTask.isSuccessful) {
                            binding.statusText.text = getString(R.string.sent_ok, record.id.take(8))
                        } else {
                            binding.statusText.text =
                                getString(R.string.send_failed, sendTask.exception?.message ?: "desconocido")
                        }
                    }
            }
    }

    private fun showRecord(record: ActivityRecord) {
        binding.lastRecordText.text = String.format(
            getString(R.string.record_format),
            record.id.take(8),
            record.heartRate,
            record.steps,
            record.durationSeconds
        )
    }

    private fun refreshConnection() {
        Wearable.getNodeClient(this).getConnectedNodes()
            .addOnCompleteListener { task ->
                val nodes: List<Node> = task.result ?: emptyList()
                val connected = nodes.any { it.isNearby }
                binding.connectionStatus.text =
                    if (connected) getString(R.string.phone_connected)
                    else getString(R.string.phone_not_connected)
            }
    }

    override fun onResume() {
        super.onResume()
        refreshConnection()
    }
}
