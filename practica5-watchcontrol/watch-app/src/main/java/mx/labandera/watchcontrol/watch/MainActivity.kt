package mx.labandera.watchcontrol.watch

import android.os.Bundle
import android.util.Log
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable

/**
 * App del reloj (Wear OS): recibe comandos de entrenamiento del teléfono
 * (START / PAUSE / STOP), valida la transición de estado y responde
 * con un ACK en /training/ack.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val TAG = "WatchControlWatch"
        const val PATH_COMMAND = "/training"
        const val PATH_ACK = "/training/ack"
    }

    private enum class SessionState { IDLE, RUNNING, PAUSED }

    private var state: SessionState = SessionState.IDLE
    private lateinit var messageClient: MessageClient
    private lateinit var stateView: TextView
    private lateinit var lastCommandView: TextView
    private lateinit var lastAckView: TextView

    private val commandListener = object : MessageClient.OnMessageReceivedListener {
        override fun onMessageReceived(event: MessageEvent) {
            val command = String(event.data)
            Log.i(TAG, "Comando recibido del teléfono: $command (de nodo ${event.sourceNodeId})")

            val ack = when (command) {
                "START" -> if (state == SessionState.IDLE) {
                    state = SessionState.RUNNING; "OK: sesión iniciada"
                } else "RECHAZADO: ya hay una sesión activa"

                "PAUSE" -> if (state == SessionState.RUNNING) {
                    state = SessionState.PAUSED; "OK: sesión en pausa"
                } else "RECHAZADO: no hay sesión en curso"

                "STOP" -> if (state != SessionState.IDLE) {
                    state = SessionState.IDLE; "OK: sesión terminada"
                } else "RECHAZADO: no hay sesión activa"

                else -> "RECHAZADO: comando desconocido '$command'"
            }

            Log.i(TAG, "Estado actual: $state → ACK: $ack")
            stateView.text = state.name
            lastCommandView.text = command
            lastAckView.text = ack

            // Responder al nodo que envió el comando
            messageClient.sendMessage(event.sourceNodeId, PATH_ACK, ack.toByteArray())
                .addOnCompleteListener { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Error enviando ACK: ${task.exception?.message}")
                    }
                }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        stateView = findViewById(R.id.stateText)
        lastCommandView = findViewById(R.id.lastCommandText)
        lastAckView = findViewById(R.id.lastAckText)
        stateView.text = SessionState.IDLE.name

        // Cliente del Wearable Data Layer
        messageClient = Wearable.getMessageClient(this)
        messageClient.addListener(commandListener).addOnCompleteListener {
            if (it.isSuccessful) {
                Log.i(TAG, "Escuchando comandos en $PATH_COMMAND")
            } else {
                Log.e(TAG, "No se pudo registrar listener: ${it.exception?.message}")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        messageClient.removeListener(commandListener)
    }
}
