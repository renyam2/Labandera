package mx.labandera.wear

import android.Manifest
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import mx.labandera.wear.databinding.ActivityMainBinding
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val prefs: SharedPreferences by lazy {
        getSharedPreferences("labandera_totp", MODE_PRIVATE)
    }
    private val handler = Handler(Looper.getMainLooper())
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var barcodeScanner: BarcodeScanner? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var cameraBound = false
    private var lastInvalidSecret: String? = null
    private var codeErrorShown = false

    private val cameraPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) startCamera()
        }

    private val tick = object : Runnable {
        override fun run() {
            updateCode()
            handler.postDelayed(this, 1000L)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.resetButton.setOnClickListener { confirmReset() }
        binding.manualButton.setOnClickListener { showManualInput() }

        if (prefs.contains("secret")) showCodePanel() else requestCameraAndScan()
    }

    // ── Escaneo del QR ──────────────────────────────────────────────────────

    private fun requestCameraAndScan() {
        binding.codePanel.visibility = View.GONE
        binding.previewView.visibility = View.VISIBLE
        binding.scanReticle.visibility = View.VISIBLE
        binding.scanHint.visibility = View.VISIBLE

        val granted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
        if (granted) startCamera() else cameraPermission.launch(Manifest.permission.CAMERA)
    }

    private fun startCamera() {
        if (cameraBound) return

        barcodeScanner = BarcodeScanning.getClient()
        val future = ProcessCameraProvider.getInstance(this)
        future.addListener({
            val provider = future.get()
            cameraProvider = provider

            // Elegir una cámara que exista en este dispositivo
            val selector = try {
                when {
                    provider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA) ->
                        CameraSelector.DEFAULT_BACK_CAMERA
                    provider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA) ->
                        CameraSelector.DEFAULT_FRONT_CAMERA
                    else -> null
                }
            } catch (e: Exception) {
                Log.e("Camera", "Error consultando cámaras", e)
                null
            }

            if (selector == null) {
                Log.w("Camera", "Este dispositivo no tiene cámara")
                Toast.makeText(this, "Este dispositivo no tiene cámara", Toast.LENGTH_LONG).show()
                return@addListener
            }

            val preview = Preview.Builder().build()
            preview.setSurfaceProvider(binding.previewView.surfaceProvider)

            val analysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
            analysis.setAnalyzer(cameraExecutor) { image -> analyzeFrame(image) }

            try {
                provider.unbindAll()
                provider.bindToLifecycle(this, selector, preview, analysis)
                cameraBound = true
            } catch (e: Exception) {
                Log.e("Camera", "No se pudo iniciar la cámara", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }
    @androidx.annotation.OptIn(ExperimentalGetImage::class)
    private fun analyzeFrame(image: ImageProxy) {
        val scanner = barcodeScanner
        val mediaImage = image.image
        if (scanner == null || mediaImage == null || prefs.contains("secret")) {
            image.close()
            return
        }
        val input = InputImage.fromMediaImage(mediaImage, image.imageInfo.rotationDegrees)
        scanner.process(input)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    val raw = barcode.rawValue ?: continue
                    val config = OtpauthParser.parse(raw) ?: continue
                    val secret = config.secret.uppercase()
                    try {
                        Totp.base32Decode(secret)
                    } catch (e: IllegalArgumentException) {
                        // Evita spam de toasts si la cámara sigue detectando el mismo QR.
                        if (raw != lastInvalidSecret) {
                            lastInvalidSecret = raw
                            Toast.makeText(this, "Secreto TOTP inválido: ${e.message}", Toast.LENGTH_LONG).show()
                        }
                        return@addOnSuccessListener // sigue escaneando
                    }
                    prefs.edit()
                        .putString("secret", secret)
                        .putString("account", config.account)
                        .putString("issuer", config.issuer)
                        .putInt("digits", config.digits)
                        .putInt("period", config.period)
                        .apply()
                    handler.post { onSecretSaved() }
                    return@addOnSuccessListener
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
        binding.scanReticle.visibility = View.GONE
        binding.scanHint.visibility = View.GONE
        binding.codePanel.visibility = View.VISIBLE
        binding.accountText.text = prefs.getString("account", "")
        updateCode()
        handler.removeCallbacks(tick)
        handler.postDelayed(tick, 1000L)
    }

    private fun updateCode() {
        val secret = prefs.getString("secret", null) ?: return
        val digits = prefs.getInt("digits", 6)
        val period = prefs.getInt("period", 30)
        val nowSeconds = System.currentTimeMillis() / 1000L
        val remaining = period - (nowSeconds % period)
        try {
            binding.codeText.text = Totp.generate(secret, nowSeconds, period, digits)
            codeErrorShown = false
        } catch (e: IllegalArgumentException) {
            // Secreto guardado inválido (p. ej. de una versión anterior): no tumbar la app.
            binding.codeText.text = "—"
            if (!codeErrorShown) {
                codeErrorShown = true
                Toast.makeText(this, "Secreto TOTP guardado es inválido: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
        binding.countdownText.text = getString(R.string.countdown_format, remaining)
        binding.codeRing.setProgress(remaining.toFloat() / period)
    }

    private fun confirmReset() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reset_title)
            .setMessage(R.string.reset_message)
            .setPositiveButton(R.string.reset_confirm) { _, _ ->
                prefs.edit().clear().apply()
                lastInvalidSecret = null
                codeErrorShown = false
                handler.removeCallbacks(tick)
                requestCameraAndScan()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    // ── Entrada manual del secreto ──────────────────────────────────────────

    private fun showManualInput() {
        val secretInput = EditText(this).apply {
            hint = getString(R.string.manual_secret_label)
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                android.text.InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
            textSize = 14f
            height = 48
        }
        val accountInput = EditText(this).apply {
            hint = getString(R.string.manual_account_label)
            textSize = 14f
            height = 48
        }

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 8, 40, 0)
            addView(secretInput)
            addView(accountInput)
        }

        val dialog = MaterialAlertDialogBuilder(this)
            .setView(ScrollView(this).apply { addView(layout) })
            .setNegativeButton(R.string.cancel, null)
            .create()
        dialog.setButton(
            android.content.DialogInterface.BUTTON_POSITIVE,
            getString(R.string.manual_save),
            android.content.DialogInterface.OnClickListener { _, _ ->
                val secret = secretInput.text.toString().trim().uppercase()
                val account = accountInput.text.toString().trim().ifEmpty { "usuario" }
                if (secret.isEmpty()) {
                    Toast.makeText(this, "El secreto no puede estar vacío", Toast.LENGTH_SHORT).show()
                    return@OnClickListener
                }
                try {
                    Totp.base32Decode(secret)
                } catch (e: IllegalArgumentException) {
                    Toast.makeText(this, "Secreto no válido (Base32): ${e.message}", Toast.LENGTH_LONG).show()
                    return@OnClickListener
                }
                prefs.edit()
                    .putString("secret", secret)
                    .putString("account", account)
                    .putString("issuer", "Labandera")
                    .putInt("digits", 6)
                    .putInt("period", 30)
                    .apply()
                dialog.dismiss()
                onSecretSaved()
            }
        )
        dialog.show()
        // En Wear la ventana del diálogo es demasiado pequeña; se hace a pantalla completa
        dialog.window?.setLayout(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT
        )
    }

    override fun onDestroy() {
        handler.removeCallbacks(tick)
        stopCamera()
        barcodeScanner?.close()
        cameraExecutor.shutdown()
        super.onDestroy()
    }
}