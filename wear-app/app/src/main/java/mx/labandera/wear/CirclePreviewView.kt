package mx.labandera.wear

import android.content.Context
import android.graphics.Outline
import android.graphics.Path
import android.util.AttributeSet
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import androidx.camera.core.Preview
import androidx.camera.view.PreviewView

/**
 * Contenedor que recorta un PreviewView a un círculo, para que la cámara
 * se vea como la esfera redonda de un smartwatch (Wear OS).
 *
 * `PreviewView` es una clase final, así que no se puede extender: se envuelve
 * en un FrameLayout y se aplica el outline al PreviewView interno.
 */
class CirclePreviewView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val preview: PreviewView = PreviewView(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        clipToOutline = true
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, existing: Outline) {
                if (view.width <= 0 || view.height <= 0) return
                val radius = minOf(view.width, view.height) / 2f
                val path = Path().apply {
                    addCircle(view.width / 2f, view.height / 2f, radius, Path.Direction.CW)
                }
                existing.setPath(path)
            }
        }
    }

    /** Delega al PreviewView interno para poder crear el [Preview]. */
    val surfaceProvider: Preview.SurfaceProvider
        get() = preview.surfaceProvider

    init {
        addView(preview)
    }
}
