package mx.labandera.wear

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import kotlin.math.cos
import kotlin.math.sin

/**
 * Retícula de escaneo estilo smartwatch: anillo punteado, marcas en las
 * esquinas y un arco de barrido que gira continuamente.
 */
@SuppressLint("ViewConstructor")
class ScanReticleView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val accent = 0xFF4FC3F7.toInt()

    private val faintPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0x40FFFFFF
        strokeWidth = dp(1f)
    }

    private val ringPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0xB0FFFFFF.toInt()
        strokeWidth = dp(2f)
        pathEffect = DashPathEffect(floatArrayOf(dp(10f), dp(6f)), 0f)
    }

    private val tickPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0xE0FFFFFF.toInt()
        strokeWidth = dp(3f)
        strokeCap = Paint.Cap.ROUND
    }

    private val sweepPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = accent
        strokeWidth = dp(3f)
        strokeCap = Paint.Cap.ROUND
    }

    private var sweepAngle = 0f
    private val animator = object : Runnable {
        override fun run() {
            sweepAngle = (sweepAngle + 3f) % 360f
            invalidate()
            postDelayed(this, 33L)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (visibility == VISIBLE) post(animator)
    }

    /**
     * Detiene el animador cuando la vista se oculta (p. ej. al mostrar el
     * panel del código) y lo reanuda al volver a ser visible, para no
     * seguir gastando CPU/batería en un view que no se dibuja.
     */
    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, visibility)
        if (visibility == VISIBLE) {
            removeCallbacks(animator)
            post(animator)
        } else {
            removeCallbacks(animator)
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        removeCallbacks(animator)
    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    override fun onDraw(canvas: Canvas) {
        val cx = width / 2f
        val cy = height / 2f
        val radius = minOf(width, height) / 2f - dp(6f)

        // Anillo guía tenue
        canvas.drawCircle(cx, cy, radius, faintPaint)

        // Anillo punteado principal
        canvas.drawCircle(cx, cy, radius, ringPaint)

        // Marcas en las diagonales (esquinas del retículo)
        for (angleDeg in intArrayOf(45, 135, 225, 315)) {
            val rad = Math.toRadians(angleDeg.toDouble())
            val inner = radius - dp(10f)
            val outer = radius + dp(4f)
            canvas.drawLine(
                cx + inner * cos(rad).toFloat(), cy + inner * sin(rad).toFloat(),
                cx + outer * cos(rad).toFloat(), cy + outer * sin(rad).toFloat(),
                tickPaint
            )
        }

        // Arco de barrido girando
        canvas.drawArc(cx - radius, cy - radius, radius * 2f, radius * 2f, sweepAngle, 70f, false, sweepPaint)
    }
}
