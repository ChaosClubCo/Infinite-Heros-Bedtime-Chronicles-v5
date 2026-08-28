package com.example.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
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

private val BedtimeLightColorScheme = lightColorScheme(
    primary = LightAccentPrimary,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE0E7FF),
    onPrimaryContainer = Color(0xFF1E1B4B),
    secondary = LightAccentGold,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFEF3C7),
    onSecondaryContainer = Color(0xFF78350F),
    tertiary = LightAccentPurple,
    onTertiary = Color.White,
    background = LightCanvasBg,
    onBackground = LightTextPrimary,
    surface = LightSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = LightSurfaceElevated,
    onSurfaceVariant = LightTextSecondary,
    outline = LightCardBorder
)

@Composable
fun BedtimeChroniclesTheme(
    useDarkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (useDarkTheme) BedtimeDarkColorScheme else BedtimeLightColorScheme
    val palette = if (useDarkTheme) DarkBedtimePalette else LightBedtimePalette

    CompositionLocalProvider(LocalBedtimePalette provides palette) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}

