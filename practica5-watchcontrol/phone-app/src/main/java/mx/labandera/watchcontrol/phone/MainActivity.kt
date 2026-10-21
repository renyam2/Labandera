package mx.labandera.watchcontrol.phone

import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import android.net.Uri
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable

/**
 * App del teléfono: envía comandos de entrenamiento al reloj
 * (START / PAUSE / STOP) por el Wearable Data Layer (MessageClient)
 * y escucha el ACK que responde el reloj en /training/ack.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val TAG = "WatchControlPhone"
        const val PATH_COMMAND = "/training"
        const val PATH_ACK = "/training/ack"
    }

    private lateinit var messageClient: MessageClient
    private lateinit var statusView: TextView
    private var peerNodeId: String? = null

    private val ackListener = object : MessageClient.OnMessageReceivedListener {
        override fun onMessageReceived(event: MessageEvent) {
            val ack = String(event.data)
            runOnUiThread {
                Log.i(TAG, "ACK recibido del reloj: $ack")
                statusView.text = "Reloj: $ack"
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusView = findViewById(R.id.responseText)
        findViewById<Button>(R.id.startButton).setOnClickListener { sendCommand("START") }
        findViewById<Button>(R.id.pauseButton).setOnClickListener { sendCommand("PAUSE") }
        findViewById<Button>(R.id.stopButton).setOnClickListener { sendCommand("STOP") }
        findViewById<Button>(R.id.invalidButton).setOnClickListener { sendCommand("JUMP") }

        // Cliente del Wearable Data Layer
        messageClient = Wearable.getMessageClient(this)
        messageClient.addListener(ackListener, Uri.parse(PATH_ACK), MessageClient.FILTER_LITERAL)
            .addOnCompleteListener {
            if (it.isSuccessful) {
                Log.i(TAG, "Escuchando ACKs en $PATH_ACK")
            } else {
                Log.e(TAG, "No se pudo registrar listener: ${it.exception?.message}")
            }
        }

        // Descubrir el nodo del reloj conectado
        Wearable.getNodeClient(this).connectedNodes
            .addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    Log.w(TAG, "Wearable no disponible: ${task.exception?.message}")
                    statusView.text = "Wear OS no disponible en este dispositivo."
                    return@addOnCompleteListener
                }
                val nodes = task.result
                if (nodes.isNullOrEmpty()) {
                    statusView.text = "Sin reloj conectado. Empareja el Wear OS con este teléfono."
                    Log.w(TAG, "No hay nodos conectados")
                } else {
                    peerNodeId = nodes[0].id
                    statusView.text = "Reloj conectado: ${nodes[0].displayName}"
                    Log.i(TAG, "Nodo del reloj: ${nodes[0].id}")
                }
            }
    }

    private fun sendCommand(command: String) {
        val nodeId = peerNodeId
        if (nodeId == null) {
            statusView.text = "No hay reloj conectado. No se puede enviar $command."
            Log.w(TAG, "Comando $command sin destino: no hay nodos conectados")
            return
        }
        messageClient.sendMessage(nodeId, PATH_COMMAND, command.toByteArray())
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.i(TAG, "Comando $command enviado al reloj (${task.result} bytes)")
                    statusView.text = "Enviado: $command (esperando ACK…)"
                } else {
                    Log.e(TAG, "Error enviando $command: ${task.exception?.message}")
                    statusView.text = "Error enviando $command"
                }
            }
    }

    override fun onDestroy() {
        super.onDestroy()
        messageClient.removeListener(ackListener)
    }
}
