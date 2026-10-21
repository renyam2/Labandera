package mx.labandera.fitsync.phone

import android.os.Bundle
import android.widget.ArrayAdapter
import androidx.appcompat.app.AppCompatActivity
import mx.labandera.fitsync.phone.databinding.ActivityHistoryBinding
import mx.labandera.fitsync.phone.model.ActivityRepository
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Pantalla de historial (Actividad 4): lista los registros válidos
 * guardados en el repositorio local del teléfono.
 */
class HistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHistoryBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val repository = ActivityRepository(this)
        val records = repository.all()

        val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault())
        val items = records.map {
            String.format(
                "%s · %s%nHR %d bpm · %d pasos · %d s",
                it.id.take(8),
                dateFormat.format(Date(it.timestamp)),
                it.heartRate,
                it.steps,
                it.durationSeconds
            )
        }

        binding.recordsList.adapter =
            ArrayAdapter(this, android.R.layout.simple_list_item_1, items)
        binding.emptyView.visibility =
            if (records.isEmpty()) android.view.View.VISIBLE else android.view.View.GONE
        binding.countText.text = getString(R.string.records_count, records.size)
    }
}
