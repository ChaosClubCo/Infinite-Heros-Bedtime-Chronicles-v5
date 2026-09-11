package com.example.theme

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

// Cosmic Bedtime Palette (Dark Default)
val DeepIndigoBg = Color(0xFF08081E)
val SurfaceDark = Color(0xFF10102E)
val SurfaceElevated = Color(0xFF191942)
val CardBorder = Color(0xFF2E2E6B)

val StarlightGold = Color(0xFFFFD54F)
val StarlightGoldLight = Color(0xFFFFF176)
val CelestialPurple = Color(0xFFA855F7)
val DeepViolet = Color(0xFF6366F1)
val NebulaBlue = Color(0xFF38BDF8)
val OceanTeal = Color(0xFF4DD0E1)
val RoseBlush = Color(0xFFEC4899)
val EmeraldDream = Color(0xFFA5D6A7)

val TextPrimary = Color(0xFFF1F5F9)
val TextSecondary = Color(0xFF94A3B8)
val TextMuted = Color(0xFF64748B)

val AccentAmber = Color(0xFFF59E0B)
val SleepyIndigo = Color(0xFF4338CA)

// High Contrast Light Mode Palette (Daytime)
val LightCanvasBg = Color(0xFFF8FAFC)
val LightSurface = Color(0xFFFFFFFF)
val LightSurfaceElevated = Color(0xFFF1F5F9)
val LightCardBorder = Color(0xFFCBD5E1)
val LightTextPrimary = Color(0xFF0F172A)
val LightTextSecondary = Color(0xFF334155)
val LightTextMuted = Color(0xFF64748B)
val LightAccentGold = Color(0xFFB45309)
val LightAccentPrimary = Color(0xFF4338CA)
val LightAccentPurple = Color(0xFF7E22CE)

data class BedtimePalette(
    val isDark: Boolean,
    val background: Color,
    val surface: Color,
    val surfaceElevated: Color,
    val surfaceDeep: Color,
    val cardBorder: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val accentGold: Color,
    val accentPrimary: Color,
    val accentPurple: Color,
    val cardBackground: Color,
    val skyGradientTop: Color,
    val skyGradientBottom: Color,
    val inputBackground: Color
)

val DarkBedtimePalette = BedtimePalette(
    isDark = true,
    background = DeepIndigoBg,
    surface = SurfaceDark,
    surfaceElevated = SurfaceElevated,
    surfaceDeep = Color(0xFF131338),
    cardBorder = CardBorder,
    textPrimary = TextPrimary,
    textSecondary = TextSecondary,
    textMuted = TextMuted,
    accentGold = StarlightGold,
    accentPrimary = DeepViolet,
    accentPurple = CelestialPurple,
    cardBackground = SurfaceElevated,
    skyGradientTop = Color(0xFF08081E),
    skyGradientBottom = Color(0xFF16163F),
    inputBackground = Color(0xFF10102E)
)

val LightBedtimePalette = BedtimePalette(
    isDark = false,
    background = LightCanvasBg,
    surface = LightSurface,
    surfaceElevated = LightSurfaceElevated,
    surfaceDeep = LightSurface,
    cardBorder = LightCardBorder,
    textPrimary = LightTextPrimary,
    textSecondary = LightTextSecondary,
    textMuted = LightTextMuted,
    accentGold = LightAccentGold,
    accentPrimary = LightAccentPrimary,
    accentPurple = LightAccentPurple,
    cardBackground = LightSurface,
    skyGradientTop = Color(0xFFF8FAFC),
    skyGradientBottom = Color(0xFFE2E8F0),
    inputBackground = Color(0xFFFFFFFF)
)

val LocalBedtimePalette = staticCompositionLocalOf { DarkBedtimePalette }

