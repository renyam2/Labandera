package mx.labandera.wear

import android.content.SharedPreferences
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.wear.widget.WearableActivity
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.mlkit.vision.barcode.BarcodeScanning
import mx.labandera.wear.databinding.ActivityMainBinding
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * App de Wear OS para el segundo factor de Labandera.
 *
 * Flujo:
 *  1. Sin secreto guardado → abre la cámara y escanea el QR de la página
 *     `/security` del sitio (URI `otpauth://` generada por el backend).
 *  2. Con secreto guardado → muestra el código TOTP de 6 dígitos con
 *     countdown de 30 s, listo para escribirlo en el login web.
 */
class MainActivity : WearableActivity() {

    private lateinit var binding: ActivityMainBinding
    private val prefs: SharedPreferences by lazy {
        getSharedPreferences("labandera_totp", MODE_PRIVATE)
    }
    private val handler = Handler(Looper.getMainLooper())
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var barcodeScanner: BarcodeScanning? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var cameraBound = false

    private val tick = object : Runnable {
        override fun run() {
            updateCode()
            handler.postDelayed(this, 1000L)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.resetButton.setOnClickListener { confirmReset() }

        if (prefs.contains("secret")) {
            showCodePanel()
        } else {
            startCamera()
        }
    }

    // ── Escaneo del QR ──────────────────────────────────────────────────────

    private fun startCamera() {
        binding.codePanel.visibility = View.GONE
        binding.previewView.visibility = View.VISIBLE
        binding.scanHint.visibility = View.VISIBLE
        if (cameraBound) return

        barcodeScanner = BarcodeScanning.getClient()
        ProcessCameraProvider.getInstance(this)
            .addListener { provider ->
                cameraProvider = provider
                val preview = Preview.Builder().build()
                val analysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setAnalyzer(cameraExecutor) { image -> analyzeFrame(image) }
                    .build()
                provider.bindToLifecycle(
                    this,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    analysis,
                )
                cameraBound = true
            }
            .get()
    }

    private fun analyzeFrame(image: ImageProxy) {
        val scanner = barcodeScanner ?: return
        scanner.process(image.image)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    val raw = barcode.rawValue ?: continue
                    val config = OtpauthParser.parse(raw) ?: continue
                    prefs.edit()
                        .putString("secret", config.secret)
                        .putString("account", config.account)
                        .putString("issuer", config.issuer)
                        .putInt("digits", config.digits)
                        .putInt("period", config.period)
                        .apply()
                    handler.post { onSecretSaved() }
                    return
                }
            }
            .addOnCompleteListener { image.close() }
    }

    private fun onSecretSaved() {
        stopCamera()
        showCodePanel()
    }

    private fun stopCamera() {
        cameraProvider?.unbindAll()
        cameraProvider = null
        cameraBound = false
    }

    // ── Panel del código ─────────────────────────────────────────────────────

    private fun showCodePanel() {
        binding.previewView.visibility = View.GONE
        binding.scanHint.visibility = View.GONE
        binding.codePanel.visibility = View.VISIBLE
        binding.accountText.text = prefs.getString("account", "")
        updateCode()
        handler.postDelayed(tick, 1000L)
    }

    private fun updateCode() {
        val secret = prefs.getString("secret", null) ?: return
        val digits = prefs.getInt("digits", 6)
        val period = prefs.getInt("period", 30)
        val nowSeconds = System.currentTimeMillis() / 1000L
        val remaining = period - (nowSeconds % period)
        binding.codeText.text = Totp.generate(secret, nowSeconds, period, digits)
        binding.countdownText.text = getString(R.string.countdown_format, remaining)
    }

    private fun confirmReset() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reset_title)
            .setMessage(R.string.reset_message)
            .setPositiveButton(R.string.reset_confirm) { _, _ ->
                prefs.clear()
                showScanMode()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun showScanMode() {
        handler.removeCallbacks(tick)
        binding.codePanel.visibility = View.GONE
        startCamera()
    }

    override fun onDestroy() {
        handler.removeCallbacks(tick)
        stopCamera()
        cameraExecutor.shutdown()
        super.onDestroy()
    }
}
