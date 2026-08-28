package com.example.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.example.theme.LocalBedtimePalette
import kotlin.random.Random

private data class Star(
    val xRatio: Float,
    val yRatio: Float,
    val radius: Float,
    val baseAlpha: Float
)

@Composable
fun StarrySkyBackground(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val palette = LocalBedtimePalette.current
    val infiniteTransition = rememberInfiniteTransition(label = "stars")
    val twinkle = infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "twinkle"
    )

    val stars = remember {
        List(45) {
            Star(
                xRatio = Random.nextFloat(),
                yRatio = Random.nextFloat(),
                radius = Random.nextFloat() * 2f + 1f,
                baseAlpha = Random.nextFloat() * 0.5f + 0.3f
            )
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            if (palette.isDark) {
                // Deep cosmic gradient for dark bedtime mode
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF08081E),
                            Color(0xFF0F0F30),
                            Color(0xFF16163F)
                        )
                    )
                )

                // Draw twinkling stars
                val width = size.width
                val height = size.height

                for (star in stars) {
                    val alpha = (star.baseAlpha * twinkle.value).coerceIn(0.1f, 1.0f)
                    drawCircle(
                        color = Color.White.copy(alpha = alpha),
                        radius = star.radius,
                        center = Offset(star.xRatio * width, star.yRatio * height)
                    )
                }
            } else {
                // High contrast clean daytime canvas
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFFF8FAFC),
                            Color(0xFFF1F5F9),
                            Color(0xFFE2E8F0)
                        )
                    )
                )

                // Subtle daytime sparkles for charm while preserving high contrast
                val width = size.width
                val height = size.height

                for (star in stars.take(15)) {
                    val alpha = (star.baseAlpha * 0.3f * twinkle.value).coerceIn(0.05f, 0.25f)
                    drawCircle(
                        color = Color(0xFF6366F1).copy(alpha = alpha),
                        radius = star.radius * 0.8f,
                        center = Offset(star.xRatio * width, star.yRatio * height)
                    )
                }
            }
        }
        content()
    }
}

