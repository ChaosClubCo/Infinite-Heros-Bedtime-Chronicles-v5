package com.example.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val BedtimeDarkColorScheme = darkColorScheme(
    primary = DeepViolet,
    onPrimary = Color.White,
    primaryContainer = SurfaceElevated,
    onPrimaryContainer = StarlightGold,
    secondary = StarlightGold,
    onSecondary = DeepIndigoBg,
    secondaryContainer = SurfaceElevated,
    onSecondaryContainer = Color.White,
    tertiary = CelestialPurple,
    onTertiary = Color.White,
    background = DeepIndigoBg,
    onBackground = TextPrimary,
    surface = SurfaceDark,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceElevated,
    onSurfaceVariant = TextSecondary,
    outline = CardBorder
)

@Composable
fun BedtimeChroniclesTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = BedtimeDarkColorScheme,
        typography = Typography,
        content = content
    )
}
