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

        if (prefs.contains("secret")) showCodePanel() else requestCameraAndScan()
    }

    // ── Escaneo del QR ──────────────────────────────────────────────────────

    private fun requestCameraAndScan() {
        binding.codePanel.visibility = View.GONE
        binding.previewView.visibility = View.VISIBLE
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
                    prefs.edit()
                        .putString("secret", config.secret)
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
        binding.codeText.text = Totp.generate(secret, nowSeconds, period, digits)
        binding.countdownText.text = getString(R.string.countdown_format, remaining)
    }

    private fun confirmReset() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reset_title)
            .setMessage(R.string.reset_message)
            .setPositiveButton(R.string.reset_confirm) { _, _ ->
                prefs.edit().clear().apply()
                handler.removeCallbacks(tick)
                requestCameraAndScan()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    override fun onDestroy() {
        handler.removeCallbacks(tick)
        stopCamera()
        barcodeScanner?.close()
        cameraExecutor.shutdown()
        super.onDestroy()
    }
}