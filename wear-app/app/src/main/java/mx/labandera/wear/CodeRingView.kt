package mx.labandera.wear

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View

/**
 * Anillo de progreso circular para el countdown del código TOTP:
 * el arco azul se va "comiendo" conforme faltan menos segundos.
 */
@SuppressLint("ViewConstructor")
class CodeRingView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val trackPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0x33FFFFFF
        strokeWidth = dp(5f)
    }

    private val progressPaint = Paint().apply {
        setAntiAlias(true)
        style = Paint.Style.STROKE
        color = 0xFF4FC3F7.toInt()
        strokeWidth = dp(5f)
        strokeCap = Paint.Cap.ROUND
    }

    private var progress = 0f

    fun setProgress(p: Float) {
        progress = p.coerceIn(0f, 1f)
        invalidate()
    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    override fun onDraw(canvas: Canvas) {
        val cx = width / 2f
        val cy = height / 2f
        val radius = minOf(width, height) / 2f - dp(4f)
        val rect = android.graphics.RectF(cx - radius, cy - radius, cx + radius, cy + radius)

        canvas.drawCircle(cx, cy, radius, trackPaint)
        if (progress > 0f) {
            // Empieza en la parte superior (-90°)
            canvas.drawArc(rect, -90f, -360f * progress, false, progressPaint)
        }
    }
}
